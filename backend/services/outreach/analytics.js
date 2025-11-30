/**
 * Outreach Analytics
 * 
 * Tracks and reports on outreach performance.
 */

class Analytics {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Log an outreach event
     */
    async logEvent(eventData) {
        const {
            contactId,
            campaignId,
            sequenceId,
            eventType,
            emailSubject,
            emailBody,
            messageId,
            metadata = {}
        } = eventData;

        const result = await this.pool.query(`
      INSERT INTO Outreach_Events (
        ContactID, CampaignID, SequenceID, EventType, 
        EmailSubject, EmailBody, MessageID, Metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
            contactId, campaignId, sequenceId, eventType,
            emailSubject, emailBody, messageId, JSON.stringify(metadata)
        ]);

        return result.rows[0];
    }

    /**
     * Get events with filters
     */
    async getEvents(filters = {}) {
        const {
            contactId,
            campaignId,
            eventType,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = filters;

        let whereConditions = ['1=1'];
        const params = [];
        let paramIndex = 1;

        if (contactId) {
            whereConditions.push(`e.ContactID = $${paramIndex}`);
            params.push(contactId);
            paramIndex++;
        }

        if (campaignId) {
            whereConditions.push(`e.CampaignID = $${paramIndex}`);
            params.push(campaignId);
            paramIndex++;
        }

        if (eventType) {
            whereConditions.push(`e.EventType = $${paramIndex}`);
            params.push(eventType);
            paramIndex++;
        }

        if (startDate) {
            whereConditions.push(`e.Timestamp >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`e.Timestamp <= $${paramIndex}`);
            params.push(endDate);
            paramIndex++;
        }

        params.push(limit);
        params.push(offset);

        const result = await this.pool.query(`
      SELECT e.*, c.Email, c.FirstName, c.LastName, c.Company
      FROM Outreach_Events e
      LEFT JOIN Outreach_Contacts c ON e.ContactID = c.ContactID
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY e.Timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

        return result.rows;
    }

    /**
     * Get summary analytics for a time period
     */
    async getSummary(period = 'last_30_days') {
        const dateFilter = this.getDateFilter(period);

        const result = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE EventType = 'sent') as emails_sent,
        COUNT(*) FILTER (WHERE EventType = 'delivered') as emails_delivered,
        COUNT(*) FILTER (WHERE EventType = 'opened') as emails_opened,
        COUNT(*) FILTER (WHERE EventType = 'clicked') as emails_clicked,
        COUNT(*) FILTER (WHERE EventType = 'replied') as emails_replied,
        COUNT(*) FILTER (WHERE EventType = 'bounced') as emails_bounced,
        COUNT(*) FILTER (WHERE EventType = 'unsubscribed') as unsubscribes,
        COUNT(DISTINCT ContactID) FILTER (WHERE EventType = 'sent') as unique_contacts_emailed
      FROM Outreach_Events
      WHERE Timestamp >= $1
    `, [dateFilter]);

        const stats = result.rows[0];

        // Calculate rates
        const sent = parseInt(stats.emails_sent) || 1; // Avoid division by zero
        const delivered = parseInt(stats.emails_delivered) || sent;

