/**
 * Outreach API Routes
 * 
 * REST endpoints for the outreach automation system.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * Initialize outreach service from app.locals
 */
function getService(req) {
    return req.app.locals.outreachService;
}

// ==========================================
// CONTACTS / LEADS
// ==========================================

/**
 * GET /api/v1/outreach/contacts
 * List contacts with filters
 */
router.get('/contacts', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const result = await service.getContacts(req.query);
        res.json(result);
    } catch (err) {
        console.error('[Outreach API] Get contacts error:', err);
        res.status(500).json({ error: 'Failed to get contacts' });
    }
});

/**
 * POST /api/v1/outreach/contacts
 * Add new contact
 */
router.post('/contacts', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const result = await service.addContact(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('[Outreach API] Add contact error:', err);
        res.status(500).json({ error: 'Failed to add contact', details: err.message });
    }
});

/**
 * GET /api/v1/outreach/contacts/:id
 * Get single contact with history
 */
router.get('/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const contact = await service.getContact(parseInt(req.params.id));

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json(contact);
    } catch (err) {
        console.error('[Outreach API] Get contact error:', err);
        res.status(500).json({ error: 'Failed to get contact' });
    }
});

/**
 * PUT /api/v1/outreach/contacts/:id
 * Update contact
 */
router.put('/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const contact = await service.updateContact(parseInt(req.params.id), req.body);
        res.json({ success: true, contact });
    } catch (err) {
        console.error('[Outreach API] Update contact error:', err);
        res.status(500).json({ error: 'Failed to update contact', details: err.message });
    }
});

/**
 * POST /api/v1/outreach/contacts/import
 * Bulk import contacts
 */
router.post('/contacts/import', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { contacts, source } = req.body;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        const service = getService(req);
        const result = await service.importContacts(contacts, source || 'import');
        res.json(result);
    } catch (err) {
        console.error('[Outreach API] Import contacts error:', err);
        res.status(500).json({ error: 'Failed to import contacts' });
    }
});

// ==========================================
// CAMPAIGNS
// ==========================================

/**
 * GET /api/v1/outreach/campaigns
 * List campaigns
 */
router.get('/campaigns', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const campaigns = await service.getCampaigns(req.query);
        res.json({ campaigns });
    } catch (err) {
        console.error('[Outreach API] Get campaigns error:', err);
        res.status(500).json({ error: 'Failed to get campaigns' });
    }
});

/**
 * POST /api/v1/outreach/campaigns
 * Create new campaign
 */
router.post('/campaigns', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const service = getService(req);
        const result = await service.createCampaign({
            ...req.body,
            createdBy: req.user.userId
        });
        res.status(201).json(result);
    } catch (err) {
        console.error('[Outreach API] Create campaign error:', err);
        res.status(500).json({ error: 'Failed to create campaign', details: err.message });
    }
});

/**
 * GET /api/v1/outreach/campaigns/:id
 * Get campaign details
 */
router.get('/campaigns/:id', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const campaign = await service.campaignManager.getCampaign(parseInt(req.params.id));

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (err) {
        console.error('[Outreach API] Get campaign error:', err);
        res.status(500).json({ error: 'Failed to get campaign' });
    }
});

/**
 * PUT /api/v1/outreach/campaigns/:id/status
 * Update campaign status
 */
router.put('/campaigns/:id/status', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const service = getService(req);
        const campaign = await service.campaignManager.updateCampaignStatus(
            parseInt(req.params.id),
            status
        );
        res.json({ success: true, campaign });
    } catch (err) {
        console.error('[Outreach API] Update campaign status error:', err);
        res.status(500).json({ error: 'Failed to update campaign status', details: err.message });
    }
});

/**
 * POST /api/v1/outreach/campaigns/:id/enroll
 * Enroll contacts in campaign
 */
router.post('/campaigns/:id/enroll', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { contactIds } = req.body;

        if (!contactIds || !Array.isArray(contactIds)) {
            return res.status(400).json({ error: 'contactIds array is required' });
        }

        const service = getService(req);
        const result = await service.campaignManager.bulkEnroll(
            contactIds,
            parseInt(req.params.id)
        );
        res.json(result);
    } catch (err) {
        console.error('[Outreach API] Enroll contacts error:', err);
        res.status(500).json({ error: 'Failed to enroll contacts' });
    }
});

/**
 * GET /api/v1/outreach/campaigns/templates
 * Get default campaign templates
 */
router.get('/campaigns/templates', authenticateToken, (req, res) => {
    const service = getService(req);
    const templates = service.campaignManager.getDefaultTemplates();
    res.json({ templates });
});

