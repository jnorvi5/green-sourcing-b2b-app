import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';

const UploadDemo: React.FC = () => {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUploadComplete = (url: string) => {
    setUploadedUrl(url);
    console.log('File uploaded to:', url);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Secure S3 File Upload Demo</h1>
      
      <div className="max-w-md mx-auto">
        <FileUpload 
          onUploadComplete={handleUploadComplete}
          label="Upload Asset (Image or PDF)"
        />

        {uploadedUrl && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Upload Successful!</h3>
            <p className="text-sm text-gray-600 break-all">
              <strong>URL:</strong> <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadedUrl}</a>
            </p>
            {/* Preview if image */}
            {(uploadedUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) && (
              <img src={uploadedUrl} alt="Uploaded asset" className="mt-4 max-h-64 rounded shadow-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDemo;
