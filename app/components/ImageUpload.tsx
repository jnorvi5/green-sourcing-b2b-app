'use client';

import { useState } from 'react';
// Temporary local implementation to avoid a missing module error for
// '@/lib/s3-upload'. This stub returns a local object URL for preview
// and can be replaced with the real uploadToS3 implementation later.
async function uploadToS3(file: File): Promise<string | null> {
    try {
        // Create a temporary object URL so the UI can show a preview.
        // In production, replace this with actual upload logic (e.g. POST
        // to an API route or direct S3/Presigned URL upload) that returns
        // the publicly accessible file URL.
        return URL.createObjectURL(file);
    } catch (e) {
        console.error('uploadToS3 stub error', e);
        return null;
    }
}

export default function ImageUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);

        try {
            // Call our utility function
            const url = await uploadToS3(file);

            if (url) {
                setImageUrl(url);
                alert('Success! File secured in the Vault.');
            } else {
                alert('Upload failed. Check console for details.');
            }
        } catch (error) {
            console.error(error);
            alert('Upload Error');
        } finally {
            setUploading(false);
        }
    };

    return (
        // using the glass-effect class from layout.css
        <div className="glass-effect p-8 rounded-2xl max-w-md mx-auto mt-10 text-center">
            <h2 className="text-2xl font-bold mb-6 text-gradient">Upload Green Asset</h2>

            {/* File Input */}
            <div className="mb-6">
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100"
                />
            </div>

            {/* Action Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`btn-primary w-full flex justify-center items-center gap-2 ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {uploading ? (
                    <>
                        {/* Spinner from layout.css */}
                        <div className="spinner w-5 h-5 border-2"></div>
                        Uploading...
                    </>
                ) : (
                    'Upload to S3'
                )}
            </button>

            {/* Preview Area */}
            {imageUrl && (
                <div className="mt-6 fade-in">
                    <p className="text-sm text-green-600 mb-2">✅ Upload Complete:</p>
                    <img
                        src={imageUrl}
                        alt="Uploaded asset"
                        className="w-full h-48 object-cover rounded-lg border border-green-200 shadow-lg"
                    />
                    <p className="text-xs text-gray-400 mt-2 break-all">{imageUrl}</p>
                </div>
            )}
        </div>
    );
}
