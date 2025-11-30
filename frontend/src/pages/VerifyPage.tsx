import MaterialVerifier from '../components/MaterialVerifier';

export default function VerifyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        GreenChainz Certification Engine
                    </h1>
                    <p className="text-gray-500">
                        Automated cross-reference across FSC, EPD International, EC3, and more
                    </p>
                </div>

                {/* Main Verifier Component */}
                <MaterialVerifier />

                {/* API Documentation */}
                <div className="max-w-2xl mx-auto mt-12">
                    <details className="bg-white rounded-lg shadow p-4">
                        <summary className="cursor-pointer font-medium text-gray-900">
                            🔧 API Endpoints (for automation)
                        </summary>
                        <div className="mt-4 space-y-4 text-sm">
                            <div className="bg-gray-50 rounded p-3">
                                <code className="text-green-600">GET</code>
                                <code className="ml-2">/api/v1/verify/material?q=steel</code>
                                <p className="text-gray-500 mt-1">Quick lookup - no auth required</p>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <code className="text-blue-600">POST</code>
                                <code className="ml-2">/api/v1/verify/product/:id</code>
                                <p className="text-gray-500 mt-1">Full product verification (auth required)</p>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <code className="text-blue-600">POST</code>
                                <code className="ml-2">/api/v1/verify/batch</code>
                                <p className="text-gray-500 mt-1">Batch verify multiple products (auth required)</p>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <code className="text-green-600">GET</code>
                                <code className="ml-2">/api/v1/verify/certifications</code>
                                <p className="text-gray-500 mt-1">List all known certification types</p>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </main>
    );
}
