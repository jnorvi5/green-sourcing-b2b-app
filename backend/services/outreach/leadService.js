/**
 * Lead Service
 * 
 * Manages contacts/leads for outreach campaigns.
 * Handles CRUD operations, scoring, and segmentation.
 */

class LeadService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Add a new contact
     */
    async addContact(contactData) {
        const {
            email,
            firstName,
            lastName,
            company,
            jobTitle,
            phone,
            linkedInURL,
            website,
            contactType = 'lead',
            source = 'manual',
            tags = [],
            customFields = {}
        } = contactData;

        if (!email) {
            throw new Error('Email is required');
        }

        try {
            const result = await this.pool.query(`
        INSERT INTO Outreach_Contacts (
          Email, FirstName, LastName, Company, JobTitle, Phone,
          LinkedInURL, Website, ContactType, Source, Tags, CustomFields
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (Email) DO UPDATE SET
          FirstName = COALESCE(EXCLUDED.FirstName, Outreach_Contacts.FirstName),
          LastName = COALESCE(EXCLUDED.LastName, Outreach_Contacts.LastName),
          Company = COALESCE(EXCLUDED.Company, Outreach_Contacts.Company),
          JobTitle = COALESCE(EXCLUDED.JobTitle, Outreach_Contacts.JobTitle),
          UpdatedAt = CURRENT_TIMESTAMP
        RETURNING *
      `, [
                email.toLowerCase().trim(),
                firstName,
                lastName,
                company,
                jobTitle,
                phone,
                linkedInURL,
                website,
                contactType,
                source,
                tags,
                JSON.stringify(customFields)
            ]);

            // Calculate initial lead score
            const contact = result.rows[0];
            const score = this.calculateLeadScore(contact);

            if (score !== contact.leadscore) {
                await this.pool.query(
                    'UPDATE Outreach_Contacts SET LeadScore = $1 WHERE ContactID = $2',
                    [score, contact.contactid]
                );
                contact.leadscore = score;
            }

            return { success: true, contact };
        } catch (err) {
            console.error('[LeadService] Add contact error:', err);
            throw err;
        }
    }

    /**
     * Get contacts with optional filters
     */
    async getContacts(filters = {}) {
        const {
            status,
            contactType,
            source,
            tag,
            minScore,
            search,
            campaignId,
            notInCampaign,
            limit = 100,
            offset = 0,
            orderBy = 'CreatedAt',
            orderDir = 'DESC'
        } = filters;

        let whereConditions = ['1=1'];
        const params = [];
        let paramIndex = 1;

        if (status) {
            whereConditions.push(`Status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (contactType) {
            whereConditions.push(`ContactType = $${paramIndex}`);
            params.push(contactType);
            paramIndex++;
        }

        if (source) {
            whereConditions.push(`Source = $${paramIndex}`);
            params.push(source);
            paramIndex++;
        }

        if (tag) {
            whereConditions.push(`$${paramIndex} = ANY(Tags)`);
            params.push(tag);
            paramIndex++;
        }

        if (minScore !== undefined) {
            whereConditions.push(`LeadScore >= $${paramIndex}`);
            params.push(minScore);
            paramIndex++;
        }

        if (search) {
            whereConditions.push(`(
        Email ILIKE $${paramIndex} OR
        FirstName ILIKE $${paramIndex} OR
        LastName ILIKE $${paramIndex} OR
        Company ILIKE $${paramIndex}
      )`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (campaignId) {
            whereConditions.push(`ContactID IN (
        SELECT ContactID FROM Outreach_Enrollments WHERE CampaignID = $${paramIndex}
      )`);
            params.push(campaignId);
            paramIndex++;
        }

        if (notInCampaign) {
            whereConditions.push(`ContactID NOT IN (
        SELECT ContactID FROM Outreach_Enrollments WHERE CampaignID = $${paramIndex}
      )`);
            params.push(notInCampaign);
            paramIndex++;
        }

        // Validate orderBy to prevent SQL injection
        const allowedOrderBy = ['CreatedAt', 'LeadScore', 'LastContactedAt', 'Company', 'Email'];
        const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'CreatedAt';
        const safeOrderDir = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        params.push(limit);
        params.push(offset);

        const query = `
      SELECT * FROM Outreach_Contacts
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${safeOrderBy} ${safeOrderDir}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        const countQuery = `
      SELECT COUNT(*) FROM Outreach_Contacts
      WHERE ${whereConditions.join(' AND ')}
    `;

        const [result, countResult] = await Promise.all([
            this.pool.query(query, params),
            this.pool.query(countQuery, params.slice(0, -2))
        ]);

        return {
            contacts: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit,
            offset
        };
    }

    /**
     * Get single contact by ID
     */
    async getContact(contactId) {
        const result = await this.pool.query(
            'SELECT * FROM Outreach_Contacts WHERE ContactID = $1',
            [contactId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const contact = result.rows[0];

        // Get recent events for this contact
        const eventsResult = await this.pool.query(`
      SELECT EventType, EmailSubject, Timestamp, Metadata
      FROM Outreach_Events
      WHERE ContactID = $1
      ORDER BY Timestamp DESC
      LIMIT 20
    `, [contactId]);

        // Get campaign enrollments
        const enrollmentsResult = await this.pool.query(`
      SELECT e.*, c.Name as CampaignName
      FROM Outreach_Enrollments e
      JOIN Outreach_Campaigns c ON e.CampaignID = c.CampaignID
      WHERE e.ContactID = $1
    `, [contactId]);

        return {
            ...contact,
            recentEvents: eventsResult.rows,
            enrollments: enrollmentsResult.rows
        };
    }

    /**
     * Update a contact
     */
    async updateContact(contactId, updates) {
        const allowedFields = [
            'FirstName', 'LastName', 'Company', 'JobTitle', 'Phone',
            'LinkedInURL', 'Website', 'ContactType', 'Status', 'Tags', 'CustomFields', 'LeadScore'
        ];

        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
            if (allowedFields.includes(fieldName)) {
                setClauses.push(`${fieldName} = $${paramIndex}`);
                params.push(key === 'customFields' ? JSON.stringify(value) : value);
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            throw new Error('No valid fields to update');
        }

        setClauses.push('UpdatedAt = CURRENT_TIMESTAMP');
        params.push(contactId);

        const result = await this.pool.query(`
      UPDATE Outreach_Contacts
      SET ${setClauses.join(', ')}
      WHERE ContactID = $${paramIndex}
      RETURNING *
    `, params);

        return result.rows[0];
    }

    /**
     * Bulk import contacts
     */
    async importContacts(contacts, source = 'import') {
        const results = {
            imported: 0,
            updated: 0,
            failed: 0,
            errors: []
        };

        for (const contact of contacts) {
            try {
                const existingResult = await this.pool.query(
                    'SELECT ContactID FROM Outreach_Contacts WHERE Email = $1',
                    [contact.email?.toLowerCase().trim()]
                );

                await this.addContact({ ...contact, source });

                if (existingResult.rows.length > 0) {
                    results.updated++;
                } else {
                    results.imported++;
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ email: contact.email, error: err.message });
            }
        }

        return results;
    }

    /**
     * Calculate lead score based on available data
     */
    calculateLeadScore(contact) {
        let score = 0;

        // Base points for contact info completeness
        if (contact.email) score += 10;
        if (contact.firstname) score += 5;
        if (contact.lastname) score += 5;
        if (contact.company) score += 15;
        if (contact.jobtitle) score += 10;
        if (contact.phone) score += 10;
        if (contact.linkedinurl) score += 15;
        if (contact.website) score += 10;

        // Points for engagement signals (from custom fields)
        const customFields = contact.customfields || {};
        if (customFields.hasEPD) score += 20;
        if (customFields.hasFSC) score += 20;
        if (customFields.revenueRange === 'enterprise') score += 15;
        if (customFields.recentlyViewed) score += 10;

        // Job title scoring
        const title = (contact.jobtitle || '').toLowerCase();
        if (title.includes('ceo') || title.includes('founder') || title.includes('owner')) score += 20;
        if (title.includes('vp') || title.includes('director')) score += 15;
        if (title.includes('manager')) score += 10;
        if (title.includes('sustainability')) score += 15;
        if (title.includes('procurement')) score += 15;

        return Math.min(score, 100); // Cap at 100
    }

    /**
     * Get contacts ready for outreach (not recently contacted, not bounced/unsubscribed)
     */
    async getContactsForOutreach(options = {}) {
        const {
            campaignId,
            contactType,
            minScore = 0,
            daysSinceLastContact = 3,
            limit = 50
        } = options;

        let whereConditions = [
            `Status NOT IN ('bounced', 'unsubscribed', 'converted')`,
            `(LastContactedAt IS NULL OR LastContactedAt < NOW() - INTERVAL '${daysSinceLastContact} days')`,
            `LeadScore >= $1`
        ];
        const params = [minScore];
        let paramIndex = 2;

        if (contactType) {
            whereConditions.push(`ContactType = $${paramIndex}`);
            params.push(contactType);
            paramIndex++;
        }

        if (campaignId) {
            whereConditions.push(`ContactID IN (
        SELECT ContactID FROM Outreach_Enrollments 
        WHERE CampaignID = $${paramIndex} AND Status = 'active'
      )`);
            params.push(campaignId);
            paramIndex++;
        }

        params.push(limit);

        const result = await this.pool.query(`
      SELECT * FROM Outreach_Contacts
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY LeadScore DESC, CreatedAt ASC
      LIMIT $${paramIndex}
    `, params);

        return result.rows;
    }

    /**
     * Mark contact as contacted
     */
    async markContacted(contactId) {
        await this.pool.query(
            `UPDATE Outreach_Contacts 
       SET LastContactedAt = CURRENT_TIMESTAMP, 
           Status = CASE WHEN Status = 'new' THEN 'contacted' ELSE Status END,
           UpdatedAt = CURRENT_TIMESTAMP
       WHERE ContactID = $1`,
            [contactId]
        );
    }

    /**
     * Update contact status
     */
    async updateStatus(contactId, status, reason = null) {
        await this.pool.query(
            `UPDATE Outreach_Contacts 
       SET Status = $1, 
           CustomFields = CustomFields || $2::jsonb,
           UpdatedAt = CURRENT_TIMESTAMP
       WHERE ContactID = $3`,
            [status, JSON.stringify({ statusChangeReason: reason, statusChangedAt: new Date().toISOString() }), contactId]
        );
    }
}

module.exports = LeadService;
