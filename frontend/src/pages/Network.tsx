// frontend/src/pages/Network.tsx
import { Link } from 'react-router-dom';
import {
    Users,
    Globe,
    MessageSquare,
    Handshake,
    TrendingUp,
    MapPin,
    Building2,
    Star,
    ArrowRight,
    Search,
    Filter,
    CheckCircle,
    Play
} from 'lucide-react';
import SEO from '../components/SEO';

// YouTube Embed Component
function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
    return (
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
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

// Sample supplier data
const FEATURED_SUPPLIERS = [
    {
        id: '1',
        name: 'EcoTimber Solutions',
        category: 'FSC Certified Wood',
        location: 'Portland, OR',
        rating: 4.9,
        verified: true,
        products: 45,
        image: 'bg-gradient-to-br from-amber-500 to-orange-600'
    },
    {
        id: '2',
        name: 'GreenSteel Industries',
        category: 'Recycled Steel',
        location: 'Pittsburgh, PA',
        rating: 4.8,
        verified: true,
        products: 32,
        image: 'bg-gradient-to-br from-slate-500 to-gray-600'
    },
    {
        id: '3',
        name: 'BioComposite Corp',
        category: 'Bio-based Materials',
        location: 'Austin, TX',
        rating: 4.7,
        verified: true,
        products: 28,
        image: 'bg-gradient-to-br from-green-500 to-green-400'
    },
    {
        id: '4',
        name: 'ClearView Glass',
        category: 'Low-E Glass',
        location: 'Phoenix, AZ',
        rating: 4.9,
        verified: true,
        products: 18,
        image: 'bg-gradient-to-br from-sky-500 to-blue-600'
    }
];

export default function Network() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
            <SEO
                title="Supplier Network | GreenChainz"
                description="Explore our global network of verified sustainable material suppliers. Connect with leading manufacturers committed to environmental excellence."
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                            <Users className="w-4 h-4" />
                            The GreenChainz Network
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                            Connect with{' '}
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Verified Suppliers
                            </span>{' '}
                            Worldwide
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                            Our curated network of sustainable material suppliers spans 45 countries,
                            each verified through our rigorous authentication process.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/search"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:scale-105"
                            >
                                <Search className="w-5 h-5" />
                                Browse Suppliers
                            </Link>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-700 hover:border-blue-500 text-gray-300 hover:text-white font-semibold transition-all"
                            >
                                <Handshake className="w-5 h-5" />
                                Join as Supplier
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Network Stats */}
            <section className="py-12 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-blue-400 mb-1">500+</div>
                            <div className="text-gray-400 text-sm">Verified Suppliers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-1">45</div>
                            <div className="text-gray-400 text-sm">Countries</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-amber-400 mb-1">12K+</div>
                            <div className="text-gray-400 text-sm">Products Listed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-purple-400 mb-1">$50M+</div>
                            <div className="text-gray-400 text-sm">Transaction Volume</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Video */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                How the Network Works
                            </h2>
                            <p className="text-gray-400 mb-6">
                                See how buyers and suppliers connect, communicate, and transact on GreenChainz.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-400 font-bold text-sm">1</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Search & Filter</h3>
                                        <p className="text-gray-400 text-sm">Find suppliers by material type, certification, location, and sustainability metrics.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-400 font-bold text-sm">2</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Verify & Compare</h3>
                                        <p className="text-gray-400 text-sm">Access verified EPDs, carbon data, and supplier ratings all in one place.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-400 font-bold text-sm">3</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Request Quote</h3>
                                        <p className="text-gray-400 text-sm">Send RFQs directly to multiple suppliers and receive competitive quotes.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <span className="text-blue-400 font-bold text-sm">4</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Connect & Order</h3>
                                        <p className="text-gray-400 text-sm">Communicate directly with suppliers and complete transactions securely.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <YouTubeEmbed
                                videoId="dQw4w9WgXcQ"
                                title="How GreenChainz Network Works"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Suppliers */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                Featured Suppliers
                            </h2>
                            <p className="text-gray-400">
                                Top-rated verified suppliers from our network
                            </p>
                        </div>
                        <Link
                            to="/search"
                            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                        >
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {FEATURED_SUPPLIERS.map((supplier) => (
                            <Link
                                key={supplier.id}
                                to={`/supplier/${supplier.id}`}
                                className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all hover:scale-105"
                            >
                                <div className={`w-16 h-16 rounded-xl ${supplier.image} mb-4`} />
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-white">{supplier.name}</h3>
                                    {supplier.verified && (
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    )}
                                </div>
                                <p className="text-blue-400 text-sm mb-2">{supplier.category}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {supplier.location}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                                    <span className="flex items-center gap-1 text-amber-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        {supplier.rating}
                                    </span>
                                    <span className="text-gray-400 text-sm">{supplier.products} products</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-8 text-center md:hidden">
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
                        >
                            View All Suppliers
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Browse by Category
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Find suppliers specializing in specific sustainable material categories.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { name: 'Wood & Timber', count: 124, icon: '🪵' },
                            { name: 'Steel & Metal', count: 89, icon: '🔩' },
                            { name: 'Concrete', count: 67, icon: '🧱' },
                            { name: 'Glass', count: 45, icon: '🪟' },
                            { name: 'Insulation', count: 78, icon: '🏠' },
                            { name: 'Flooring', count: 56, icon: '🪨' },
                            { name: 'Roofing', count: 34, icon: '🏘️' },
                            { name: 'Paints & Coatings', count: 42, icon: '🎨' },
                            { name: 'Plastics & Composites', count: 38, icon: '♻️' },
                            { name: 'Adhesives', count: 29, icon: '🧪' },
                            { name: 'Textiles', count: 31, icon: '🧵' },
                            { name: 'All Categories', count: 500, icon: '📦' }
                        ].map((category, index) => (
                            <Link
                                key={index}
                                to={`/search?category=${encodeURIComponent(category.name)}`}
                                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all text-center"
                            >
                                <div className="text-3xl mb-2">{category.icon}</div>
                                <div className="text-white font-medium text-sm mb-1">{category.name}</div>
                                <div className="text-gray-500 text-xs">{category.count} suppliers</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Map Section */}
            <section className="py-20 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <Globe className="w-12 h-12 text-blue-400 mb-6" />
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                A Truly Global Network
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Our supplier network spans 6 continents and 45 countries, ensuring you can find
                                sustainable materials wherever your projects are located.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <div className="text-2xl font-bold text-blue-400 mb-1">North America</div>
                                    <div className="text-gray-400 text-sm">215 suppliers</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <div className="text-2xl font-bold text-emerald-400 mb-1">Europe</div>
                                    <div className="text-gray-400 text-sm">178 suppliers</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <div className="text-2xl font-bold text-amber-400 mb-1">Asia Pacific</div>
                                    <div className="text-gray-400 text-sm">89 suppliers</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <div className="text-2xl font-bold text-purple-400 mb-1">Other Regions</div>
                                    <div className="text-gray-400 text-sm">45 suppliers</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 border border-blue-500/20 flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <Globe className="w-32 h-32 text-blue-400/50 mx-auto mb-4" />
                                <p className="text-gray-400">Interactive map coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Become a Supplier CTA */}
            <section className="py-20 bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Building2 className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Are You a Sustainable Material Supplier?
                    </h2>
                    <p className="text-gray-300 mb-8 text-lg">
                        Join our network and connect with thousands of architects, engineers, and procurement professionals
                        actively seeking verified sustainable materials.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:scale-105"
                        >
                            Join the Network
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/features"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/20 hover:border-blue-500 text-white font-semibold transition-all"
                        >
                            Learn More
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
