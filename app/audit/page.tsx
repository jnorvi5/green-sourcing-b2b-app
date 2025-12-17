'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle, TrendingUp } from 'lucide-react';

interface Material {
  name: string;
  quantity: number;
  unit: string;
  specifications: Record<string, string>;
  sustainability_score: number;
  certifications: string[];
  estimated_carbon_footprint_kg_co2: number;
  alternatives: string[];
}

interface AuditResult {
  materials: Material[];
  summary: string;
  overall_audit_score: number;
  recommendations: string[];
}

export default function AuditPage() {
  const [description, setDescription] = useState(
    'A commercial office building with 50,000 sq ft of FSC bamboo flooring, recycled concrete foundation, green roof with native plants, and low-VOC paint throughout.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/audit/extract-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data.audit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🌱 AI Sustainability Audit
          </h1>
          <p className="text-lg text-slate-600">
            Extract building materials and analyze sustainability scores instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              Describe Your Building Materials
            </h2>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe building materials, finishes, and specs..."
              className="w-full h-64 p-4 border-2 border-slate-300 rounded-lg font-mono text-sm focus:border-teal-500 focus:outline-none resize-none"
            />

            <button
              onClick={handleAudit}
              disabled={loading || !description.trim()}
              className="mt-6 w-full bg-teal-500 hover:bg-teal-600 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                '🔍 Run Audit'
              )}
            </button>

            <p className="text-sm text-slate-500 mt-4">
              💡 Tip: Paste your building description or Revit model specs here
            </p>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="text-center text-slate-400 py-12">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Run an audit to see results here</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-teal-50 to-green-50 p-6 rounded-lg border-2 border-teal-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Overall Audit Score</p>
                      <p className="text-4xl font-bold text-teal-600">
                        {result.overall_audit_score}/100
                      </p>
                    </div>
                    <CheckCircle className="w-16 h-16 text-teal-500" />
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Assessment</h3>
                  <p className="text-slate-700 leading-relaxed">{result.summary}</p>
                </div>

                {/* Materials List */}
                {result.materials.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Materials Identified</h3>
                    <div className="space-y-3">
                      {result.materials.map((material, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-50 rounded-lg border-l-4 border-teal-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-slate-900">{material.name}</p>
                            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-bold">
                              {material.sustainability_score}%
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {material.quantity} {material.unit}
                          </p>
                          {material.certifications.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {material.certifications.map((cert, c) => (
                                <span
                                  key={c}
                                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                >
                                  {cert}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            Carbon: {material.estimated_carbon_footprint_kg_co2} kg CO₂
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-teal-500">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 bg-teal-50 border-2 border-teal-200 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Next Steps</h3>
          <ol className="space-y-2 text-slate-700">
            <li className="flex gap-3">
              <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </span>
              Review material sustainability scores
            </li>
            <li className="flex gap-3">
              <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </span>
              Find verified suppliers matching your material needs
            </li>
            <li className="flex gap-3">
              <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </span>
              Compare pricing, certifications, and availability
            </li>
            <li className="flex gap-3">
              <span className="bg-teal-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                4
              </span>
              Generate RFQ and send to suppliers
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