// ==========================================
// EVENTS
// ==========================================

/**
 * GET /api/v1/outreach/events
 * List outreach events
 */
router.get('/events', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const events = await service.getEvents(req.query);
        res.json({ events });
    } catch (err) {
        console.error('[Outreach API] Get events error:', err);
        res.status(500).json({ error: 'Failed to get events' });
    }
});

// ==========================================
// AGENT
// ==========================================

/**
 * POST /api/v1/outreach/agent/run
 * Manually trigger agent run
 */
router.post('/agent/run', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const service = getService(req);
        const result = await service.runAgent({ type: 'manual', ...req.body });
        res.json(result);
    } catch (err) {
        console.error('[Outreach API] Agent run error:', err);
        res.status(500).json({ error: 'Failed to run agent', details: err.message });
    }
});

/**
 * GET /api/v1/outreach/agent/status
 * Get agent status
 */
router.get('/agent/status', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const status = service.agentRunner.getStatus();
        const emailStats = service.emailSender.getStats();
        res.json({ ...status, emailStats });
    } catch (err) {
        console.error('[Outreach API] Agent status error:', err);
        res.status(500).json({ error: 'Failed to get agent status' });
    }
});

/**
 * GET /api/v1/outreach/agent/runs
 * Get agent run history
 */
router.get('/agent/runs', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const limit = parseInt(req.query.limit) || 20;
        const runs = await service.getAgentRuns(limit);
        res.json({ runs });
    } catch (err) {
        console.error('[Outreach API] Agent runs error:', err);
        res.status(500).json({ error: 'Failed to get agent runs' });
    }
});

// ==========================================
// ANALYTICS
// ==========================================

/**
 * GET /api/v1/outreach/analytics
 * Get outreach analytics
 */
router.get('/analytics', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const period = req.query.period || 'last_30_days';
        const analytics = await service.getAnalytics(period);
        res.json(analytics);
    } catch (err) {
        console.error('[Outreach API] Analytics error:', err);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

/**
 * GET /api/v1/outreach/analytics/campaigns/:id
 * Get campaign-specific analytics
 */
router.get('/analytics/campaigns/:id', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const stats = await service.getCampaignAnalytics(parseInt(req.params.id));
        res.json(stats);
    } catch (err) {
        console.error('[Outreach API] Campaign analytics error:', err);
        res.status(500).json({ error: 'Failed to get campaign analytics' });
    }
});

/**
 * GET /api/v1/outreach/analytics/daily
 * Get daily activity chart data
 */
router.get('/analytics/daily', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const days = parseInt(req.query.days) || 30;
        const data = await service.analytics.getDailyActivity(days);
        res.json({ data });
    } catch (err) {
        console.error('[Outreach API] Daily analytics error:', err);
        res.status(500).json({ error: 'Failed to get daily analytics' });
    }
});

/**
 * GET /api/v1/outreach/analytics/top-engaged
 * Get most engaged contacts
 */
router.get('/analytics/top-engaged', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const limit = parseInt(req.query.limit) || 10;
        const contacts = await service.analytics.getTopEngagedContacts(limit);
        res.json({ contacts });
    } catch (err) {
        console.error('[Outreach API] Top engaged error:', err);
        res.status(500).json({ error: 'Failed to get top engaged contacts' });
    }
});

// ==========================================
// TRACKING (Public endpoints for email tracking)
// ==========================================

/**
 * GET /api/v1/outreach/track/open
 * Track email open via tracking pixel
 */
router.get('/track/open', async (req, res) => {
    try {
        const { id } = req.query;

        if (id) {
            // Parse tracking ID: contactId_campaignId_sequenceId_timestamp
            const parts = id.split('_');
            const contactId = parseInt(parts[0]) || parseInt(parts[1]); // Handle standalone_X format

            const service = getService(req);

            await service.logEvent({
                contactId,
                campaignId: parts.length > 2 ? parseInt(parts[1]) : null,
                sequenceId: parts.length > 3 ? parseInt(parts[2]) : null,
                eventType: 'opened',
                metadata: { trackingId: id, ip: req.ip, userAgent: req.headers['user-agent'] }
            });
        }
    } catch (err) {
        // Silently fail - don't expose errors for tracking pixels
        console.error('[Outreach API] Track open error:', err);
    }

    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(pixel);
});

/**
 * GET /api/v1/outreach/track/click
 * Track link click and redirect
 */
