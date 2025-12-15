'use client';

'use client';

import { useState } from 'react';

export default function AgentsDashboard() {
  const [emailResult, setEmailResult] = useState<any>(null);
  const [socialResult, setSocialResult] = useState<any>(null);
  const [epdResult, setEpdResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEmailAgent = async () => {
    setLoading(true);
    const response = await fetch('/api/agents/email-writer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientType: 'Data Provider',
        purpose: 'Partnership Proposal',
        context: 'EPD International API integration for GreenChainz marketplace'
      })
    });
    const data = await response.json();
    setEmailResult(data);
    setLoading(false);
  };

  const testSocialAgent = async () => {
    setLoading(true);
    const response = await fetch('/api/agents/social-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'linkedin',
        contentType: 'milestone',
        topic: 'Just integrated EPD International API for real-time sustainability data'
      })
    });
    const data = await response.json();
    setSocialResult(data);
    setLoading(false);
  };

  const testDataScout = async () => {
    setLoading(true);
    const response = await fetch('/api/agents/data-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: 'FSC Certified Bamboo Flooring',
        manufacturer: 'EcoTimber',
        certType: 'FSC'
      })
    });
    const data = await response.json();
    setEpdResult(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 GreenChainz AI Agents
          </h1>
          <p className="text-gray-600">
            Test your operational AI agents for email, social media, and EPD data fetching
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Email Writer Agent */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                ✉️
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">Email Writer</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ACTIVE
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Generates professional B2B emails for partnerships, outreach, and proposals
            </p>
            <button
              onClick={testEmailAgent}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              {loading ? 'Testing...' : 'Test Email Agent'}
            </button>
          </div>

          {/* Social Media Agent */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                📣
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">Social Media</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  ACTIVE
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Creates LinkedIn/Twitter posts for announcements, insights, and milestones
            </p>
            <button
              onClick={testSocialAgent}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              {loading ? 'Testing...' : 'Test Social Agent'}
            </button>
          </div>

          {/* Data Scout Agent */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                🔍
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">Data Scout</h3>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  MOCK DATA
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Fetches EPD data, certifications, and carbon metrics from verified sources
            </p>
            <button
              onClick={testDataScout}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              {loading ? 'Testing...' : 'Test Data Scout'}
            </button>
          </div>
        </div>

        {/* Results Display */}
        <div className="space-y-4">
          {emailResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3 text-green-700">✉️ Email Writer Result</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold">Subject: {emailResult.email?.subject}</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap">{emailResult.email?.body}</pre>
              </div>
            </div>
          )}

          {socialResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3 text-blue-700">📣 Social Media Result</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-gray-500 mb-2">
                  Platform: {socialResult.post?.platform} | Type: {socialResult.post?.contentType}
                </p>
                <pre className="text-sm whitespace-pre-wrap">{socialResult.post?.content}</pre>
              </div>
            </div>
          )}

          {epdResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3 text-purple-700">🔍 Data Scout Result</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Product:</p>
                    <p>{epdResult.data?.productName}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Manufacturer:</p>
                    <p>{epdResult.data?.manufacturer}</p>
                  </div>
                  <div>
                    <p className="font-semibold">EPD Number:</p>
                    <p>{epdResult.data?.epdNumber}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Carbon Footprint:</p>
                    <p>{epdResult.data?.gwpFossilA1A3} kg CO2e</p>
                  </div>
                  <div>
                    <p className="font-semibold">Recycled Content:</p>
                    <p>{epdResult.data?.recycledContentPct}%</p>
                  </div>
                  <div>
                    <p className="font-semibold">Certifications:</p>
                    <p>{epdResult.data?.certifications?.join(', ')}</p>
                  </div>
                </div>
                {epdResult.note && (
                  <p className="mt-4 text-yellow-700 text-sm">⚠️ {epdResult.note}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="mt-8 bg-gray-800 text-white rounded-lg p-6">
          <h3 className="font-bold text-lg mb-3">🛠️ Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Email Agent:</p>
              <p className="text-green-400">✅ Operational</p>
            </div>
            <div>
              <p className="text-gray-400">Social Media Agent:</p>
              <p className="text-green-400">✅ Operational</p>
            </div>
            <div>
              <p className="text-gray-400">Data Scout (EPD):</p>
              <p className="text-yellow-400">⚠️ Using mock data - API key needed</p>
            </div>
            <div>
              <p className="text-gray-400">Next Steps:</p>
              <p className="text-blue-400">🔗 Connect EPD International API</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
