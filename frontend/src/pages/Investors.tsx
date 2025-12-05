// frontend/src/pages/Investors.tsx
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    DollarSign,
    Users,
    Globe,
    ArrowRight,
    Building2,
    Leaf,
    Target,
    BarChart3,
    Zap,
    Mail,
    Calendar,
    FileText,
    Download
} from 'lucide-react';
import SEO from '../components/SEO';

// YouTube Embed Component
function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
    return (
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/20">
            <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
            />
        </div>
    );
}

export default function Investors() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
            <SEO
                title="Investors | GreenChainz"
                description="Invest in the future of sustainable commerce. GreenChainz is the global trust layer for B2B sustainable sourcing, connecting verified suppliers with enterprise buyers."
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6">
                                <TrendingUp className="w-4 h-4" />
                                Series A — Now Open
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                                Invest in the{' '}
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    $4.5T Sustainable
                                </span>{' '}
                                Materials Market
                            </h1>
                            <p className="text-lg md:text-xl text-gray-400 mb-8">
                                GreenChainz is building the trust infrastructure for B2B sustainable commerce.
                                Join us as we become the Stripe for sustainability verification.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="mailto:investors@greenchainz.com?subject=Investment%20Inquiry"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all hover:scale-105"
                                >
                                    <Mail className="w-5 h-5" />
                                    Request Deck
                                </a>
                                <a
                                    href="https://calendly.com/greenchainz/investor-call"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-700 hover:border-amber-500 text-gray-300 hover:text-white font-semibold transition-all"
                                >
                                    <Calendar className="w-5 h-5" />
                                    Schedule Call
                                </a>
                            </div>
                        </div>
                        <div>
                            <YouTubeEmbed
                                videoId="dQw4w9WgXcQ"
                                title="GreenChainz Investor Pitch"
                            />
                            <p className="text-center text-gray-500 text-sm mt-4">
                                Watch: 3-minute investor overview
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Market Opportunity */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Massive Market Opportunity
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Regulatory pressure and ESG mandates are driving unprecedented demand for verified sustainable materials.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { value: '$4.5T', label: 'Global Green Building Materials Market by 2030', icon: Building2 },
                            { value: '24%', label: 'Annual Market Growth Rate (CAGR)', icon: TrendingUp },
                            { value: '78%', label: 'Fortune 500 with Net-Zero Commitments', icon: Target },
                            { value: '$2.1B', label: 'Annual Greenwashing Fines (EU alone)', icon: DollarSign }
                        ].map((stat, index) => (
                            <div key={index} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center hover:border-amber-500/50 transition-colors">
                                <stat.icon className="w-8 h-8 text-amber-400 mx-auto mb-4" />
                                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-gray-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Problem We Solve */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                The Problem: Trust Deficit in Sustainable Sourcing
                            </h2>
                            <div className="space-y-6">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-red-400 mb-2">For Buyers</h3>
                                    <p className="text-gray-400">
                                        82% of procurement teams can't verify supplier sustainability claims.
                                        Manual verification takes 6-8 weeks per supplier.
                                    </p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-red-400 mb-2">For Suppliers</h3>
                                    <p className="text-gray-400">
                                        Legitimate sustainable suppliers lose deals to greenwashers.
                                        No standard way to prove authenticity.
                                    </p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-red-400 mb-2">Market Impact</h3>
                                    <p className="text-gray-400">
                                        $3.4B lost annually to fraudulent sustainability claims in construction alone.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Our Solution: <span className="text-emerald-400">Trust as a Service</span>
                            </h2>
                            <div className="space-y-6">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-emerald-400 mb-2">Automated Verification</h3>
                                    <p className="text-gray-400">
                                        Real-time EPD authentication, carbon tracking, and supply chain verification.
                                        6-8 weeks → 6-8 seconds.
                                    </p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-emerald-400 mb-2">Marketplace + SaaS</h3>
                                    <p className="text-gray-400">
                                        Hybrid revenue model: Transaction fees on marketplace + subscription for enterprise verification tools.
                                    </p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-emerald-400 mb-2">Network Effects</h3>
                                    <p className="text-gray-400">
                                        Each verified supplier makes the platform more valuable for buyers,
                                        creating strong moats and retention.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Traction */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Early Traction
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Strong early signals from both sides of the marketplace.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-gradient-to-br from-green-500/20 to-green-400/20 rounded-2xl p-8 border border-green-500/20 text-center">
                            <div className="text-5xl font-bold text-green-400 mb-2">$2.4M</div>
                            <div className="text-white font-medium mb-2">GMV Pipeline</div>
                            <p className="text-gray-400 text-sm">Active RFQs from enterprise buyers</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-8 border border-amber-500/20 text-center">
                            <div className="text-5xl font-bold text-amber-400 mb-2">175</div>
                            <div className="text-white font-medium mb-2">Founding Members</div>
                            <p className="text-gray-400 text-sm">Waitlist for Charter 175 founding suppliers</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-8 border border-blue-500/20 text-center">
                            <div className="text-5xl font-bold text-blue-400 mb-2">47</div>
                            <div className="text-white font-medium mb-2">Enterprise LOIs</div>
                            <p className="text-gray-400 text-sm">Letters of intent from procurement teams</p>
                        </div>
                    </div>

                    {/* Logo Cloud */}
                    <div className="text-center">
                        <p className="text-gray-500 text-sm mb-6">Trusted by forward-thinking organizations</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                            <div className="w-32 h-12 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Partner Logo</div>
                            <div className="w-32 h-12 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Partner Logo</div>
                            <div className="w-32 h-12 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Partner Logo</div>
                            <div className="w-32 h-12 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Partner Logo</div>
                            <div className="w-32 h-12 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">Partner Logo</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Business Model */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Revenue Model
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                            <BarChart3 className="w-10 h-10 text-emerald-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Marketplace Take Rate</h3>
                            <div className="text-3xl font-bold text-emerald-400 mb-4">3-5%</div>
                            <p className="text-gray-400">
                                Transaction fee on all RFQ-driven purchases through the platform.
                            </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                            <Zap className="w-10 h-10 text-amber-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Supplier Subscriptions</h3>
                            <div className="text-3xl font-bold text-amber-400 mb-4">$299-2,999/mo</div>
                            <p className="text-gray-400">
                                Tiered plans for enhanced visibility, analytics, and verification badges.
                            </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                            <Building2 className="w-10 h-10 text-blue-400 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Enterprise API</h3>
                            <div className="text-3xl font-bold text-blue-400 mb-4">$10K+/mo</div>
                            <p className="text-gray-400">
                                Verification-as-a-Service API for enterprise procurement systems.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Leadership Team
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Domain experts in sustainability, marketplace operations, and enterprise software.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: 'CEO Name', role: 'CEO & Co-Founder', bio: 'Ex-Stripe, 10+ years in payments infrastructure' },
                            { name: 'CTO Name', role: 'CTO & Co-Founder', bio: 'Ex-Google, built supply chain systems at scale' },
                            { name: 'CSO Name', role: 'Chief Sustainability Officer', bio: '15+ years in green building certification' }
                        ].map((member, index) => (
                            <div key={index} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                                <p className="text-green-400 text-sm mb-2">{member.role}</p>
                                <p className="text-gray-400 text-sm">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Investment CTA */}
            <section className="py-20 bg-gradient-to-r from-amber-600/20 to-orange-600/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Leaf className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Join Us in Building the Future of Sustainable Commerce
                    </h2>
                    <p className="text-gray-300 mb-8 text-lg">
                        We're raising our Series A to accelerate growth and expand into new verticals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <a
                            href="mailto:investors@greenchainz.com?subject=Investment%20Inquiry"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all hover:scale-105"
                        >
                            <Mail className="w-5 h-5" />
                            Contact Investor Relations
                        </a>
                        <a
                            href="/GreenChainz-Overview.pdf"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/20 hover:border-amber-500 text-white font-semibold transition-all"
                        >
                            <Download className="w-5 h-5" />
                            Download Overview
                        </a>
                    </div>
                    <p className="text-gray-500 text-sm">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Full deck available upon NDA
                    </p>
                </div>
            </section>
        </div>
    );
}
