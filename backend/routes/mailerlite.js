/**
 * MailerLite API Routes
 * 
 * Handles:
 * - Newsletter subscriptions
 * - Supplier registration notifications
 * - Webhook receivers for MailerLite events
 */

const express = require('express');
const router = express.Router();
const { mailerLite } = require('../services/mailerLite');

/**
 * POST /api/v1/mailerlite/subscribe
 * Subscribe to newsletter
 */
router.post('/subscribe', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const result = await mailerLite.subscribeToNewsletter(email, name);
        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Subscribe error:', error);
        res.status(500).json({ error: 'Failed to subscribe', details: error.message });
    }
});

/**
 * POST /api/v1/mailerlite/supplier/register
 * Register a supplier and trigger welcome sequence
 */
router.post('/supplier/register', async (req, res) => {
    try {
        const { email, name, companyName, supplierId } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await mailerLite.onSupplierRegistered({
            email,
            name,
            companyName,
            supplierId
        });

        res.json({
            success: result.success,
            message: result.success
                ? 'Supplier registered and welcome sequence triggered'
                : 'Registration recorded but email notification failed',
            details: result
        });
    } catch (error) {
        console.error('[MailerLite Route] Supplier register error:', error);
        res.status(500).json({ error: 'Failed to register supplier', details: error.message });
    }
});

/**
 * POST /api/v1/mailerlite/notify/verification
 * Notify supplier about product verification
 */
router.post('/notify/verification', async (req, res) => {
    try {
        const { supplierEmail, productName, productId, verificationResults } = req.body;

        if (!supplierEmail || !productName || !verificationResults) {
            return res.status(400).json({
                error: 'Missing required fields: supplierEmail, productName, verificationResults'
            });
        }

        const result = await mailerLite.onProductVerified(
            { email: supplierEmail },
            { productName, productId },
            verificationResults
        );

        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Verification notify error:', error);
        res.status(500).json({ error: 'Failed to send notification', details: error.message });
    }
});

/**
 * POST /api/v1/mailerlite/notify/expiring-certs
 * Alert supplier about expiring certifications
 */
router.post('/notify/expiring-certs', async (req, res) => {
    try {
        const { supplierEmail, supplierName, certifications } = req.body;

        if (!supplierEmail || !certifications || !Array.isArray(certifications)) {
            return res.status(400).json({
                error: 'Missing required fields: supplierEmail, certifications (array)'
            });
        }

        const result = await mailerLite.onCertificationExpiring(
            { email: supplierEmail, name: supplierName },
            certifications
        );

        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Expiring certs notify error:', error);
        res.status(500).json({ error: 'Failed to send alert', details: error.message });
    }
});

/**
 * GET /api/v1/mailerlite/subscriber/:email
 * Get subscriber info
 */
router.get('/subscriber/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const result = await mailerLite.getSubscriber(email);
        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Get subscriber error:', error);
        res.status(500).json({ error: 'Failed to get subscriber', details: error.message });
    }
});

/**
 * PUT /api/v1/mailerlite/subscriber/:email
 * Update subscriber fields
 */
router.put('/subscriber/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { fields } = req.body;

        if (!fields || typeof fields !== 'object') {
            return res.status(400).json({ error: 'Fields object is required' });
        }

        const result = await mailerLite.updateSubscriberFields(email, fields);
        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Update subscriber error:', error);
        res.status(500).json({ error: 'Failed to update subscriber', details: error.message });
    }
});

/**
 * POST /api/v1/mailerlite/batch-import
 * Batch import subscribers
 */
router.post('/batch-import', async (req, res) => {
    try {
        const { subscribers, groupId } = req.body;

        if (!subscribers || !Array.isArray(subscribers) || subscribers.length === 0) {
            return res.status(400).json({ error: 'Subscribers array is required and must not be empty' });
        }

        const result = await mailerLite.batchImportSubscribers(subscribers, groupId);
        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Batch import error:', error);
        res.status(500).json({ error: 'Failed to import subscribers', details: error.message });
    }
});

/**
 * GET /api/v1/mailerlite/groups
 * Get all MailerLite groups (for admin)
 */
router.get('/groups', async (req, res) => {
    try {
        const result = await mailerLite.getGroups();
        res.json(result);
    } catch (error) {
        console.error('[MailerLite Route] Get groups error:', error);
        res.status(500).json({ error: 'Failed to get groups', details: error.message });
    }
});

/**
 * POST /api/v1/mailerlite/webhook
 * Receive webhooks from MailerLite
 */
router.post('/webhook', async (req, res) => {
    try {
        const event = req.body;
        console.log('[MailerLite Webhook] Received event:', event.type || 'unknown');

        // Handle different event types
        switch (event.type) {
            case 'subscriber.created':
                console.log('[MailerLite Webhook] New subscriber:', event.data?.email);
                break;
            case 'subscriber.unsubscribed':
                console.log('[MailerLite Webhook] Unsubscribed:', event.data?.email);
                // Could update local database here
                break;
            case 'campaign.sent':
                console.log('[MailerLite Webhook] Campaign sent:', event.data?.campaign_id);
                break;
            default:
                console.log('[MailerLite Webhook] Unhandled event type:', event.type);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('[MailerLite Webhook] Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
