/**
 * AWS S3 Upload Utilities for GreenChainz
 * 
 * Provides utilities for uploading files to S3 with presigned URLs,
 * supporting both product images and EPD documents.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Environment configuration
const AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Bucket names
const IMAGES_BUCKET = process.env.AWS_IMAGES_BUCKET ?? 'gc-product-images-prod';
const EPD_BUCKET = process.env.AWS_EPD_BUCKET ?? 'gc-epd-documents-prod';
const BACKUP_BUCKET = process.env.AWS_BACKUP_BUCKET ?? 'gc-data-backups-prod';

// Validate credentials (fail fast when functions are invoked)
function assertAwsCredentials() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and bucket env vars.');
  }
}

// Initialize S3 client
const s3Client = new S3Client({
  region: AWS_REGION,
  ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  }),
});

export type BucketType = 'images' | 'epd' | 'backup';

interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  signedUrl?: string;
}

interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  bucket: string;
  publicUrl: string;
  expiresAt: Date;
}

interface PresignedDownloadResult {
  downloadUrl: string;
  expiresAt: Date;
}

function getBucketName(type: BucketType): string {
  switch (type) {
    case 'images':
      return IMAGES_BUCKET;
    case 'epd':
      return EPD_BUCKET;
    case 'backup':
      return BACKUP_BUCKET;
    default:
      throw new Error(`Invalid bucket type: ${type}`);
  }
}

function getExtensionFromContentType(contentType: string): string {
  const extensions: Record<string, string> = {
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
    'application/gzip': '.gz',
    'application/zip': '.zip',
  };
  return extensions[contentType] ?? '';
}

function generateUniqueKey(
  prefix: string,
  contentType: string,
  originalFilename?: string
): string {
  const timestamp = Date.now();
  const uniqueId = randomUUID();
  const extension = originalFilename 
    ? `.${originalFilename.split('.').pop()}`
    : getExtensionFromContentType(contentType);
  
  return `${prefix}/${timestamp}-${uniqueId}${extension}`;
}

/**
 * Upload a file directly to S3
 */
export async function uploadToS3(
  file: Buffer | Blob,
  bucketType: BucketType,
  options: {
    prefix?: string;
    contentType: string;
    filename?: string;
    metadata?: Record<string, string>;
  }
): Promise<UploadResult> {
  assertAwsCredentials();
  const bucket = getBucketName(bucketType);
  const key = generateUniqueKey(
    options.prefix ?? bucketType,
    options.contentType,
    options.filename
  );

  // Convert Blob to Buffer if necessary
  let body: Buffer;
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    body = Buffer.from(arrayBuffer);
  } else {
    body = file;
  }

  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: options.contentType,
    Metadata: options.metadata,
  }));

  const url = `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    key,
    bucket,
    url,
  };
}

/**
 * Generate a presigned URL for direct client uploads
 * This allows clients to upload files directly to S3 without going through the server
 */
export async function getPresignedUploadUrl(
  bucketType: BucketType,
  options: {
    contentType: string;
    prefix?: string;
    filename?: string;
    expiresIn?: number; // seconds, default 1 hour
  }
): Promise<PresignedUploadResult> {
  assertAwsCredentials();
  const bucket = getBucketName(bucketType);
  const key = generateUniqueKey(
    options.prefix ?? bucketType,
    options.contentType,
    options.filename
  );
  const expiresIn = options.expiresIn ?? 3600;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: options.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = `https://${bucket}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    bucket,
    publicUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

/**
 * Generate a presigned URL for downloading private files (EPD documents)
 */
export async function getPresignedDownloadUrl(
  bucketType: BucketType,
  key: string,
  options?: {
    expiresIn?: number; // seconds, default 1 hour
    responseContentDisposition?: string;
  }
): Promise<PresignedDownloadResult> {
  const bucket = getBucketName(bucketType);
  const expiresIn = options?.expiresIn ?? 3600;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(options?.responseContentDisposition && {
      ResponseContentDisposition: options.responseContentDisposition,
    }),
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    downloadUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

/**
 * Generate presigned POST data for multipart uploads
 * Useful for large file uploads with progress tracking
 */
export async function getPresignedPostUrl(
  bucketType: BucketType,
  options: {
    contentType: string;
    prefix?: string;
    maxSizeBytes?: number;
    expiresIn?: number;
  }
): Promise<{
  url: string;
  fields: Record<string, string>;
  key: string;
}> {
  const bucket = getBucketName(bucketType);
  const key = generateUniqueKey(
    options.prefix ?? bucketType,
    options.contentType
  );

  // For presigned POST, we need to use the @aws-sdk/s3-presigned-post package
  // For now, return the presigned PUT URL approach
  const { uploadUrl } = await getPresignedUploadUrl(bucketType, {
    contentType: options.contentType,
    prefix: options.prefix,
    expiresIn: options.expiresIn,
  });

  return {
    url: uploadUrl,
    fields: {
      'Content-Type': options.contentType,
    },
    key,
  };
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(
  bucketType: BucketType,
  key: string
): Promise<void> {
  const bucket = getBucketName(bucketType);
  assertAwsCredentials();

  await s3Client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
}

/**
 * Check if a file exists in S3
 */
export async function fileExistsInS3(
  bucketType: BucketType,
  key: string
): Promise<boolean> {
  const bucket = getBucketName(bucketType);

  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload a product image
 */
export async function uploadProductImage(
  file: Buffer | Blob,
  options: {
    supplierId: string;
    productId?: string;
    filename?: string;
  }
): Promise<UploadResult> {
  const prefix = options.productId 
    ? `products/${options.supplierId}/${options.productId}`
    : `products/${options.supplierId}`;

  return uploadToS3(file, 'images', {
    prefix,
    contentType: 'image/jpeg', // Assume JPEG, should be passed in
    filename: options.filename,
    metadata: {
      'supplier-id': options.supplierId,
      ...(options.productId && { 'product-id': options.productId }),
    },
  });
}

/**
 * Upload an EPD document (PDF)
 */
export async function uploadEPDDocument(
  file: Buffer | Blob,
  options: {
    supplierId: string;
    productId?: string;
    documentType?: 'epd' | 'certificate' | 'other';
    filename?: string;
  }
): Promise<UploadResult> {
  const docType = options.documentType ?? 'epd';
  const prefix = options.productId
    ? `${docType}/${options.supplierId}/${options.productId}`
    : `${docType}/${options.supplierId}`;

  return uploadToS3(file, 'epd', {
    prefix,
    contentType: 'application/pdf',
    filename: options.filename,
    metadata: {
      'supplier-id': options.supplierId,
      'document-type': docType,
      ...(options.productId && { 'product-id': options.productId }),
    },
  });
}

/**
 * Get a download URL for an EPD document (signed URL for private access)
 */
export async function getEPDDownloadUrl(
  key: string,
  options?: {
    expiresIn?: number;
    forceDownload?: boolean;
  }
): Promise<string> {
  const { downloadUrl } = await getPresignedDownloadUrl('epd', key, {
    expiresIn: options?.expiresIn ?? 3600,
    responseContentDisposition: options?.forceDownload 
      ? 'attachment' 
      : undefined,
  });

  return downloadUrl;
}

export { s3Client };
