/**
 * AWS S3 Client Configuration and Helper Functions
 * 
 * Provides utilities for uploading, deleting, and generating presigned URLs
 * for S3 objects in the GreenChainz assets bucket.
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/**
 * S3 Client initialized with AWS credentials from environment variables
 */
const region = process.env['AWS_REGION'] || 'us-east-1';
const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];

function assertAwsCredentials() {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  }
}

export const s3Client = new S3Client({
  region,
  ...(accessKeyId && secretAccessKey && {
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  }),
});

const BUCKET_NAME = process.env['AWS_BUCKET_NAME'] || '';

/**
 * Result type for upload operations
 */
export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Uploads a file to S3 with a unique key generated from UUID and timestamp.
 * 
 * @param file - Buffer or Blob to upload
 * @param path - Path prefix for the file (e.g., 'products/', 'certificates/')
 * @param contentType - MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @returns Promise resolving to the public URL and key of the uploaded file
 */
export async function uploadFileToS3(
  file: Buffer | Blob,
  path: string,
  contentType: string
): Promise<UploadResult> {
  assertAwsCredentials();
  // Generate unique key with UUID and timestamp
  const timestamp = Date.now();
  const uniqueId = uuidv4();
  const extension = getExtensionFromContentType(contentType);
  const key = `${path}${timestamp}-${uniqueId}${extension}`;

  // Convert Blob to Buffer if necessary
  let body: Buffer;
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    body = Buffer.from(arrayBuffer);
  } else {
    body = file;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const url = `https://${BUCKET_NAME}.s3.${process.env['AWS_REGION'] || 'us-east-1'}.amazonaws.com/${key}`;

  return { url, key };
}

/**
 * Deletes a file from S3 by its key.
 * 
 * @param key - The S3 object key to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  assertAwsCredentials();
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generates a presigned URL for direct client uploads to S3.
 * 
 * This allows clients to upload files directly to S3 without going through
 * the server, reducing latency and server load.
 * 
 * @param key - The S3 object key for the upload
 * @param contentType - MIME type of the file to be uploaded
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise resolving to the presigned upload URL
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  assertAwsCredentials();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Helper function to get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/json': '.json',
    'text/plain': '.txt',
    'text/csv': '.csv',
  };

  return map[contentType] || '';
}
