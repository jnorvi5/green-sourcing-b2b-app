'use client';

import { useState } from 'react';
import JoinForm from '../components/JoinForm';

export default function Home() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/api/email/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Welcome to the Founding 50! Check your email.');
                setEmail('');
            } else {
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Connection error. Please try again.');
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Limited to 50 Founding Members
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Verified Sustainable Sourcing
                        <span className="block text-emerald-600 mt-2">for the Founding 50</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                        Join the exclusive beta of GreenChainz - the B2B marketplace connecting verified sustainable suppliers with conscious buyers.
                    </p>

                    {/* Email Capture Form */}
                    <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                                placeholder="Enter your work email"
                                required
                                disabled={status === 'loading'}
                                className="flex-1 px-6 py-4 rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-lg disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? 'Joining...' : 'Join the Beta'}
                            </button>
                        </div>
                        {message && (
                            <p className={`mt-4 text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {message}
                            </p>
                        )}
                    </form>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 mb-16">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified Suppliers
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Carbon Tracking
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            ESG Reporting
                        </div>
                    </div>

                    {/* Value Props */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Verified Credentials</h3>
                            <p className="text-gray-600 text-sm">Every supplier is vetted with real sustainability certifications and carbon data.</p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Instant Matching</h3>
                            <p className="text-gray-600 text-sm">AI-powered matchmaking connects you with the right suppliers in seconds.</p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Track Impact</h3>
                            <p className="text-gray-600 text-sm">Real-time carbon tracking and automated ESG reporting for every purchase.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-8">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p>&copy; 2024 GreenChainz. Building the future of sustainable B2B sourcing.</p>
                </div>
            </footer>
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
