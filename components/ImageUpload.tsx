'use client';

// components/ImageUpload.tsx
"use client";

import { useState } from 'react';

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ onUploadComplete, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-upload when file is selected
      setUploading(true);
      // Placeholder for S3 upload logic
      console.log("Simulating upload for:", selectedFile.name);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      setUploading(false);
      
      // Generate a placeholder URL
      const placeholderUrl = URL.createObjectURL(selectedFile);
      if (onUploadComplete) {
        onUploadComplete(placeholderUrl);
      }
    }
  };

  // If used as a simple input overlay
  if (className) {
    return (
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={className}
        disabled={uploading}
      />
    );
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    setUploading(true);
    // Placeholder for S3 upload logic
    console.log("Simulating upload for:", file.name);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    setUploading(false);
    alert("Placeholder: Upload complete!");
  };

  return (
    <div className="max-w-xl mx-auto border rounded-lg p-6 bg-white shadow-md">
      <h2 className="text-xl font-semibold mb-4">S3 Asset Uploader</h2>
      <p className="text-sm text-gray-500 mb-4">
        This component is a placeholder for testing the S3 asset pipeline. Select a file and click upload.
      </p>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
