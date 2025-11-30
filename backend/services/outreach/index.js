/**
 * Outreach Agent Service - MongoDB Version
 * 
 * Coordinates all outreach automation:
 * - Lead management
 * - AI email generation
 * - Email delivery
 * - Campaign tracking
 * - Analytics
 */

const { connect, getCollection } = require('./mongoDb');
const EmailGenerator = require('./emailGenerator');
const EmailSender = require('./emailSender');

class OutreachService {
    constructor() {
        this.emailGenerator = new EmailGenerator();
        this.emailSender = new EmailSender();
        this.initialized = false;
    }

    /**
     * Initialize the outreach service
     */
    async initialize() {
        if (this.initialized) return;

        console.log('[Outreach] Initializing MongoDB-based service...');

        try {
            // Connect to MongoDB
            await connect();

            // Create indexes for performance
            await this.createIndexes();

            this.initialized = true;
            console.log('[Outreach] Service initialized successfully with MongoDB');
        } catch (err) {
            console.error('[Outreach] Initialization failed:', err.message);
            // Don't throw - allow app to run without outreach
        }
    }

    /**
     * Create MongoDB indexes
     */
    async createIndexes() {
        try {
            const contacts = getCollection('outreach_contacts');
            const campaigns = getCollection('outreach_campaigns');
            const events = getCollection('outreach_events');

            await contacts.createIndex({ email: 1 }, { unique: true });
            await contacts.createIndex({ status: 1 });
            await contacts.createIndex({ contactType: 1 });
            await contacts.createIndex({ createdAt: -1 });

            await campaigns.createIndex({ status: 1 });
            await campaigns.createIndex({ createdAt: -1 });

            await events.createIndex({ contactId: 1 });
            await events.createIndex({ eventType: 1 });
            await events.createIndex({ timestamp: -1 });

            console.log('[Outreach] MongoDB indexes created');
        } catch (err) {
            // Indexes may already exist
            console.log('[Outreach] Index creation:', err.message);
        }
    }

    // ==========================================
    // CONTACTS / LEADS
    // ==========================================

    /**
     * Add a new contact
     */
    async addContact(contactData) {
        const contacts = getCollection('outreach_contacts');

        const contact = {
            email: contactData.email?.toLowerCase().trim(),
            firstName: contactData.firstName || '',
            lastName: contactData.lastName || '',
            company: contactData.company || '',
            jobTitle: contactData.jobTitle || '',
            phone: contactData.phone || '',
            linkedInUrl: contactData.linkedInUrl || '',
            website: contactData.website || '',
            contactType: contactData.contactType || 'supplier', // supplier, buyer, data_provider, partner
            source: contactData.source || 'manual',
            leadScore: contactData.leadScore || 50,
            status: 'active', // active, contacted, replied, converted, unsubscribed, bounced
            tags: contactData.tags || [],
            customFields: contactData.customFields || {},
            lastContactedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const result = await contacts.insertOne(contact);
            return { success: true, contact: { ...contact, _id: result.insertedId } };
        } catch (err) {
            if (err.code === 11000) {
                return { success: false, error: 'Email already exists' };
            }
            throw err;
        }
    }

    /**
     * Get contacts with filters
     */
    async getContacts(filters = {}) {
        const contacts = getCollection('outreach_contacts');

        const query = {};
        if (filters.status) query.status = filters.status;
        if (filters.contactType) query.contactType = filters.contactType;
        if (filters.source) query.source = filters.source;
        if (filters.search) {
            query.$or = [
                { email: { $regex: filters.search, $options: 'i' } },
                { firstName: { $regex: filters.search, $options: 'i' } },
                { lastName: { $regex: filters.search, $options: 'i' } },
                { company: { $regex: filters.search, $options: 'i' } }
            ];
        }

        const limit = parseInt(filters.limit) || 50;
        const skip = parseInt(filters.offset) || 0;

        const [results, total] = await Promise.all([
            contacts.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            contacts.countDocuments(query)
        ]);

        return {
            contacts: results.map(c => ({
                contactid: c._id.toString(),
                email: c.email,
                firstname: c.firstName,
                lastname: c.lastName,
                company: c.company,
                jobtitle: c.jobTitle,
                contacttype: c.contactType,
                status: c.status,
                leadscore: c.leadScore,
                source: c.source,
                createdat: c.createdAt,
                lastemailsentat: c.lastContactedAt
            })),
            total,
            limit,
            offset: skip
        };
    }

