/**
 * Presigned Upload URL API
 * 
 * POST /api/upload/presigned
 * 
 * Generates a presigned URL for direct S3 uploads from the browser.
 * This bypasses the server for file transfers, reducing latency.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '../../../../lib/s3';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

interface PresignedRequest {
    filename: string;
    contentType: string;
    folder?: string;
}

// Allowed content types for uploads
const ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf', // EPD documents
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/upload/presigned
 * 
 * Body:
 * - filename: Original filename
 * - contentType: MIME type of the file
 * - folder: Optional folder prefix (products, certificates, epds)
 * 
 * Returns:
 * - uploadUrl: Presigned URL for PUT request
 * - publicUrl: Final public URL after upload
 * - key: S3 object key
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: PresignedRequest = await request.json();

        // Validate required fields
        if (!body.filename || !body.contentType) {
            return NextResponse.json(
                { success: false, error: 'filename and contentType are required' },
                { status: 400 }
            );
        }

        // Validate content type
        if (!ALLOWED_CONTENT_TYPES.includes(body.contentType)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid content type. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`
                },
                { status: 400 }
            );
        }

        // Generate unique key
        const timestamp = Date.now();
        const uniqueId = uuidv4();
        const extension = getExtension(body.filename);
        const folder = sanitizeFolder(body.folder || 'uploads');
        const key = `${folder}/${timestamp}-${uniqueId}${extension}`;

        // Generate presigned URL (valid for 1 hour)
        const uploadUrl = await getPresignedUploadUrl(key, body.contentType, 3600);

        // Construct public URL
        const bucket = process.env['AWS_BUCKET_NAME'];
        const region = process.env['AWS_REGION'] || 'us-east-1';
        const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

        return NextResponse.json({
            success: true,
            data: {
                uploadUrl,
                publicUrl,
                key,
                expiresIn: 3600,
            },
        });

    } catch (error) {
        console.error('[Presigned Upload API] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate upload URL' },
            { status: 500 }
        );
    }
}

/**
 * Extract file extension from filename
 */
function getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
        return '.' + parts.pop()?.toLowerCase();
    }
    return '';
}

/**
 * Sanitize folder name to prevent path traversal
 */
function sanitizeFolder(folder: string): string {
    // Remove leading/trailing slashes and any path traversal attempts
    return folder
        .replace(/^\/+|\/+$/g, '')
        .replace(/\.\./g, '')
        .replace(/[^a-zA-Z0-9-_/]/g, '');
}
