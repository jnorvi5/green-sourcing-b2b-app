'use client';
import JoinForm from '../components/JoinForm';

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Section */}
            <section className="px-4 py-20 md:py-32">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="mb-6">
                        <span className="inline-block px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-full">
                            🌱 Founding 50 Program
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        The Trusted Data Layer for{' '}
                        <span className="text-green-600">Sustainable Sourcing</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        GreenChainz connects architects and contractors with verified green suppliers,
                        backed by standardized EPD data and certification transparency.
                    </p>
                    
                    {/* Email Capture Form */}
                    <div className="mb-8">
                        <JoinForm />
                    </div>
                    <p className="text-sm text-gray-500">
                        Join the first 50 verified suppliers shaping the future of sustainable procurement.
                    </p>
                </div>
            </section>

            {/* Value Proposition Section */}
            <section className="px-4 py-16 bg-white">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Why Join the Founding 50?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔍</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Verified Visibility
                            </h3>
                            <p className="text-gray-600">
                                Get discovered by architects and procurement teams searching for verified sustainable materials.
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Standardized EPD Data
                            </h3>
                            <p className="text-gray-600">
                                Your Environmental Product Declarations presented in a unified, comparable format buyers trust.
                            </p>
                        </div>
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🤝</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Direct RFQ Access
                            </h3>
                            <p className="text-gray-600">
                                Receive and respond to Request for Quotes directly from qualified buyers seeking green materials.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Buyers Section */}
            <section className="px-4 py-16 bg-gray-50">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">
                                For Architects & Contractors
                            </h2>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 font-bold text-xl">✓</span>
                                    <span className="text-gray-700">Compare EPDs and certifications across thousands of products</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 font-bold text-xl">✓</span>
                                    <span className="text-gray-700">Send RFQs to multiple verified suppliers in one click</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 font-bold text-xl">✓</span>
                                    <span className="text-gray-700">Meet LEED, BREEAM, and sustainability reporting requirements</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-600 font-bold text-xl">✓</span>
                                    <span className="text-gray-700">ISO 14025 and EN 15804 compliant data you can trust</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                Interested in early access?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                We&apos;re onboarding our Founding 50 suppliers now. Buyers can join the waitlist for platform access.
                            </p>
                            <JoinForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="px-4 py-20 bg-green-600 text-white">
                <div className="container mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Secure Your Spot in the Founding 50
                    </h2>
                    <p className="text-xl text-green-100 mb-8">
                        Limited to 50 founding suppliers. Early members get lifetime benefits and priority visibility.
                    </p>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                        <JoinForm />
                    </div>
                </div>
            </section>
        </main>
    );
}
