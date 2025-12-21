'use client';

'use client';

/**
 * BIM Carbon Analysis Page
 * Upload BIM models and analyze embodied carbon
 */

import { useState } from 'react';
import type { BIMAnalysis, MaterialAnalysis, CarbonAlternative } from '@/types/autodesk';

export default function CarbonAnalysisPage() {
  const [modelUrn, setModelUrn] = useState('');
  const [modelName, setModelName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BIMAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Check connection on mount
  useState(() => {
    checkConnection();
  });

  async function checkConnection() {
    try {
      const response = await fetch('/api/autodesk/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (err) {
      setIsConnected(false);
    }
  }

  async function handleConnect() {
    try {
      const response = await fetch('/api/autodesk/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uri: '/carbon-analysis' }),
      });

      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError('Failed to connect to Autodesk');
    }
  }

  async function handleAnalyze() {
    if (!modelUrn.trim()) {
      setError('Please enter a model URN');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      // Start analysis
      const response = await fetch('/api/autodesk/analyze-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_urn: modelUrn,
          model_name: modelName || undefined,
        }),
      });

      const data = await response.json();

      if (data.status === 'failed') {
        setError(data.error || 'Analysis failed');
        setIsAnalyzing(false);
        return;
      }

      // Poll for results
      const analysisId = data.analysis_id;
      pollAnalysisResult(analysisId);
    } catch (err) {
      setError('Failed to analyze model');
      setIsAnalyzing(false);
    }
  }

  async function pollAnalysisResult(analysisId: string) {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/autodesk/analyze-model?analysis_id=${analysisId}`);
        const data: BIMAnalysis = await response.json();

        if (data.analysis_status === 'completed') {
          setAnalysis(data);
          setIsAnalyzing(false);
        } else if (data.analysis_status === 'failed') {
          setError(data.error_message || 'Analysis failed');
          setIsAnalyzing(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setError('Analysis timed out');
          setIsAnalyzing(false);
        }
      } catch (err) {
        setError('Failed to get analysis result');
        setIsAnalyzing(false);
      }
    };

    poll();
  }

  if (isConnected === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">BIM Carbon Analysis</h1>
          <p className="text-gray-600 mb-8">
            Connect your Autodesk account to analyze BIM models and calculate embodied carbon
          </p>
          <button
            onClick={handleConnect}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect to Autodesk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">BIM Carbon Analysis</h1>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload BIM Model</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model URN *
              </label>
              <input
                type="text"
                value={modelUrn}
                onChange={(e) => setModelUrn(e.target.value)}
                placeholder="urn:adsk.wipprod:dm.lineage:xxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in your Autodesk ACC or BIM 360 project
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name (optional)
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., Office Building - Level 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Carbon Footprint'}
            </button>
          </div>
        </div>

        {/* Results */}
        {analysis && analysis.analysis_data && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Embodied Carbon</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {(analysis.total_carbon_kg! / 1000).toFixed(1)} tons
                  </p>
                  <p className="text-xs text-gray-500">CO₂e</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Materials Analyzed</p>
                  <p className="text-3xl font-bold text-green-600">
                    {analysis.analysis_data.metadata.extracted_materials_count}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Matched Products</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {analysis.analysis_data.metadata.matched_materials_count}
                  </p>
                </div>
              </div>
            </div>

            {/* Materials Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Material Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Material
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Carbon/Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Carbon
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Match
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analysis.analysis_data.materials.map((material: MaterialAnalysis) => (
                      <tr key={material.id}>
                        <td className="px-4 py-3 text-sm">{material.name}</td>
                        <td className="px-4 py-3 text-sm">
                          {material.quantity.toFixed(2)} {material.unit}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {material.carbon_per_unit.toFixed(2)} kg CO₂e
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {material.total_carbon.toFixed(0)} kg CO₂e
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {material.match_type === 'exact' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Exact
                            </span>
                          )}
                          {material.match_type === 'fuzzy' && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              Fuzzy ({(material.match_confidence! * 100).toFixed(0)}%)
                            </span>
                          )}
                          {material.match_type === 'none' && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              No match
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alternatives */}
            {analysis.alternatives && analysis.alternatives.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Low-Carbon Alternatives</h3>
                <div className="space-y-4">
                  {analysis.alternatives.map((alt: CarbonAlternative, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{alt.original_material}</p>
                          <p className="text-sm text-gray-600">
                            → {alt.alternative_name}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          -{alt.carbon_reduction_percent.toFixed(0)}% carbon
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>
                          Current: {(alt.original_carbon_kg / 1000).toFixed(1)} tons CO₂e
                        </span>
                        <span>
                          Alternative: {(alt.alternative_carbon_kg / 1000).toFixed(1)} tons CO₂e
                        </span>
                        <span className="font-medium text-green-600">
                          Save: {(alt.carbon_reduction_kg / 1000).toFixed(1)} tons CO₂e
                        </span>
                      </div>
                      <a
                        href={`/products/${alt.product_id}`}
                        className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Product →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
