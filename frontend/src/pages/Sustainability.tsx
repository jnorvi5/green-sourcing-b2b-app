// frontend/src/pages/Sustainability.tsx
import { Link } from 'react-router-dom';
import {
    Leaf,
    Shield,
    BarChart3,
    Globe,
    CheckCircle,
    ArrowRight,
    Play,
    FileCheck,
    Recycle,
    TreePine
} from 'lucide-react';
import SEO from '../components/SEO';

// Reusable YouTube Embed Component
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

export default function Sustainability() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
            <SEO
                title="Sustainability | GreenChainz"
                description="Our commitment to verified sustainability. Learn how GreenChainz ensures zero greenwashing through authenticated EPDs, carbon tracking, and transparent supply chains."
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                            <Leaf className="w-4 h-4" />
                            Our Sustainability Commitment
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                            Zero Greenwashing.{' '}
                            <span className="bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">
                                Total Transparency.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                            Every product on GreenChainz is backed by verified Environmental Product Declarations,
                            real-time carbon data, and transparent supply chain information.
                        </p>
                    </div>

                    {/* Video Section */}
                    <div className="max-w-4xl mx-auto">
                        <YouTubeEmbed
                            videoId="dQw4w9WgXcQ"
                            title="GreenChainz Sustainability Overview"
                        />
                        <p className="text-center text-gray-500 text-sm mt-4">
                            Watch: How GreenChainz is revolutionizing sustainable sourcing
                        </p>
                    </div>
                </div>
            </section>

            {/* Verification Process */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            How We Verify Sustainability
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Our rigorous 4-step verification process ensures every product meets the highest sustainability standards.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: FileCheck,
                                title: 'EPD Authentication',
                                description: 'Every Environmental Product Declaration is verified against official registries and third-party certifications.',
                                color: 'emerald'
                            },
                            {
                                icon: BarChart3,
                                title: 'Carbon Analysis',
                                description: 'Real-time carbon footprint calculations using ISO 14040/14044 lifecycle assessment standards.',
                                color: 'green'
                            },
                            {
                                icon: Shield,
                                title: 'Supply Chain Audit',
                                description: 'Suppliers undergo comprehensive audits verifying sustainable practices throughout their operations.',
                                color: 'blue'
                            },
                            {
                                icon: Recycle,
                                title: 'Continuous Monitoring',
                                description: 'Ongoing verification ensures data stays current and suppliers maintain their commitments.',
                                color: 'purple'
                            }
                        ].map((step, index) => (
                            <div key={index} className="relative">
                                <div className={`bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-2xl p-6 h-full hover:border-${step.color}-500/40 transition-colors`}>
                                    <div className={`w-12 h-12 rounded-xl bg-${step.color}-500/20 flex items-center justify-center mb-4`}>
                                        <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                                    </div>
                                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                                    <p className="text-gray-400 text-sm">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Standards We Support */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Industry-Leading Standards
                            </h2>
                            <p className="text-gray-400 mb-8">
                                GreenChainz supports and verifies products against the most rigorous sustainability certifications in the industry.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'ISO 14025 Type III Environmental Declarations',
                                    'EN 15804 European Construction Products',
                                    'LEED v4.1 Material Credits',
                                    'WELL Building Standard',
                                    'Living Building Challenge Red List',
                                    'Cradle to Cradle Certified™',
                                    'FSC® Chain of Custody',
                                    'EPD International (Environdec)'
                                ].map((standard, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-gray-300">{standard}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-green-500/20 to-green-400/20 rounded-2xl p-8 border border-green-500/20">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
                                        <div className="text-gray-400 text-sm">Verified EPDs</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-green-400 mb-2">150+</div>
                                        <div className="text-gray-400 text-sm">Certified Suppliers</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-blue-400 mb-2">12</div>
                                        <div className="text-gray-400 text-sm">Certification Bodies</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-purple-400 mb-2">99.2%</div>
                                        <div className="text-gray-400 text-sm">Data Accuracy</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Environmental Impact */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Our Collective Impact
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Together with our suppliers and buyers, we're making a measurable difference.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl p-8 border border-green-500/20 text-center">
                            <TreePine className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <div className="text-5xl font-bold text-white mb-2">2.4M</div>
                            <div className="text-green-400 font-medium mb-2">Tons CO₂ Avoided</div>
                            <p className="text-gray-400 text-sm">Through verified low-carbon product sourcing</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl p-8 border border-green-500/20 text-center">
                            <Globe className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <div className="text-5xl font-bold text-white mb-2">45</div>
                            <div className="text-green-400 font-medium mb-2">Countries</div>
                            <p className="text-gray-400 text-sm">Global network of sustainable suppliers</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl p-8 border border-blue-500/20 text-center">
                            <Recycle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <div className="text-5xl font-bold text-white mb-2">78%</div>
                            <div className="text-blue-400 font-medium mb-2">Avg. Recycled Content</div>
                            <p className="text-gray-400 text-sm">Across our verified product catalog</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Deep Dive Video Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Deep Dive: EPD Verification
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Learn how our technology verifies Environmental Product Declarations in real-time,
                                ensuring the data you see is always accurate and up-to-date.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Play className="w-5 h-5 text-emerald-400" />
                                    How EPD authentication works
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Play className="w-5 h-5 text-emerald-400" />
                                    Real-time data synchronization
                                </li>
                                <li className="flex items-center gap-3 text-gray-300">
                                    <Play className="w-5 h-5 text-emerald-400" />
                                    Blockchain verification layer
                                </li>
                            </ul>
                        </div>
                        <div>
                            <YouTubeEmbed
                                videoId="dQw4w9WgXcQ"
                                title="EPD Verification Deep Dive"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-green-600/20 to-green-500/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Start Sourcing Sustainably Today
                    </h2>
                    <p className="text-gray-300 mb-8 text-lg">
                        Join thousands of architects and procurement professionals who trust GreenChainz for verified sustainable materials.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition-all hover:scale-105"
                        >
                            Browse Products
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/20 hover:border-emerald-500 text-white font-semibold transition-all"
                        >
                            Become a Supplier
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
