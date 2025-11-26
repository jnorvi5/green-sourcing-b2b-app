
import { Link } from 'react-router-dom';
import { Shield, BarChart3, Users, ArrowRight } from 'lucide-react';
import WhySection from '../components/LandingPage/WhySection';
import TrustBar from '../components/home/TrustBar';
import SEO from '../components/SEO';
import '../glassmorphism.css';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 bg-shapes">
            <SEO 
                title="GreenChainz - Verified Sustainable Sourcing" 
                description="The global trust layer for sustainable commerce. Connect verified suppliers with forward-thinking architects. Zero greenwashing. Total transparency."
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight fade-in">
                            De-risk Your{' '}
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                Sustainable Sourcing
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto slide-up">
                            Connect with verified suppliers, access authenticated EPDs, and track carbon footprints in real-time. 
                            Zero greenwashing. Total transparency.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/search"
                                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105"
                            >
                                Start Sourcing
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/dashboard/supplier"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-700 hover:border-emerald-500 text-gray-300 hover:text-white font-semibold text-lg transition-all hover:bg-gray-800/50"
                            >
                                Become a Supplier
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Bar */}
            <TrustBar />

            {/* Features Grid */}
            <section className="py-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Why Choose GreenChainz?
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Built for architects, engineers, and procurement professionals who demand transparency in sustainable building materials.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature Card 1 - Verified EPDs */}
                        <div className="glass-effect-dark rounded-2xl p-8 hover:shadow-emerald-500/20 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors">
                                <Shield className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Verified EPDs
                            </h3>
                            <p className="text-gray-400">
                                Every Environmental Product Declaration is authenticated and verified. No greenwashing, no guesswork—just reliable sustainability data you can trust.
                            </p>
                        </div>

                        {/* Feature Card 2 - Carbon Tracking */}
                        <div className="glass-effect-dark rounded-2xl p-8 hover:shadow-emerald-500/20 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center mb-6 group-hover:bg-teal-500/30 transition-colors">
                                <BarChart3 className="w-7 h-7 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Carbon Tracking
                            </h3>
                            <p className="text-gray-400">
                                Real-time carbon footprint analysis for every product. Compare embodied carbon across materials and make informed decisions for your projects.
                            </p>
                        </div>

                        {/* Feature Card 3 - Direct Supplier Connect */}
                        <div className="glass-effect-dark rounded-2xl p-8 hover:shadow-emerald-500/20 hover:shadow-lg transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                                <Users className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Direct Supplier Connect
                            </h3>
                            <p className="text-gray-400">
                                Connect directly with verified sustainable material suppliers. Streamline your procurement with RFQs, real-time quotes, and transparent communication.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Section */}
            <WhySection />
        </div>
    );
}