router.get('/track/click', async (req, res) => {
    try {
        const { id, url } = req.query;

        if (id) {
            const parts = id.split('_');
            const contactId = parseInt(parts[0]) || parseInt(parts[1]);

            const service = getService(req);

            await service.logEvent({
                contactId,
                campaignId: parts.length > 2 ? parseInt(parts[1]) : null,
                sequenceId: parts.length > 3 ? parseInt(parts[2]) : null,
                eventType: 'clicked',
                metadata: { trackingId: id, url, ip: req.ip }
            });
        }
    } catch (err) {
        console.error('[Outreach API] Track click error:', err);
    }

    // Redirect to destination URL
    const destination = req.query.url || process.env.FRONTEND_URL || 'https://greenchainz.com';
    res.redirect(302, destination);
});

/**
 * POST /api/v1/outreach/webhook/unsubscribe
 * Handle unsubscribe requests
 */
router.post('/webhook/unsubscribe', async (req, res) => {
    try {
        const { email, contactId } = req.body;
        const service = getService(req);

        if (contactId) {
            await service.leadService.updateStatus(contactId, 'unsubscribed', 'User request');
        } else if (email) {
            const contacts = await service.getContacts({ search: email, limit: 1 });
            if (contacts.contacts.length > 0) {
                await service.leadService.updateStatus(contacts.contacts[0].contactid, 'unsubscribed', 'User request');
            }
        }

        await service.logEvent({
            contactId,
            eventType: 'unsubscribed',
            metadata: { email }
        });

        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (err) {
        console.error('[Outreach API] Unsubscribe error:', err);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

// ==========================================
// AGENT INSTRUCTIONS
// ==========================================

/**
 * GET /api/v1/outreach/instructions
 * Get all agent instructions
 */
router.get('/instructions', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const onlyActive = req.query.active === 'true';

        let query = 'SELECT * FROM Outreach_Agent_Instructions';
        if (onlyActive) {
            query += ' WHERE IsActive = true';
        }
        query += ' ORDER BY Priority DESC, InstructionKey';

        const result = await service.pool.query(query);
        res.json({ instructions: result.rows });
    } catch (err) {
        console.error('[Outreach API] Get instructions error:', err);
        res.status(500).json({ error: 'Failed to get instructions' });
    }
});

/**
 * GET /api/v1/outreach/instructions/:key
 * Get single instruction by key
 */
router.get('/instructions/:key', authenticateToken, async (req, res) => {
    try {
        const service = getService(req);
        const instruction = await service.getInstruction(req.params.key);

        if (!instruction) {
            return res.status(404).json({ error: 'Instruction not found' });
        }

        res.json(instruction);
    } catch (err) {
        console.error('[Outreach API] Get instruction error:', err);
        res.status(500).json({ error: 'Failed to get instruction' });
    }
});

/**
 * POST /api/v1/outreach/instructions
 * Create or update an instruction
 */
router.post('/instructions', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { key, value, description, isActive, priority } = req.body;

        if (!key || !value) {
            return res.status(400).json({ error: 'Key and value are required' });
        }

        const service = getService(req);
        const instruction = await service.setInstruction(
            key.toLowerCase().replace(/\s+/g, '_'),
            value,
            {
                description,
                isActive: isActive !== false,
                priority: priority || 0,
                createdBy: req.user.userId
            }
        );

        res.status(201).json({ success: true, instruction });
    } catch (err) {
        console.error('[Outreach API] Set instruction error:', err);
        res.status(500).json({ error: 'Failed to set instruction', details: err.message });
    }
});

/**
 * PUT /api/v1/outreach/instructions/:key
 * Update an existing instruction
 */
router.put('/instructions/:key', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { value, description, isActive, priority } = req.body;
        const service = getService(req);

        // Check if exists
        const existing = await service.getInstruction(req.params.key);
        if (!existing) {
            return res.status(404).json({ error: 'Instruction not found' });
        }

        const instruction = await service.setInstruction(
            req.params.key,
            value || existing.instructionvalue,
            {
                description: description !== undefined ? description : existing.description,
                isActive: isActive !== undefined ? isActive : existing.isactive,
                priority: priority !== undefined ? priority : existing.priority
            }
        );

        res.json({ success: true, instruction });
    } catch (err) {
        console.error('[Outreach API] Update instruction error:', err);
        res.status(500).json({ error: 'Failed to update instruction', details: err.message });
    }
});

/**
 * DELETE /api/v1/outreach/instructions/:key
 * Delete an instruction
 */
router.delete('/instructions/:key', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const service = getService(req);
        await service.deleteInstructionByKey(req.params.key);
        res.json({ success: true, message: 'Instruction deleted' });
    } catch (err) {
        console.error('[Outreach API] Delete instruction error:', err);
        res.status(500).json({ error: 'Failed to delete instruction' });
    }
});

