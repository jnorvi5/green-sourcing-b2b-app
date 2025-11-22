const express = require('express');
const router = express.Router();
const { generatePresignedUrl } = require('../services/s3');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/v1/presigned-upload
 * Generate a presigned URL for direct S3 upload
 * Body: { filename, contentType, folder? }
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { filename, contentType, folder } = req.body;

        if (!filename || !contentType) {
            return res.status(400).json({ error: 'filename and contentType are required' });
        }

        // Validate content type
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!allowedTypes.includes(contentType)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        const { signedUrl, publicUrl, key } = await generatePresignedUrl(
            filename,
            contentType,
            folder || 'uploads'
        );

        res.status(200).json({
            signedUrl,
            publicUrl,
            key
        });
    } catch (error) {
        console.error('Presigned URL Route Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate presigned URL' });
    }
});

module.exports = router;
