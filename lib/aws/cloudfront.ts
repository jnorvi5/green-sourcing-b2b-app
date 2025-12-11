/**
 * CloudFront CDN Utilities for GreenChainz
 * 
 * Provides utilities for generating CDN URLs and managing cache invalidation.
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

// Environment configuration
const AWS_REGION = process.env['AWS_REGION'] ?? 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'];
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'];
const CLOUDFRONT_DISTRIBUTION_ID = process.env['AWS_CLOUDFRONT_DISTRIBUTION_ID'];
const CLOUDFRONT_DOMAIN = process.env['AWS_CLOUDFRONT_DOMAIN'] ?? 'cdn.greenchainz.com';
const IMAGES_BUCKET = process.env['AWS_IMAGES_BUCKET'] ?? 'gc-product-images-prod';

// Validate configuration
if (!CLOUDFRONT_DISTRIBUTION_ID) {
  console.warn('CloudFront distribution ID not configured. Invalidation will fail.');
}

// Initialize CloudFront client
const cloudFrontClient = new CloudFrontClient({
  region: AWS_REGION,
  ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  }),
});

interface CDNUrlOptions {
  /** Use S3 URL directly instead of CloudFront */
  useS3?: boolean;
  /** Image transformation parameters (for future use with image optimization) */
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  };
}

/**
 * Generate a CDN URL for a product image
 */
export function getCDNUrl(
  key: string,
  options?: CDNUrlOptions
): string {
  // If S3 is explicitly requested or CloudFront isn't configured
  if (options?.useS3 || !CLOUDFRONT_DOMAIN) {
    return `https://${IMAGES_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }

  // Build CloudFront URL
  let url = `https://${CLOUDFRONT_DOMAIN}/${key}`;

  // Add image transformation parameters if specified
  // Note: This requires CloudFront Functions or Lambda@Edge for actual transformation
  if (options?.transform) {
    const params = new URLSearchParams();
    if (options.transform.width) params.set('w', options.transform.width.toString());
    if (options.transform.height) params.set('h', options.transform.height.toString());
    if (options.transform.quality) params.set('q', options.transform.quality.toString());
    if (options.transform.format) params.set('f', options.transform.format);
    
    const queryString = params.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
    }
  }

  return url;
}

/**
 * Convert an S3 URL to a CDN URL
 */
export function s3ToCDNUrl(s3Url: string): string {
  // Extract the key from S3 URL
  const bucketPattern = new RegExp(
    `https://${IMAGES_BUCKET}\\.s3\\.${AWS_REGION}\\.amazonaws\\.com/(.+)$`
  );
  const match = s3Url.match(bucketPattern);
  
  if (match?.[1]) {
    return getCDNUrl(match[1]);
  }
  
  // Return original URL if it doesn't match the expected pattern
  return s3Url;
}

/**
 * Convert a CDN URL to an S3 URL
 */
export function cdnToS3Url(cdnUrl: string): string {
  const cdnPattern = new RegExp(`https://${CLOUDFRONT_DOMAIN}/(.+)$`);
  const match = cdnUrl.match(cdnPattern);
  
  if (match?.[1]) {
    // Remove any query parameters
    const key = match[1].split('?')[0];
    return `https://${IMAGES_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  }
  
  return cdnUrl;
}

/**
 * Extract the S3 key from a URL (CDN or S3)
 */
export function extractKeyFromUrl(url: string): string | null {
  // Try CDN URL pattern
  const cdnPattern = new RegExp(`https://${CLOUDFRONT_DOMAIN}/(.+?)(?:\\?.*)?$`);
  const cdnMatch = url.match(cdnPattern);
  if (cdnMatch?.[1]) {
    return cdnMatch[1];
  }
  
  // Try S3 URL pattern
  const s3Pattern = new RegExp(
    `https://${IMAGES_BUCKET}\\.s3\\.${AWS_REGION}\\.amazonaws\\.com/(.+)$`
  );
  const s3Match = url.match(s3Pattern);
  if (s3Match?.[1]) {
    return s3Match[1];
  }
  
  return null;
}

/**
 * Invalidate CloudFront cache for specific paths
 */
export async function invalidateCache(
  paths: string[]
): Promise<{ invalidationId: string; status: string }> {
  if (!CLOUDFRONT_DISTRIBUTION_ID) {
    throw new Error('CloudFront distribution ID not configured');
  }

  // Ensure paths start with /
  const normalizedPaths = paths.map(path => 
    path.startsWith('/') ? path : `/${path}`
  );

  const command = new CreateInvalidationCommand({
    DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: `gc-invalidation-${Date.now()}`,
      Paths: {
        Quantity: normalizedPaths.length,
        Items: normalizedPaths,
      },
    },
  });

  const response = await cloudFrontClient.send(command);

  return {
    invalidationId: response.Invalidation?.Id ?? '',
    status: response.Invalidation?.Status ?? 'Unknown',
  };
}

/**
 * Invalidate cache for a specific product's images
 */
export async function invalidateProductImages(
  supplierId: string,
  productId?: string
): Promise<{ invalidationId: string; status: string }> {
  const path = productId
    ? `/products/${supplierId}/${productId}/*`
    : `/products/${supplierId}/*`;
  
  return invalidateCache([path]);
}

/**
 * Invalidate cache for a specific supplier's all images
 */
export async function invalidateSupplierImages(
  supplierId: string
): Promise<{ invalidationId: string; status: string }> {
  return invalidateCache([`/products/${supplierId}/*`]);
}

/**
 * Invalidate entire cache (use sparingly - expensive operation)
 */
export async function invalidateAllCache(): Promise<{ invalidationId: string; status: string }> {
  return invalidateCache(['/*']);
}

/**
 * Generate responsive image URLs for different sizes
 */
export function getResponsiveImageUrls(
  key: string
): {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
} {
  return {
    thumbnail: getCDNUrl(key, { transform: { width: 150, quality: 80 } }),
    small: getCDNUrl(key, { transform: { width: 300, quality: 85 } }),
    medium: getCDNUrl(key, { transform: { width: 600, quality: 85 } }),
    large: getCDNUrl(key, { transform: { width: 1200, quality: 90 } }),
    original: getCDNUrl(key),
  };
}

/**
 * Get optimized WebP URL for modern browsers
 */
export function getWebPUrl(key: string, width?: number): string {
  return getCDNUrl(key, {
    transform: {
      format: 'webp',
      width,
      quality: 85,
    },
  });
}

export { cloudFrontClient };