    /**
     * Get single contact
     */
    async getContact(contactId) {
        const contacts = getCollection('outreach_contacts');
        const { ObjectId } = require('mongodb');

        try {
            const contact = await contacts.findOne({ _id: new ObjectId(contactId) });
            return contact;
        } catch (err) {
            return null;
        }
    }

    /**
     * Update contact
     */
    async updateContact(contactId, updates) {
        const contacts = getCollection('outreach_contacts');
        const { ObjectId } = require('mongodb');

        const updateDoc = {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        };

        const result = await contacts.updateOne(
            { _id: new ObjectId(contactId) },
            updateDoc
        );

        return { success: result.modifiedCount > 0 };
    }

    /**
     * Import multiple contacts
     */
    async importContacts(contactsArray, source = 'import') {
        const contacts = getCollection('outreach_contacts');
        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (const contact of contactsArray) {
            try {
                await contacts.insertOne({
                    email: contact.email?.toLowerCase().trim(),
                    firstName: contact.firstName || contact.first_name || '',
                    lastName: contact.lastName || contact.last_name || '',
                    company: contact.company || '',
                    jobTitle: contact.jobTitle || contact.job_title || '',
                    contactType: contact.contactType || contact.type || 'supplier',
                    source: source,
                    leadScore: 50,
                    status: 'active',
                    tags: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                imported++;
            } catch (err) {
                if (err.code === 11000) {
                    skipped++;
                } else {
                    errors.push({ email: contact.email, error: err.message });
                }
            }
        }

        return { imported, skipped, errors, total: contactsArray.length };
    }

    // ==========================================
    // CAMPAIGNS
    // ==========================================

    /**
     * Create a campaign
     */
    async createCampaign(campaignData) {
        const campaigns = getCollection('outreach_campaigns');

        const campaign = {
            name: campaignData.name,
            description: campaignData.description || '',
            campaignType: campaignData.type || 'drip',
            targetAudience: campaignData.targetAudience || 'all',
            status: 'draft',
            settings: campaignData.settings || {},
            totalEnrolled: 0,
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalReplied: 0,
            createdBy: campaignData.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await campaigns.insertOne(campaign);
        return { success: true, campaign: { ...campaign, _id: result.insertedId } };
    }

    /**
     * Get campaigns
     */
    async getCampaigns(filters = {}) {
        const campaigns = getCollection('outreach_campaigns');

        const query = {};
        if (filters.status) query.status = filters.status;

        const results = await campaigns.find(query).sort({ createdAt: -1 }).toArray();

        return results.map(c => ({
            campaignid: c._id.toString(),
            campaignname: c.name,
            campaigntype: c.campaignType,
            status: c.status,
            targetaudience: c.targetAudience,
            totalenrolled: c.totalEnrolled || 0,
            totalsent: c.totalSent || 0,
            totalopened: c.totalOpened || 0,
            totalclicked: c.totalClicked || 0,
            totalreplied: c.totalReplied || 0,
            createdat: c.createdAt
        }));
    }

    /**
     * Update campaign status
     */
    async updateCampaignStatus(campaignId, status) {
        const campaigns = getCollection('outreach_campaigns');
        const { ObjectId } = require('mongodb');

        await campaigns.updateOne(
            { _id: new ObjectId(campaignId) },
            { $set: { status, updatedAt: new Date() } }
        );

        return { success: true };
    }

    // ==========================================
    // EVENTS / TRACKING
    // ==========================================

    /**
     * Log an outreach event
     */
    async logEvent(eventData) {
        const events = getCollection('outreach_events');

        const event = {
            contactId: eventData.contactId,
            campaignId: eventData.campaignId,
            eventType: eventData.eventType, // sent, opened, clicked, replied, bounced, unsubscribed
            emailSubject: eventData.emailSubject || '',
            metadata: eventData.metadata || {},
            timestamp: new Date()
        };

        await events.insertOne(event);

        // Update contact's last contacted time if email was sent
        if (eventData.eventType === 'sent') {
            await this.updateContact(eventData.contactId, { lastContactedAt: new Date() });
        }

        return { success: true };
    }

    /**
     * Get events
     */
    async getEvents(filters = {}) {
        const events = getCollection('outreach_events');

        const query = {};
        if (filters.contactId) query.contactId = filters.contactId;
        if (filters.campaignId) query.campaignId = filters.campaignId;
        if (filters.eventType) query.eventType = filters.eventType;

        const limit = parseInt(filters.limit) || 100;

        const results = await events.find(query).sort({ timestamp: -1 }).limit(limit).toArray();
        return results;
    }

    // ==========================================
    // ANALYTICS
    // ==========================================

    /**
     * Get analytics summary
     */
    async getAnalytics(period = 'last_30_days') {
        const contacts = getCollection('outreach_contacts');
        const events = getCollection('outreach_events');

        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        if (period === 'last_7_days') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'last_30_days') {
            startDate.setDate(now.getDate() - 30);
        } else if (period === 'last_90_days') {
            startDate.setDate(now.getDate() - 90);
        }

        const [
            totalContacts,
            byType,
            byStatus,
            eventCounts
        ] = await Promise.all([
            contacts.countDocuments({}),
            contacts.aggregate([
                { $group: { _id: '$contactType', count: { $sum: 1 } } }
            ]).toArray(),
            contacts.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]).toArray(),
            events.aggregate([
                { $match: { timestamp: { $gte: startDate } } },
                { $group: { _id: '$eventType', count: { $sum: 1 } } }
            ]).toArray()
        ]);

        const eventMap = eventCounts.reduce((acc, e) => {
            acc[e._id] = e.count;
            return acc;
        }, {});

        const totalSent = eventMap.sent || 0;
        const totalOpened = eventMap.opened || 0;
        const totalClicked = eventMap.clicked || 0;
        const totalReplied = eventMap.replied || 0;
        const totalBounced = eventMap.bounced || 0;
        const totalUnsubscribed = eventMap.unsubscribed || 0;

        return {
            totalContacts,
            totalEmailsSent: totalSent,
            openRate: totalSent > 0 ? parseFloat(((totalOpened / totalSent) * 100).toFixed(1)) : 0,
            clickRate: totalSent > 0 ? parseFloat(((totalClicked / totalSent) * 100).toFixed(1)) : 0,
            replyRate: totalSent > 0 ? parseFloat(((totalReplied / totalSent) * 100).toFixed(1)) : 0,
            bounceRate: totalSent > 0 ? parseFloat(((totalBounced / totalSent) * 100).toFixed(1)) : 0,
            unsubscribeRate: totalSent > 0 ? parseFloat(((totalUnsubscribed / totalSent) * 100).toFixed(1)) : 0,
            byContactType: byType.reduce((acc, t) => { acc[t._id] = t.count; return acc; }, {}),
            byStatus: byStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
            period
        };
    }

