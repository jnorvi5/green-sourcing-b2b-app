/**
 * Certification Verification API Routes
 * 
 * Provides automated cross-referencing of materials against
 * multiple certification databases (FSC, EPD, EC3, etc.)
 * 
 * Endpoints:
 *   GET  /api/v1/verify/material?q=steel     - Quick lookup
 *   POST /api/v1/verify/product/:id          - Full product verification
 *   POST /api/v1/verify/batch                - Batch verify multiple products
 */

const express = require('express');
const router = express.Router();
const CertificationVerifier = require('../services/certificationVerifier');
const { authenticateToken } = require('../middleware/auth');

// Initialize verifier (pool injected via middleware)
let verifier = null;

// Middleware to inject db pool
router.use((req, res, next) => {
    if (!verifier && req.app.locals.pool) {
        verifier = new CertificationVerifier(req.app.locals.pool);
    }
    next();
});

/**
 * GET /api/v1/verify/material?q=recycled+steel
 * 
 * Quick lookup - just enter a material name, get back certifications
 * No auth required (public endpoint for search)
 */
router.get('/material', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                error: 'Query parameter "q" is required (min 2 characters)'
            });
        }

        // Ensure verifier is initialized
        if (!verifier) {
            verifier = new CertificationVerifier(req.app.locals.pool);
        }

        const result = await verifier.quickLookup(q.trim());

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Material verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/verify/material/:name/full
 * 
 * Full verification with all provider details
 */
router.get('/material/:name/full', async (req, res) => {
    try {
        const { name } = req.params;

        if (!verifier) {
            verifier = new CertificationVerifier(req.app.locals.pool);
        }

        const result = await verifier.verifyMaterial(decodeURIComponent(name));

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Full verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: error.message
        });
    }
});

/**
 * POST /api/v1/verify/product/:id
 * 
 * Verify all materials in a product
 * Requires authentication
 */
router.post('/product/:id', authenticateToken, async (req, res) => {
    try {
        const productId = parseInt(req.params.id, 10);

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        if (!verifier) {
            verifier = new CertificationVerifier(req.app.locals.pool);
        }

        const result = await verifier.verifyProduct(productId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Product verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: error.message
        });
    }
});

/**
 * POST /api/v1/verify/batch
 * 
 * Verify multiple products at once
 * Body: { productIds: [1, 2, 3] }
 * Requires authentication
 */
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' });
        }

        if (productIds.length > 50) {
            return res.status(400).json({ error: 'Maximum 50 products per batch' });
        }

        if (!verifier) {
            verifier = new CertificationVerifier(req.app.locals.pool);
        }

        const results = await verifier.batchVerify(productIds);

        res.json({
            success: true,
            data: {
                total: productIds.length,
                verified: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
    } catch (error) {
        console.error('Batch verification error:', error);
        res.status(500).json({
            error: 'Batch verification failed',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/verify/certifications
 * 
 * List all known certification types and their descriptions
 */
router.get('/certifications', (req, res) => {
    const certifications = {
        // Wood & Forest
        'FSC': {
            name: 'Forest Stewardship Council',
            category: 'Wood Products',
            description: 'Ensures wood products come from responsibly managed forests',
            website: 'https://fsc.org'
        },
        'PEFC': {
            name: 'Programme for the Endorsement of Forest Certification',
            category: 'Wood Products',
            description: 'International forest certification standard',
            website: 'https://pefc.org'
        },
        'SFI': {
            name: 'Sustainable Forestry Initiative',
            category: 'Wood Products',
            description: 'North American forest certification',
            website: 'https://forests.org'
        },

        // EPD & LCA
        'EPD': {
            name: 'Environmental Product Declaration',
            category: 'Life Cycle Assessment',
            description: 'Standardized environmental impact data (ISO 14025)',
            website: 'https://www.environdec.com'
        },
        'ISO 14025': {
            name: 'ISO 14025 Type III Environmental Declaration',
            category: 'Life Cycle Assessment',
            description: 'International standard for EPDs',
            website: 'https://www.iso.org'
        },

        // Building & Construction
        'LEED': {
            name: 'Leadership in Energy and Environmental Design',
            category: 'Green Building',
            description: 'Green building rating system by USGBC',
            website: 'https://www.usgbc.org/leed'
        },
        'Cradle to Cradle': {
            name: 'Cradle to Cradle Certified',
            category: 'Circular Economy',
            description: 'Product circularity and safety certification',
            website: 'https://c2ccertified.org'
        },

        // Textiles
        'GOTS': {
            name: 'Global Organic Textile Standard',
            category: 'Textiles',
            description: 'Organic fiber certification for textiles',
            website: 'https://global-standard.org'
        },
        'OEKO-TEX': {
            name: 'OEKO-TEX Standard 100',
            category: 'Textiles',
            description: 'Tests for harmful substances in textiles',
            website: 'https://www.oeko-tex.com'
        },

        // Recycled Content
        'GRS': {
            name: 'Global Recycled Standard',
            category: 'Recycled Content',
            description: 'Tracks recycled content through supply chain',
            website: 'https://textileexchange.org/grs'
        },
        'SCS Recycled Content': {
            name: 'SCS Recycled Content Certification',
            category: 'Recycled Content',
            description: 'Third-party verification of recycled materials',
            website: 'https://www.scsglobalservices.com'
        },

        // Indoor Air Quality
        'GREENGUARD': {
            name: 'GREENGUARD Certification',
            category: 'Indoor Air Quality',
            description: 'Low chemical emissions certification',
            website: 'https://www.ul.com/resources/greenguard-certification'
        },

        // Carbon & Climate
        'Carbon Trust': {
            name: 'Carbon Trust Standard',
            category: 'Carbon',
            description: 'Carbon footprint measurement and reduction',
            website: 'https://www.carbontrust.com'
        }
    };

    res.json({
        success: true,
        count: Object.keys(certifications).length,
        data: certifications
    });
});

/**
 * GET /api/v1/verify/suggestions?material=wood
 * 
 * Get suggested certifications for a material type
 */
router.get('/suggestions', (req, res) => {
    const { material } = req.query;

    if (!material) {
        return res.status(400).json({ error: 'material query param required' });
    }

    if (!verifier) {
        verifier = new CertificationVerifier(req.app.locals.pool);
    }

    const suggestions = verifier.getSuggestedCertifications(material);

    res.json({
        success: true,
        material,
        suggestedCertifications: suggestions
    });
});

module.exports = router;
