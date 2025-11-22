const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

// Initialize S3 Client
// Credentials are automatically loaded from process.env:
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'greencahinz-assets';

/**
 * Uploads a file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - Optional folder path within the bucket
 * @returns {Promise<string>} - The URL of the uploaded file
 */
async function uploadFile(file, folder = 'uploads') {
  // Generate unique filename to prevent collisions
  const fileExtension = file.originalname.split('.').pop();
  const randomName = crypto.randomBytes(16).toString('hex');
  const key = `${folder}/${randomName}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'private' // Bucket is private by default, we don't need to set ACL if Block Public Access is on
  });

  try {
    await s3Client.send(command);
    // Return the location. For private buckets, you might want to return the Key
    // and generate a signed URL when reading. For now, we return the standard S3 URL structure.
    // If the bucket is private, this URL won't be publicly accessible directly.
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Generates a presigned URL for direct upload to S3
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type of the file
 * @param {string} folder - Optional folder path within the bucket
 * @returns {Promise<{signedUrl: string, publicUrl: string, key: string}>}
 */
async function generatePresignedUrl(filename, contentType, folder = 'uploads') {
  // Generate unique filename
  const fileExtension = filename.split('.').pop();
  const randomName = crypto.randomBytes(16).toString('hex');
  const key = `${folder}/${randomName}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    // Generate presigned URL valid for 5 minutes
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    return {
      signedUrl,
      publicUrl,
      key
    };
  } catch (error) {
    console.error('Presigned URL Generation Error:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

module.exports = {
  uploadFile,
  generatePresignedUrl,
  s3Client
};
