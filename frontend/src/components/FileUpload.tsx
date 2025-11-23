import React, { useState, type ChangeEvent } from 'react';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  label?: string;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  label = 'Upload File',
  accept = 'image/*,application/pdf'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const token = localStorage.getItem('token'); // Assuming token is stored here
      if (!token) {
        throw new Error('Authentication required');
      }

      // Step 1: Get Presigned URL
      const initResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'uploads' // Optional: organize by folder
        })
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || 'Failed to initialize upload');
      }

      const { signedUrl, publicUrl } = await initResponse.json();
      setProgress(30); // 30% progress after getting URL

      // Step 2: Upload directly to S3
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
      onUploadComplete(publicUrl);
      setFile(null); // Reset file input
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100"
          disabled={uploading}
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-4 py-2 rounded-md text-white font-medium transition-colors
            ${!file || uploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'}`}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {uploading && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