/**
 * PUT /api/v1/outreach/instructions/:key/toggle
 * Toggle instruction active state
 */
router.put('/instructions/:key/toggle', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const service = getService(req);
        const existing = await service.getInstruction(req.params.key);

        if (!existing) {
            return res.status(404).json({ error: 'Instruction not found' });
        }

        await service.pool.query(
            'UPDATE Outreach_Agent_Instructions SET IsActive = NOT IsActive, UpdatedAt = CURRENT_TIMESTAMP WHERE InstructionKey = $1',
            [req.params.key]
        );

        const updated = await service.getInstruction(req.params.key);
        res.json({ success: true, instruction: updated });
    } catch (err) {
        console.error('[Outreach API] Toggle instruction error:', err);
        res.status(500).json({ error: 'Failed to toggle instruction' });
    }
});

/**
 * POST /api/v1/outreach/instructions/seed
 * Seed default instructions
 */
router.post('/instructions/seed', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const service = getService(req);

        const defaultInstructions = [
            {
                key: 'tone',
                value: 'Professional but friendly. Focus on sustainability benefits.',
                description: 'Sets the overall tone for AI-generated emails',
                priority: 100
            },
            {
                key: 'company_intro',
                value: 'GreenChainz is a B2B platform connecting businesses with sustainable suppliers. We help companies reduce their carbon footprint through verified eco-friendly sourcing.',
                description: 'Company introduction used in emails',
                priority: 90
            },
            {
                key: 'value_proposition',
                value: 'Our platform offers: 1) Access to 500+ verified sustainable suppliers, 2) Automated certification tracking, 3) Carbon footprint analytics, 4) Compliance reporting for ESG requirements.',
                description: 'Key value propositions to highlight',
                priority: 85
            },
            {
                key: 'call_to_action',
                value: 'End emails with a soft CTA: offer a 15-minute demo call or free trial, not a hard sell.',
                description: 'How to end emails',
                priority: 80
            },
            {
                key: 'avoid_topics',
                value: 'Never mention: competitors by name, pricing specifics in cold outreach, unverified claims about savings percentages.',
                description: 'Topics to avoid in emails',
                priority: 70
            },
            {
                key: 'personalization_rules',
                value: 'Always personalize: use contact name, mention their company, reference their industry. If available, mention a recent news item or sustainability initiative.',
                description: 'Rules for personalization',
                priority: 75
            },
            {
                key: 'length_guidelines',
                value: 'Keep emails under 200 words. Use short paragraphs (2-3 sentences max). Include 1 clear CTA.',
                description: 'Email length and structure guidelines',
                priority: 60
            },
            {
                key: 'follow_up_rules',
                value: 'For follow-ups: reference the previous email briefly, add new value (case study, stat, or insight), never guilt-trip for not responding.',
                description: 'Rules for follow-up emails',
                priority: 65
            }
        ];

        const results = [];
        for (const instr of defaultInstructions) {
            const existing = await service.getInstruction(instr.key);
            if (!existing) {
                const result = await service.setInstruction(instr.key, instr.value, {
                    description: instr.description,
                    priority: instr.priority,
                    createdBy: req.user.userId
                });
                results.push({ key: instr.key, status: 'created' });
            } else {
                results.push({ key: instr.key, status: 'skipped (exists)' });
            }
        }

        res.json({ success: true, results });
    } catch (err) {
        console.error('[Outreach API] Seed instructions error:', err);
        res.status(500).json({ error: 'Failed to seed instructions' });
    }
});

// ==========================================
// SMART IMPORT (with deduplication)
// ==========================================

/**
 * POST /api/v1/outreach/contacts/smart-import
 * Import contacts with automatic deduplication
 */
router.post('/contacts/smart-import', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
    try {
        const { contacts, source } = req.body;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ error: 'Contacts array is required' });
        }

        const service = getService(req);
        const result = await service.smartImportContacts(contacts, source || 'import');
        res.json(result);
    } catch (err) {
        console.error('[Outreach API] Smart import error:', err);
        res.status(500).json({ error: 'Failed to smart import contacts' });
    }
});

/**
 * POST /api/v1/outreach/contacts/check-duplicates
 * Check for duplicate emails before import
 */
router.post('/contacts/check-duplicates', authenticateToken, async (req, res) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({ error: 'Emails array is required' });
        }

        const service = getService(req);
        const result = await service.checkDuplicates(emails);
        res.json(result);
    } catch (err) {
        console.error('[Outreach API] Check duplicates error:', err);
        res.status(500).json({ error: 'Failed to check duplicates' });
    }
});

module.exports = router;