        return {
            period,
            totals: {
                sent: parseInt(stats.emails_sent),
                delivered: parseInt(stats.emails_delivered),
                opened: parseInt(stats.emails_opened),
                clicked: parseInt(stats.emails_clicked),
                replied: parseInt(stats.emails_replied),
                bounced: parseInt(stats.emails_bounced),
                unsubscribes: parseInt(stats.unsubscribes),
                uniqueContacts: parseInt(stats.unique_contacts_emailed)
            },
            rates: {
                deliveryRate: ((delivered / sent) * 100).toFixed(1) + '%',
                openRate: ((parseInt(stats.emails_opened) / delivered) * 100).toFixed(1) + '%',
                clickRate: ((parseInt(stats.emails_clicked) / delivered) * 100).toFixed(1) + '%',
                replyRate: ((parseInt(stats.emails_replied) / delivered) * 100).toFixed(1) + '%',
                bounceRate: ((parseInt(stats.emails_bounced) / sent) * 100).toFixed(1) + '%'
            },
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get campaign-specific analytics
     */
    async getCampaignStats(campaignId) {
        // Overall campaign stats
        const overallResult = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE EventType = 'sent') as emails_sent,
        COUNT(*) FILTER (WHERE EventType = 'opened') as emails_opened,
        COUNT(*) FILTER (WHERE EventType = 'clicked') as emails_clicked,
        COUNT(*) FILTER (WHERE EventType = 'replied') as emails_replied,
        COUNT(*) FILTER (WHERE EventType = 'bounced') as emails_bounced,
        COUNT(DISTINCT ContactID) as unique_contacts
      FROM Outreach_Events
      WHERE CampaignID = $1
    `, [campaignId]);

        // Per-step stats
        const stepResult = await this.pool.query(`
      SELECT 
        s.StepNumber,
        s.EmailTemplate,
        COUNT(*) FILTER (WHERE e.EventType = 'sent') as sent,
        COUNT(*) FILTER (WHERE e.EventType = 'opened') as opened,
        COUNT(*) FILTER (WHERE e.EventType = 'clicked') as clicked,
        COUNT(*) FILTER (WHERE e.EventType = 'replied') as replied
      FROM Outreach_Sequences s
      LEFT JOIN Outreach_Events e ON e.SequenceID = s.SequenceID
      WHERE s.CampaignID = $1
      GROUP BY s.SequenceID, s.StepNumber, s.EmailTemplate
      ORDER BY s.StepNumber
    `, [campaignId]);

        // Enrollment stats
        const enrollmentResult = await this.pool.query(`
      SELECT
        COUNT(*) as total_enrolled,
        COUNT(*) FILTER (WHERE Status = 'active') as active,
        COUNT(*) FILTER (WHERE Status = 'completed') as completed,
        COUNT(*) FILTER (WHERE Status = 'exited') as exited
      FROM Outreach_Enrollments
      WHERE CampaignID = $1
    `, [campaignId]);

        const overall = overallResult.rows[0];
        const sent = parseInt(overall.emails_sent) || 1;

        return {
            campaignId,
            overall: {
                sent: parseInt(overall.emails_sent),
                opened: parseInt(overall.emails_opened),
                clicked: parseInt(overall.emails_clicked),
                replied: parseInt(overall.emails_replied),
                bounced: parseInt(overall.emails_bounced),
                uniqueContacts: parseInt(overall.unique_contacts)
            },
            rates: {
                openRate: ((parseInt(overall.emails_opened) / sent) * 100).toFixed(1) + '%',
                clickRate: ((parseInt(overall.emails_clicked) / sent) * 100).toFixed(1) + '%',
                replyRate: ((parseInt(overall.emails_replied) / sent) * 100).toFixed(1) + '%'
            },
            byStep: stepResult.rows,
            enrollments: enrollmentResult.rows[0],
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get daily activity chart data
     */
    async getDailyActivity(days = 30) {
        const result = await this.pool.query(`
      SELECT 
        DATE(Timestamp) as date,
        COUNT(*) FILTER (WHERE EventType = 'sent') as sent,
        COUNT(*) FILTER (WHERE EventType = 'opened') as opened,
        COUNT(*) FILTER (WHERE EventType = 'replied') as replied
      FROM Outreach_Events
      WHERE Timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(Timestamp)
      ORDER BY date
    `);

        return result.rows;
    }

    /**
     * Get top performing contacts (most engaged)
     */
    async getTopEngagedContacts(limit = 10) {
        const result = await this.pool.query(`
      SELECT 
        c.*,
        COUNT(*) FILTER (WHERE e.EventType = 'opened') as opens,
        COUNT(*) FILTER (WHERE e.EventType = 'clicked') as clicks,
        COUNT(*) FILTER (WHERE e.EventType = 'replied') as replies,
        (COUNT(*) FILTER (WHERE e.EventType = 'opened') * 1 +
         COUNT(*) FILTER (WHERE e.EventType = 'clicked') * 2 +
         COUNT(*) FILTER (WHERE e.EventType = 'replied') * 5) as engagement_score
      FROM Outreach_Contacts c
      JOIN Outreach_Events e ON c.ContactID = e.ContactID
      GROUP BY c.ContactID
      HAVING COUNT(*) FILTER (WHERE e.EventType IN ('opened', 'clicked', 'replied')) > 0
      ORDER BY engagement_score DESC
      LIMIT $1
    `, [limit]);

        return result.rows;
    }

    /**
     * Convert period string to date
     */
    getDateFilter(period) {
        const now = new Date();

        switch (period) {
            case 'today':
                return new Date(now.setHours(0, 0, 0, 0));
            case 'last_7_days':
                return new Date(now.setDate(now.getDate() - 7));
            case 'last_30_days':
                return new Date(now.setDate(now.getDate() - 30));
            case 'last_90_days':
                return new Date(now.setDate(now.getDate() - 90));
            case 'this_month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'this_year':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(now.setDate(now.getDate() - 30));
        }
    }
}

module.exports = Analytics;
