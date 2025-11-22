/**
 * Uploads a file directly to AWS S3 using a Presigned URL.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToS3(file: File): Promise<string | null> {
    try {
        // Get JWT token from localStorage
        const token = localStorage.getItem('greenchainz-token');

        // 1. Request the Presigned URL from our API
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/presigned-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                folder: 'products'
            })
        });

        const { signedUrl, publicUrl } = await response.json();

            // 2. Upload the file directly to AWS using the signed URL
            const uploadResponse = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if(!uploadResponse.ok) throw new Error('Upload to S3 failed');

        console.log('✅ Upload Successful:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('Upload Error:', error);
        return null;
    }
}
