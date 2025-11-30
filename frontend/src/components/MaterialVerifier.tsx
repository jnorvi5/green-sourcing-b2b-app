import { useState } from 'react';

interface VerificationResult {
    material: string;
    found: boolean;
    certifications: string[];
    bestMatch: {
        name: string;
        manufacturer: string;
        epdNumber: string;
        gwp: number;
        recycledContent: number;
        validUntil: string;
        link: string;
    } | null;
    confidence: number;
}

export default function MaterialVerifier() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // import.meta.env may not be typed in this TS setup — cast to any to avoid TS error
    const API_BASE = ((import.meta as any)?.env?.VITE_API_BASE_URL) ?? 'http://localhost:3001';

    const handleVerify = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(
                `${API_BASE}/api/v1/verify/material?q=${encodeURIComponent(query)}`
            );

            const data = await response.json();

            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            setError('Network error. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleVerify();
        }
    };

    // Quick search suggestions
    const suggestions = [
        'recycled steel',
        'FSC wood',
        'cellulose insulation',
        'concrete',
        'bamboo flooring'
    ];

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    🔍 Material Certification Lookup
                </h2>
                <p className="text-gray-600">
                    Enter any building material to instantly verify certifications
                </p>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter material name (e.g., recycled steel rebar)"
                    className="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-200 rounded-xl 
                     focus:border-green-500 focus:ring-2 focus:ring-green-200 
                     transition-all outline-none"
                />
                <button
                    onClick={handleVerify}
                    disabled={loading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 
                     bg-green-600 text-white px-4 py-2 rounded-lg
                     hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Checking...
                        </span>
                    ) : (
                        'Verify'
                    )}
                </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-sm text-gray-500">Try:</span>
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => {
                            setQuery(suggestion);
                            setResult(null);
                        }}
                        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 
                       rounded-full text-gray-700 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-700">❌ {error}</p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Confidence Score */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Results for "{result.material}"
                            </h3>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${result.confidence >= 70 ? 'bg-green-100 text-green-800' :
                                result.confidence >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {result.confidence}% confidence
                            </div>
                        </div>

                        {/* Suggested Certifications */}
                        {result.certifications.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-2">Relevant certifications:</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.certifications.map((cert) => (
                                        <span
                                            key={cert}
                                            className="px-3 py-1 bg-green-50 text-green-700 
                                 rounded-full text-sm border border-green-200"
                                        >
                                            {cert}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Best Match */}
                        {result.bestMatch ? (
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-medium text-gray-900 mb-3">
                                    ✅ Best Match Found
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Product</p>
                                        <p className="font-medium">{result.bestMatch.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Manufacturer</p>
                                        <p className="font-medium">{result.bestMatch.manufacturer}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">EPD Number</p>
                                        <p className="font-mono text-sm">{result.bestMatch.epdNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Valid Until</p>
                                        <p className="font-medium">
                                            {new Date(result.bestMatch.validUntil).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {result.bestMatch.gwp && (
                                        <div>
                                            <p className="text-sm text-gray-500">GWP (A1-A3)</p>
                                            <p className="font-medium">{result.bestMatch.gwp} kg CO₂e</p>
                                        </div>
                                    )}
                                    {result.bestMatch.recycledContent && (
                                        <div>
                                            <p className="text-sm text-gray-500">Recycled Content</p>
                                            <p className="font-medium">{result.bestMatch.recycledContent}%</p>
                                        </div>
                                    )}
                                </div>
                                {result.bestMatch.link && (
                                    <a
                                        href={result.bestMatch.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 mt-4 text-green-600 
                               hover:text-green-700 text-sm"
                                    >
                                        View Source Documentation →
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="border-t pt-4 mt-4 text-center">
                                <p className="text-gray-500">
                                    No verified EPD found. Consider requesting documentation from supplier.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* How It Works */}
            {!result && !loading && (
                <div className="mt-8 bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                        How Automated Verification Works
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">1.</span>
                            Enter any material name (e.g., "recycled steel", "FSC plywood")
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">2.</span>
                            System queries multiple certification databases in parallel
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">3.</span>
                            Results are aggregated, deduplicated, and scored
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">4.</span>
                            Best match returned with EPD data and verification status
                        </li>
                    </ul>
                    <p className="mt-4 text-xs text-gray-400">
                        Data sources: EPD International, Building Transparency (EC3), FSC, EcoPlatform
                    </p>
                </div>
            )}
        </div>
    );
}