    // ==========================================
    // AGENT OPERATIONS
    // ==========================================

    /**
     * Run the outreach agent
     */
    async runAgent(options = {}) {
        const agentRuns = getCollection('outreach_agent_runs');
        const contacts = getCollection('outreach_contacts');

        const runLog = {
            runType: options.type || 'manual',
            status: 'running',
            contactsProcessed: 0,
            emailsSent: 0,
            errors: [],
            startedAt: new Date()
        };

        const runResult = await agentRuns.insertOne(runLog);
        const runId = runResult.insertedId;

        try {
            // Get contacts that need outreach
            const contactsToProcess = await contacts.find({
                status: 'active',
                $or: [
                    { lastContactedAt: null },
                    { lastContactedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 days ago
                ]
            }).limit(options.batchSize || 50).toArray();

            let emailsSent = 0;

            for (const contact of contactsToProcess) {
                try {
                    // Generate email using AI
                    const emailContent = await this.emailGenerator.generateEmail(contact);

                    // Send email
                    if (emailContent && process.env.OUTREACH_SMTP_HOST) {
                        await this.emailSender.send({
                            to: contact.email,
                            subject: emailContent.subject,
                            html: emailContent.html
                        });

                        // Log the event
                        await this.logEvent({
                            contactId: contact._id.toString(),
                            eventType: 'sent',
                            emailSubject: emailContent.subject
                        });

                        // Update contact status
                        await this.updateContact(contact._id.toString(), {
                            status: 'contacted',
                            lastContactedAt: new Date()
                        });

                        emailsSent++;
                    }
                } catch (err) {
                    runLog.errors.push({ contactId: contact._id.toString(), error: err.message });
                }
            }

            // Update run log
            await agentRuns.updateOne(
                { _id: runId },
                {
                    $set: {
                        status: 'completed',
                        contactsProcessed: contactsToProcess.length,
                        emailsSent,
                        errors: runLog.errors,
                        completedAt: new Date(),
                        durationMs: Date.now() - runLog.startedAt.getTime()
                    }
                }
            );

            return {
                success: true,
                runId: runId.toString(),
                contactsProcessed: contactsToProcess.length,
                emailsSent,
                errors: runLog.errors.length
            };

        } catch (err) {
            await agentRuns.updateOne(
                { _id: runId },
                { $set: { status: 'failed', errors: [err.message], completedAt: new Date() } }
            );
            throw err;
        }
    }

    /**
     * Get agent run history
     */
    async getAgentRuns(limit = 20) {
        const agentRuns = getCollection('outreach_agent_runs');
        return agentRuns.find({}).sort({ startedAt: -1 }).limit(limit).toArray();
    }

    /**
     * Get agent status
     */
    getAgentStatus() {
        return {
            isRunning: false,
            lastRunAt: null,
            nextRunAt: null,
            totalRuns: 0
        };
    }

    // ==========================================
    // INSTRUCTIONS
    // ==========================================

    /**
     * Get instruction by key
     */
    async getInstruction(key) {
        const instructions = getCollection('outreach_instructions');
        return instructions.findOne({ key: key.toLowerCase() });
    }

    /**
     * Set instruction
     */
    async setInstruction(key, value, options = {}) {
        const instructions = getCollection('outreach_instructions');

        const doc = {
            key: key.toLowerCase(),
            value,
            description: options.description || '',
            isActive: options.isActive !== false,
            priority: options.priority || 0,
            updatedAt: new Date()
        };

        await instructions.updateOne(
            { key: key.toLowerCase() },
            { $set: doc, $setOnInsert: { createdAt: new Date() } },
            { upsert: true }
        );

        return doc;
    }

    /**
     * Get all active instructions
     */
    async getActiveInstructions() {
        const instructions = getCollection('outreach_instructions');
        const results = await instructions.find({ isActive: true }).sort({ priority: -1 }).toArray();

        const instructionMap = {};
        for (const inst of results) {
            instructionMap[inst.key] = inst.value;
        }
        return instructionMap;
    }

    /**
     * Delete instruction
     */
    async deleteInstructionByKey(key) {
        const instructions = getCollection('outreach_instructions');
        await instructions.deleteOne({ key: key.toLowerCase() });
        return { success: true };
    }

    // ==========================================
    // SMART IMPORT
    // ==========================================

    /**
     * Check for duplicate emails
     */
    async checkDuplicates(emails) {
        const contacts = getCollection('outreach_contacts');

        const lowerEmails = emails.map(e => e.toLowerCase().trim());
        const existing = await contacts.find(
            { email: { $in: lowerEmails } },
            { projection: { email: 1 } }
        ).toArray();

        const existingSet = new Set(existing.map(e => e.email));

        return {
            existing: lowerEmails.filter(e => existingSet.has(e)),
            new: lowerEmails.filter(e => !existingSet.has(e)),
            existingCount: existingSet.size,
            newCount: lowerEmails.length - existingSet.size
        };
    }

    /**
     * Smart import with deduplication
     */
    async smartImportContacts(contactsArray, source = 'import') {
        const emails = contactsArray.map(c => c.email).filter(Boolean);
        const dupeCheck = await this.checkDuplicates(emails);

        const newContacts = contactsArray.filter(c =>
            c.email && dupeCheck.new.includes(c.email.toLowerCase().trim())
        );

        const importResult = await this.importContacts(newContacts, source);

        return {
            success: true,
            totalProvided: contactsArray.length,
            duplicatesSkipped: dupeCheck.existingCount,
            imported: importResult.imported,
            errors: importResult.errors
        };
    }
}

module.exports = OutreachService;
