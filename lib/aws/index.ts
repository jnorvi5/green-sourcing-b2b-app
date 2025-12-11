/**
 * AWS Integration Utilities for GreenChainz
 * 
 * Barrel export file for all AWS-related utilities.
 */

// S3 Upload Utilities
export {
  uploadToS3,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  getPresignedPostUrl,
  deleteFromS3,
  fileExistsInS3,
  uploadProductImage,
  uploadEPDDocument,
  getEPDDownloadUrl,
  s3Client,
} from './s3-upload';
export type { BucketType } from './s3-upload';

// CloudFront CDN Utilities
// Temporarily disabled - requires @aws-sdk/client-cloudfront package
// export {
//   getCDNUrl,
//   s3ToCDNUrl,
//   cdnToS3Url,
//   extractKeyFromUrl,
//   invalidateCache,
//   invalidateProductImages,
//   invalidateSupplierImages,
//   invalidateAllCache,
//   getResponsiveImageUrls,
//   getWebPUrl,
//   cloudFrontClient,
// } from './cloudfront';

// SES Email Client
// Temporarily disabled - requires @aws-sdk/client-ses package
// export {
//   sendEmail,
//   sendTemplatedEmail,
//   sendBulkTemplatedEmail,
//   getSendQuota,
//   getSendStatistics,
//   sendRFQNotification,
//   sendSupplierVerificationEmail,
//   sendGreenAuditReport,
//   EMAIL_TEMPLATES,
//   sesClient,
// } from './ses-client';
// export type { EmailTemplate } from './ses-client';
