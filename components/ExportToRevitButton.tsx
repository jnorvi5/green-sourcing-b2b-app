'use client';

'use client';

/**
 * Export to Revit Button Component
 * Allows users to export GreenChainz materials to their Revit projects
 */

import { useState } from 'react';

interface ExportToRevitButtonProps {
  productId: string;
  productName: string;
}

export default function ExportToRevitButton({
  productId,
  productName,
}: ExportToRevitButtonProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projectUrn, setProjectUrn] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check connection status on mount
  useState(() => {
    checkConnectionStatus();
  });

  async function checkConnectionStatus() {
    try {
      const response = await fetch('/api/autodesk/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check connection:', err);
      setIsConnected(false);
    }
  }

  async function handleConnect() {
    try {
      const response = await fetch('/api/autodesk/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uri: window.location.pathname }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        // Redirect to Autodesk OAuth
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError('Failed to connect to Autodesk');
    }
  }

  async function handleExport() {
    if (!projectUrn.trim()) {
      setError('Please enter a project URN');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/autodesk/export-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          revit_project_urn: projectUrn,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setShowModal(false);
        setProjectUrn('');
        // Show success toast
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || 'Export failed');
      }
    } catch (err) {
      setError('Failed to export material');
    } finally {
      setIsExporting(false);
    }
  }

  function handleButtonClick() {
    if (isConnected === false) {
      handleConnect();
    } else {
      setShowModal(true);
    }
  }

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isConnected === null}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {isConnected === false ? 'Connect to Autodesk' : 'Export to Revit'}
      </button>

      {success && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          ✓ Material exported to Revit successfully!
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Export to Revit</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Exporting: <strong>{productName}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revit Project URN
              </label>
              <input
                type="text"
                value={projectUrn}
                onChange={(e) => setProjectUrn(e.target.value)}
                placeholder="urn:adsk.wipprod:fs.file:vf.xxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Autodesk ACC or BIM 360 project
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
