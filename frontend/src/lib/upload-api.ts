/**
 * File Upload API Client
 * 
 * Handles presigned URL generation and direct S3 uploads
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface PresignedResponse {
    success: boolean;
    data?: {
        uploadUrl: string;
        publicUrl: string;
        key: string;
        expiresIn: number;
    };
    error?: string;
}

/**
 * Get a presigned URL for uploading to S3
 */
export async function getPresignedUrl(
    filename: string,
    contentType: string,
    folder: string = 'products'
): Promise<PresignedResponse> {
    try {
        const token = localStorage.getItem('greenchainz-token');

        const response = await fetch(`${API_BASE}/api/upload/presigned`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
                filename,
                contentType,
                folder,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to get upload URL: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Presigned URL error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Upload a file to S3 using presigned URL
 * 
 * @returns The public URL of the uploaded file, or null on failure
 */
export async function uploadFile(
    file: File,
    folder: string = 'products',
    onProgress?: (progress: number) => void
): Promise<string | null> {
    try {
        // Step 1: Get presigned URL
        const presignedResponse = await getPresignedUrl(file.name, file.type, folder);

        if (!presignedResponse.success || !presignedResponse.data) {
            throw new Error(presignedResponse.error || 'Failed to get upload URL');
        }

        const { uploadUrl, publicUrl } = presignedResponse.data;

        // Step 2: Upload directly to S3
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }

        console.log('✅ File uploaded:', publicUrl);
        return publicUrl;

    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
    files: File[],
    folder: string = 'products',
    onProgress?: (index: number, progress: number) => void
): Promise<(string | null)[]> {
    const results: (string | null)[] = [];

    for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i], folder, (progress) => {
            onProgress?.(i, progress);
        });
        results.push(url);
    }

    return results;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
} = {}): { valid: boolean; error?: string } {
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options.allowedTypes || [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
    ];

    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
        };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
        };
    }

    return { valid: true };
}
