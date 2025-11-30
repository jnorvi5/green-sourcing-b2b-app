import { useState } from 'react';

interface UseS3UploadResult {
  uploadFile: (file: File, folder?: string) => Promise<string>;
  uploading: boolean;
  error: string | null;
  progress: number;
}

export const useS3Upload = (): UseS3UploadResult => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      // 1. Get Presigned URL
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/presigned-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get upload URL');
      }

      const { signedUrl, publicUrl } = await response.json();

      // 2. Upload to S3
      // Note: XHR is used here to track upload progress if needed, but fetch is simpler.
      // For simplicity in this hook, we use fetch but simulate progress or just await it.
      // To support real progress, we'd need XMLHttpRequest.
      
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      setProgress(100);
      return publicUrl;

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error, progress };
};
