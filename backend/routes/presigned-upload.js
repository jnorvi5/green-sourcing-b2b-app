const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { authenticateToken } = require('../middleware/auth');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * POST /api/v1/upload/presigned-url
 * Generate a presigned URL for direct S3 upload
 * 
 * Request body:
 * - fileName: string (required) - The name of the file to upload
 * - fileType: string (required) - The MIME type of the file
 * - folder: string (optional) - The folder/prefix in the S3 bucket (e.g., 'products', 'certifications')
 * 
 * Response:
 * - uploadUrl: string - The presigned URL for uploading
 * - key: string - The S3 key where the file will be stored
 * - expiresIn: number - URL expiration time in seconds
 */
router.post('/presigned-url', authenticateToken, async (req, res) => {
  try {
    const { fileName, fileType, folder = 'uploads' } = req.body;

    // Validate required fields
    if (!fileName || !fileType) {
      return res.status(400).json({ 
        error: 'fileName and fileType are required' 
      });
    }

    // Validate S3 configuration
    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      console.error('AWS_S3_BUCKET environment variable is not configured');
      return res.status(500).json({ 
        error: 'S3 upload is not configured on the server' 
      });
    }

    // Generate unique key with timestamp and user ID
    const timestamp = Date.now();
    const userId = req.user.userId || 'anonymous';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${userId}/${timestamp}-${sanitizedFileName}`;

    // Create the S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
    });

    // Generate presigned URL (valid for 15 minutes)
    const expiresIn = 900; // 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    res.json({
      uploadUrl,
      key,
      expiresIn,
      bucketName,
      message: 'Presigned URL generated successfully',
    });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    res.status(500).json({ 
      error: 'Failed to generate upload URL',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * GET /api/v1/upload/config
 * Get upload configuration and constraints
 */
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const isConfigured = !!(process.env.AWS_S3_BUCKET && 
                            process.env.AWS_ACCESS_KEY_ID && 
                            process.env.AWS_SECRET_ACCESS_KEY);

    res.json({
      enabled: isConfigured,
      maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
      allowedFileTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedFolders: ['products', 'certifications', 'uploads', 'documents'],
    });
  } catch (err) {
    console.error('Error fetching upload config:', err);
    res.status(500).json({ error: 'Failed to fetch upload configuration' });
  }
});

module.exports = router;
