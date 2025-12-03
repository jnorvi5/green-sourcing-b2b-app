/**
 * AUTO-PROFILE API ROUTES
 * 
 * Endpoints for managing auto-generated unclaimed profiles:
 * - Create profiles
 * - Track views/clicks
 * - Process claims
 * - Send emails
 * - View analytics
 */

const express = require('express');
const router = express.Router();
const autoProfileGenerator = require('../services/autoProfileGenerator');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/auto-profile/generate
 * Generate a single unclaimed profile
 */
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const result = await autoProfileGenerator.generateProfile(req.body);
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error generating profile:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/auto-profile/bulk-generate
 * Bulk generate profiles from array
 */
router.post('/bulk-generate', requireAuth, async (req, res) => {
    try {
        const { companies } = req.body;
        
        if (!Array.isArray(companies)) {
            return res.status(400).json({ error: 'companies must be an array' });
        }

        const result = await autoProfileGenerator.bulkGenerateProfiles(companies);
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error bulk generating:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/auto-profile/send-email/:profileId
 * Send "Your page is live" email
 */
router.post('/send-email/:profileId', requireAuth, async (req, res) => {
    try {
        const result = await autoProfileGenerator.sendProfileLiveEmail(req.params.profileId);
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error sending email:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/auto-profile/bulk-send-emails
 * Send emails to all unclaimed profiles
 */
router.post('/bulk-send-emails', requireAuth, async (req, res) => {
    try {
        const result = await autoProfileGenerator.bulkSendEmails(req.body);
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error bulk sending emails:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/auto-profile/analytics
 * Get analytics for unclaimed profiles
 */
router.get('/analytics', requireAuth, async (req, res) => {
    try {
        const analytics = await autoProfileGenerator.getAnalytics();
        res.json(analytics);
    } catch (err) {
        console.error('[AutoProfile API] Error getting analytics:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/auto-profile/list
 * List all unclaimed profiles
 */
router.get('/list', requireAuth, async (req, res) => {
    try {
        const result = await autoProfileGenerator.listProfiles(req.query);
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error listing profiles:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/auto-profile/:slug
 * Get profile by slug (public)
 */
router.get('/:slug', async (req, res) => {
    try {
        const profile = await autoProfileGenerator.getProfile(req.params.slug);
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Track view
        await autoProfileGenerator.trackProfileView(req.params.slug);

        res.json(profile);
    } catch (err) {
        console.error('[AutoProfile API] Error getting profile:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/auto-profile/track-claim-click
 * Track claim button click
 */
router.post('/track-claim-click', async (req, res) => {
    try {
        const { slug } = req.body;
        await autoProfileGenerator.trackClaimClick(slug);
        res.json({ success: true });
    } catch (err) {
        console.error('[AutoProfile API] Error tracking click:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/auto-profile/claim/initiate
 * Step 1: Initiate claim process (send verification code)
 */
router.post('/claim/initiate', async (req, res) => {
    try {
        const { claimToken, email } = req.body;
        
        if (!claimToken || !email) {
            return res.status(400).json({ error: 'claimToken and email required' });
        }

        const result = await autoProfileGenerator.initiateClaimProcess(claimToken, { email });
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error initiating claim:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/auto-profile/claim/verify
 * Step 2: Verify code and complete claim
 */
router.post('/claim/verify', async (req, res) => {
    try {
        const { claimToken, verificationCode, userData } = req.body;
        
        if (!claimToken || !verificationCode || !userData) {
            return res.status(400).json({ error: 'claimToken, verificationCode, and userData required' });
        }

        const result = await autoProfileGenerator.verifyClaim(claimToken, verificationCode, userData);
        res.json(result);
    } catch (err) {
        console.error('[AutoProfile API] Error verifying claim:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/auto-profile/claim/:claimToken
 * Get profile by claim token (for claim page)
 */
router.get('/claim/:claimToken', async (req, res) => {
    try {
        const profile = await autoProfileGenerator.getProfileByClaimToken(req.params.claimToken);
        
        if (!profile) {
            return res.status(404).json({ error: 'Invalid claim token' });
        }

        // Return limited info for claim page
        res.json({
            companyName: profile.companyName,
            slug: profile.slug,
            logo: profile.logo,
            status: profile.status,
            profileUrl: `${process.env.FRONTEND_URL || 'https://greenchainz.com'}/supplier/${profile.slug}`
        });
    } catch (err) {
        console.error('[AutoProfile API] Error getting claim profile:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
