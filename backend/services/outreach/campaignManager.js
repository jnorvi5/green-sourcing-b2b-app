/**
 * Campaign Manager
 * 
 * Handles campaign creation, enrollment, and sequence progression.
 */

class CampaignManager {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Create a new campaign
     */
    async createCampaign(campaignData) {
        const {
            name,
            description,
            campaignType = 'drip',
            targetAudience = 'all',
            settings = {},
            sequences = [],
            createdBy
        } = campaignData;

        if (!name) {
            throw new Error('Campaign name is required');
        }

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Create campaign
            const campaignResult = await client.query(`
        INSERT INTO Outreach_Campaigns (Name, Description, CampaignType, TargetAudience, Settings, CreatedBy)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, description, campaignType, targetAudience, JSON.stringify(settings), createdBy]);

            const campaign = campaignResult.rows[0];

            // Create sequence steps if provided
            if (sequences.length > 0) {
                for (let i = 0; i < sequences.length; i++) {
                    const seq = sequences[i];
                    await client.query(`
            INSERT INTO Outreach_Sequences (CampaignID, StepNumber, DelayDays, EmailSubject, EmailTemplate, TemplateVariables, Conditions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
                        campaign.campaignid,
                        i + 1,
                        seq.delayDays || 0,
                        seq.subject || '',
                        seq.template || 'cold_outreach',
                        JSON.stringify(seq.variables || {}),
                        JSON.stringify(seq.conditions || {})
                    ]);
                }
            }

            await client.query('COMMIT');

            return { success: true, campaign };
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[CampaignManager] Create campaign error:', err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Get campaigns with optional filters
     */
    async getCampaigns(filters = {}) {
        const { status, targetAudience, limit = 50, offset = 0 } = filters;

        let whereConditions = ['1=1'];
        const params = [];
        let paramIndex = 1;

        if (status) {
            whereConditions.push(`Status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (targetAudience) {
            whereConditions.push(`TargetAudience = $${paramIndex}`);
            params.push(targetAudience);
            paramIndex++;
        }

        params.push(limit);
        params.push(offset);

        const result = await this.pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM Outreach_Enrollments WHERE CampaignID = c.CampaignID) as enrollment_count,
        (SELECT COUNT(*) FROM Outreach_Events WHERE CampaignID = c.CampaignID AND EventType = 'sent') as emails_sent,
        (SELECT COUNT(*) FROM Outreach_Events WHERE CampaignID = c.CampaignID AND EventType = 'opened') as emails_opened,
        (SELECT COUNT(*) FROM Outreach_Events WHERE CampaignID = c.CampaignID AND EventType = 'replied') as replies
      FROM Outreach_Campaigns c
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.CreatedAt DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

        return result.rows;
    }

    /**
     * Get single campaign with sequences
     */
    async getCampaign(campaignId) {
        const campaignResult = await this.pool.query(
            'SELECT * FROM Outreach_Campaigns WHERE CampaignID = $1',
            [campaignId]
        );

        if (campaignResult.rows.length === 0) {
            return null;
        }

        const sequencesResult = await this.pool.query(
            'SELECT * FROM Outreach_Sequences WHERE CampaignID = $1 ORDER BY StepNumber',
            [campaignId]
        );

        return {
            ...campaignResult.rows[0],
            sequences: sequencesResult.rows
        };
    }

    /**
     * Update campaign status
     */
    async updateCampaignStatus(campaignId, status) {
        const validStatuses = ['draft', 'active', 'paused', 'completed'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const result = await this.pool.query(`
      UPDATE Outreach_Campaigns 
      SET Status = $1, UpdatedAt = CURRENT_TIMESTAMP
      WHERE CampaignID = $2
      RETURNING *
    `, [status, campaignId]);

        return result.rows[0];
    }

    /**
     * Enroll a contact in a campaign
     */
    async enrollContact(contactId, campaignId) {
        try {
            const result = await this.pool.query(`
        INSERT INTO Outreach_Enrollments (ContactID, CampaignID)
        VALUES ($1, $2)
        ON CONFLICT (ContactID, CampaignID) DO UPDATE SET
          Status = 'active',
          CurrentStep = 1,
          EnrolledAt = CURRENT_TIMESTAMP
        RETURNING *
      `, [contactId, campaignId]);

            return { success: true, enrollment: result.rows[0] };
        } catch (err) {
            console.error('[CampaignManager] Enroll error:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Bulk enroll contacts
     */
    async bulkEnroll(contactIds, campaignId) {
        const results = {
            enrolled: 0,
            skipped: 0,
            errors: []
        };

        for (const contactId of contactIds) {
            const result = await this.enrollContact(contactId, campaignId);
            if (result.success) {
                results.enrolled++;
            } else {
                results.skipped++;
                results.errors.push({ contactId, error: result.error });
            }
        }

        return results;
    }

    /**
     * Get contacts due for next step in a campaign
     */
    async getContactsDueForNextStep(campaignId, limit = 50) {
        // Get campaign with sequences
        const campaign = await this.getCampaign(campaignId);
        if (!campaign || campaign.status !== 'active') {
            return [];
        }

        // Find enrollments that are ready for their next step
        const result = await this.pool.query(`
      SELECT 
        e.EnrollmentID,
        e.ContactID,
        e.CurrentStep,
        e.LastStepAt,
        c.*,
        s.SequenceID,
        s.DelayDays,
        s.EmailSubject,
        s.EmailTemplate,
        s.TemplateVariables,
        s.Conditions
      FROM Outreach_Enrollments e
      JOIN Outreach_Contacts c ON e.ContactID = c.ContactID
      JOIN Outreach_Sequences s ON s.CampaignID = e.CampaignID AND s.StepNumber = e.CurrentStep
      WHERE e.CampaignID = $1
        AND e.Status = 'active'
        AND c.Status NOT IN ('bounced', 'unsubscribed')
        AND (
          e.LastStepAt IS NULL 
          OR e.LastStepAt < NOW() - (s.DelayDays || ' days')::interval
        )
      ORDER BY e.EnrolledAt
      LIMIT $2
    `, [campaignId, limit]);

        return result.rows;
    }

    /**
     * Advance a contact to the next step
     */
    async advanceToNextStep(enrollmentId, campaignId) {
        // Get current enrollment and campaign info
        const enrollmentResult = await this.pool.query(
            'SELECT * FROM Outreach_Enrollments WHERE EnrollmentID = $1',
            [enrollmentId]
        );

        if (enrollmentResult.rows.length === 0) {
            return { success: false, error: 'Enrollment not found' };
        }

        const enrollment = enrollmentResult.rows[0];

        // Get total steps in campaign
        const stepsResult = await this.pool.query(
            'SELECT COUNT(*) as total FROM Outreach_Sequences WHERE CampaignID = $1',
            [campaignId]
        );
        const totalSteps = parseInt(stepsResult.rows[0].total);

        if (enrollment.currentstep >= totalSteps) {
            // Mark as completed
            await this.pool.query(`
        UPDATE Outreach_Enrollments 
        SET Status = 'completed', ExitReason = 'Sequence completed'
        WHERE EnrollmentID = $1
      `, [enrollmentId]);

            return { success: true, completed: true };
        }

        // Advance to next step
        await this.pool.query(`
      UPDATE Outreach_Enrollments 
      SET CurrentStep = CurrentStep + 1, LastStepAt = CURRENT_TIMESTAMP
      WHERE EnrollmentID = $1
    `, [enrollmentId]);

        return { success: true, newStep: enrollment.currentstep + 1 };
    }

    /**
     * Exit a contact from a campaign
     */
    async exitCampaign(contactId, campaignId, reason) {
        await this.pool.query(`
      UPDATE Outreach_Enrollments 
      SET Status = 'exited', ExitReason = $1
      WHERE ContactID = $2 AND CampaignID = $3
    `, [reason, contactId, campaignId]);

        return { success: true };
    }

    /**
     * Check if contact should skip current step based on conditions
     */
    shouldSkipStep(conditions, contactEvents) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return false;
        }

        // Skip if opened previous email
        if (conditions.skipIfOpened) {
            if (contactEvents.some(e => e.eventtype === 'opened')) {
                return true;
            }
        }

        // Skip if replied
        if (conditions.skipIfReplied) {
            if (contactEvents.some(e => e.eventtype === 'replied')) {
                return true;
            }
        }

        // Skip if clicked
        if (conditions.skipIfClicked) {
            if (contactEvents.some(e => e.eventtype === 'clicked')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get default campaign templates
     */
    getDefaultTemplates() {
        return [
            {
                name: 'Supplier Acquisition - 3 Touch',
                description: 'A 3-email sequence to acquire new suppliers',
                targetAudience: 'suppliers',
                sequences: [
                    { delayDays: 0, template: 'cold_outreach', subject: 'Sustainable materials marketplace' },
                    { delayDays: 3, template: 'follow_up', subject: 'Quick follow-up' },
                    { delayDays: 7, template: 're_engagement', subject: 'One last note' }
                ]
            },
            {
                name: 'Buyer Outreach - 2 Touch',
                description: 'A 2-email sequence for buyer leads',
                targetAudience: 'buyers',
                sequences: [
                    { delayDays: 0, template: 'cold_outreach', subject: 'Find verified sustainable suppliers' },
                    { delayDays: 5, template: 'follow_up', subject: 'Still looking for sustainable materials?' }
                ]
            },
            {
                name: 'Certification Reminder',
                description: 'Single email about certification benefits',
                targetAudience: 'suppliers',
                sequences: [
                    { delayDays: 0, template: 'certification_reminder', subject: 'Boost your visibility with certifications' }
                ]
            }
        ];
    }
}

module.exports = CampaignManager;
