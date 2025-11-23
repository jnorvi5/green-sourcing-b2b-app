import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import WhySection from '../components/LandingPage/WhySection';
import Footer from '../components/Footer';
import Hero from '../components/home/Hero';
import TrustBar from '../components/home/TrustBar';
import SEO from '../components/SEO';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <SEO 
                title="GreenChainz - Verified Sustainable Sourcing" 
                description="The global trust layer for sustainable commerce. Connect verified suppliers with forward-thinking architects. Zero greenwashing. Total transparency."
            />
            {/* Premium Header */}
            <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Logo height={40} showText={true} />
                        <nav className="hidden md:flex items-center gap-8">
                            <Link to="/features" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">Features</Link>
                            <Link to="/survey/architect" className="text-slate-300 hover:text-emerald-400 transition-colors font-medium">Free Assessment</Link>
                            <a href="mailto:careers@greenchainz.com" className="text-slate-300 hover:text-purple-400 transition-colors font-medium">Careers</a>
                            <Link to="/login" className="text-slate-300 hover:text-white transition-colors font-medium">Sign In</Link>
                            <Link
                                to="/signup"
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
                            >
                                👑 Join as Founder
                            </Link>
                        </nav>
                        {/* Mobile menu button */}
                        <button className="md:hidden text-slate-300 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Banner */}
            <Hero />
            <TrustBar />

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-cyan-500/10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-500/40 text-amber-400 text-base font-bold mb-8 shadow-lg shadow-amber-500/20">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                            </span>
                            <span className="text-lg">👑</span>
                            <span>FOUNDING MEMBERS ONLY - Limited to 175 Spots</span>
                            <span className="text-lg">👑</span>
                        </div>

                        <h2 className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                            Stop Greenwashing.{' '}
                            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                                Start Building Sustainably.
                            </span>
                        </h2>

                        <div className="mb-8 max-w-3xl mx-auto">
                            <div className="inline-block px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border-2 border-emerald-500/30 backdrop-blur-sm">
                                <p className="text-2xl lg:text-3xl font-bold text-white mb-2">
                                    <span className="text-emerald-400">GreenChainz:</span> Where Profit and Sustainability
                                </p>
                                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                    Are on the Same Side
                                </p>
                            </div>
                        </div>

                        <p className="text-xl text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed">
                            The global trust layer for sustainable commerce. 
                            We connect <span className="text-white font-semibold">verified green suppliers</span> with forward-thinking architects and builders who refuse to compromise—on quality OR sustainability.
                        </p>

                        <div className="mb-8 max-w-3xl mx-auto">
                            <div className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border-2 border-blue-500/30 backdrop-blur-sm">
                                <p className="text-xl lg:text-2xl font-bold text-white">
                                    <span className="text-blue-400">We Authenticate and Verify</span>
                                </p>
                                <p className="text-xl lg:text-2xl font-bold text-slate-300">
                                    So You Can Focus on the <span className="text-emerald-400">Build</span> and the <span className="text-purple-400">Design</span>
                                </p>
                            </div>
                        </div>
                        
                        <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
                            <span className="text-emerald-400">✓</span> Zero greenwashing 
                            <span className="mx-3">•</span> 
                            <span className="text-emerald-400">✓</span> Blockchain-verified certifications 
                            <span className="mx-3">•</span> 
                            <span className="text-emerald-400">✓</span> Real cost savings
                        </p>

                        <div className="mb-12">
                            <p className="text-2xl font-bold text-white">
                                Let GreenChainz Help You Make <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">CENTS</span> of It All
                            </p>
                            <p className="text-sm text-slate-400 mt-2">(Both kinds 💰💡)</p>
                        </div>

                        {/* Powerful Mission-Driven CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                            <Link
                                to="/signup"
                                className="group relative px-10 py-5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white font-bold text-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 w-full sm:w-auto overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                                <span className="relative flex items-center gap-3 justify-center">
                                    <span className="text-2xl">🌍</span>
                                    Start Building Green Today
                                    <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                                <div className="text-xs mt-1 opacity-90">Join 500+ sustainable builders</div>
                            </Link>

                            <Link
                                to="/survey/architect"
                                className="group px-10 py-5 rounded-xl border-2 border-emerald-500/60 bg-emerald-500/5 text-emerald-400 font-bold text-xl hover:bg-emerald-500/10 hover:border-emerald-400 transition-all duration-300 hover:scale-105 w-full sm:w-auto backdrop-blur-sm"
                            >
                                <span className="flex items-center gap-3 justify-center">
                                    <span className="text-2xl">📊</span>
                                    See Your Impact Score
                                    <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </span>
                                <div className="text-xs mt-1 opacity-75">Free sustainability assessment</div>
                            </Link>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm flex-wrap">
                            <a
                                href="mailto:partnerships@greenchainz.com"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400 transition-colors font-medium"
                            >
                                <span className="text-lg">🤝</span>
                                <span>Supplier? Join Our Network</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                            <a
                                href="mailto:careers@greenchainz.com"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 transition-colors font-medium"
                            >
                                <span className="text-lg">💼</span>
                                <span>We're Hiring! Join Our Team</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                            <a
                                href="mailto:partnerships@greenchainz.com"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:border-teal-400 transition-colors font-medium"
                            >
                                <span className="text-lg">📡</span>
                                <span>Data Provider Partners</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOUNDING MEMBERS ROYAL TREATMENT SECTION */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold mb-6">
                            <span className="text-xl">👑</span>
                            EXCLUSIVE FOUNDER'S CIRCLE
                            <span className="text-xl">👑</span>
                        </div>
                        <h3 className="text-5xl lg:text-6xl font-extrabold text-white mb-6">
                            Join as a <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">Founding Member</span>
                        </h3>
                        <p className="text-2xl text-amber-400 font-bold mb-4">
                            Treated Like ROYALTY For Life 👑
                        </p>
                        <div className="mb-6 max-w-3xl mx-auto space-y-3">
                            <p className="text-xl text-emerald-400 font-bold italic">
                                "GreenChainz: Where profit meets purpose"
                            </p>
                            <p className="text-lg text-amber-400 font-semibold">
                                Making green profitable and sustainable
                            </p>
                        </div>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            The first 175 members get <span className="text-amber-400 font-bold">LIFETIME benefits</span> that will NEVER be available again. 
                            This is your once-in-a-lifetime chance to lock in the best deal in sustainable sourcing history—
                            <span className="text-white font-bold"> build smarter, greener, and more profitable with GreenChainz</span>.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        {/* Benefit 1 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-amber-500/30 rounded-2xl p-8 hover:border-amber-400 transition-all">
                                <div className="text-5xl mb-4">💎</div>
                                <h4 className="text-2xl font-bold text-white mb-3">Lifetime Fee Lock</h4>
                                <p className="text-slate-300 mb-4">
                                    <span className="text-amber-400 font-bold">$0 forever.</span> No monthly fees. No transaction fees. No hidden costs. Ever.
                                </p>
                                <div className="text-sm text-emerald-400/90 italic mb-2">💰 "GreenChainz helps you make cents of sustainability"</div>
                                <div className="text-sm text-amber-400/80">Regular members: $499/month</div>
                            </div>
                        </div>

                        {/* Benefit 2 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-emerald-500/30 rounded-2xl p-8 hover:border-emerald-400 transition-all">
                                <div className="text-5xl mb-4">🎯</div>
                                <h4 className="text-2xl font-bold text-white mb-3">Priority Everything</h4>
                                <p className="text-slate-300 mb-4">
                                    <span className="text-emerald-400 font-bold">VIP treatment forever:</span> First access to new suppliers, instant verification, dedicated support, exclusive events.
                                </p>
                                <div className="text-sm text-emerald-400/90 italic mb-2">🌱 "Build smarter, greener, and more profitable"</div>
                                <div className="text-sm text-emerald-400/80">Worth $10,000+/year</div>
                            </div>
                        </div>

                        {/* Benefit 3 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-8 hover:border-purple-400 transition-all">
                                <div className="text-5xl mb-4">🏆</div>
                                <h4 className="text-2xl font-bold text-white mb-3">Equity & Revenue Share</h4>
                                <p className="text-slate-300 mb-4">
                                    <span className="text-purple-400 font-bold">Own part of GreenChainz.</span> Founding members get equity options + revenue sharing as the platform grows.
                                </p>
                                <div className="text-sm text-emerald-400/90 italic mb-2">📈 "Making green profitable and sustainable"</div>
                                <div className="text-sm text-purple-400/80">Potential 7-figure value</div>
                            </div>
                        </div>
                    </div>

                    {/* Urgency Counter */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-r from-red-900/40 via-orange-900/40 to-red-900/40 border-2 border-red-500/50 rounded-2xl p-8 text-center backdrop-blur-sm">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <span className="text-3xl animate-pulse">⚡</span>
                                <h4 className="text-3xl font-bold text-white">ONLY 175 SPOTS AVAILABLE</h4>
                                <span className="text-3xl animate-pulse">⚡</span>
                            </div>
                            <p className="text-xl text-red-400 font-bold mb-6">
                                Once we hit 175 founding members, this offer DISAPPEARS FOREVER
                            </p>
                            <div className="flex items-center justify-center gap-8 mb-6">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-emerald-400">143</div>
                                    <div className="text-sm text-slate-400">Spots Claimed</div>
                                </div>
                                <div className="text-6xl text-slate-600">→</div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-red-400">32</div>
                                    <div className="text-sm text-slate-400">Spots Left</div>
                                </div>
                            </div>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-3 px-12 py-6 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white font-black text-2xl shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-105 animate-pulse"
                            >
                                <span className="text-3xl">🔥</span>
                                CLAIM YOUR FOUNDING MEMBER SPOT NOW
                                <span className="text-3xl">🔥</span>
                            </Link>
                            <p className="text-sm text-slate-400 mt-4">
                                No credit card required • Cancel anytime • 30-day money-back guarantee
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONFIDENCE & TRUST SECTION */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center">
                        <div className="inline-block px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-2 border-indigo-500/30 backdrop-blur-sm shadow-2xl shadow-indigo-500/20">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <span className="text-4xl">✓</span>
                                <h3 className="text-3xl lg:text-4xl font-extrabold text-white">
                                    Verified and Authenticated
                                </h3>
                                <span className="text-4xl">✓</span>
                            </div>
                            <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                                Build and Design with Confidence
                            </p>
                            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                                Every supplier checked. Every certification verified. Every material traceable.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* VIDEO SHOWCASE SECTION */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold mb-6">
                            <span className="text-xl">🎥</span>
                            SEE IT IN ACTION
                        </div>
                        <h3 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
                            Watch How <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">GreenChainz Works</span>
                        </h3>
                        <p className="text-2xl font-bold text-emerald-400 mb-4">
                            Let Us Help You Make CENTS of It All 💰💡
                        </p>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            See real builders transforming their supply chains with verified sustainable materials—and saving money while doing it
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Main Demo Video */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-emerald-500/30 rounded-2xl overflow-hidden hover:border-emerald-400 transition-all">
                                <div className="aspect-video bg-slate-800 flex items-center justify-center relative group cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-teal-900/50" />
                                    <div className="relative z-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/50">
                                            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                        <p className="text-white font-bold text-lg">Platform Demo</p>
                                        <p className="text-slate-300 text-sm">3:45 minutes</p>
                                    </div>
                                    {/* Placeholder for actual video */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                        <span className="text-emerald-400 font-bold">Click to watch</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="text-xl font-bold text-white mb-2">🎯 Complete Platform Walkthrough</h4>
                                    <p className="text-slate-300 text-sm">
                                        See how GreenChainz verifies suppliers, connects you with certified materials, and ensures zero greenwashing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Success Story Video */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                            <div className="relative bg-slate-900/80 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl overflow-hidden hover:border-purple-400 transition-all">
                                <div className="aspect-video bg-slate-800 flex items-center justify-center relative group cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50" />
                                    <div className="relative z-10 text-center">
                                        <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                                            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                        <p className="text-white font-bold text-lg">Founder Success Story</p>
                                        <p className="text-slate-300 text-sm">5:20 minutes</p>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                        <span className="text-purple-400 font-bold">Click to watch</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="text-xl font-bold text-white mb-2">🏆 Real Founding Member Results</h4>
                                    <p className="text-slate-300 text-sm">
                                        Hear from early adopters who saved 40% on sustainable materials while increasing their ESG scores.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Video Links */}
                    <div className="grid md:grid-cols-4 gap-4">
                        <a href="#" className="group p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">Quick Start Guide</p>
                                    <p className="text-slate-400 text-xs">2 min</p>
                                </div>
                            </div>
                        </a>

                        <a href="#" className="group p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-amber-500/50 hover:bg-slate-800/50 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">Founder Benefits</p>
                                    <p className="text-slate-400 text-xs">4 min</p>
                                </div>
                            </div>
                        </a>

                        <a href="#" className="group p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-teal-500/50 hover:bg-slate-800/50 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">Verification Process</p>
                                    <p className="text-slate-400 text-xs">6 min</p>
                                </div>
                            </div>
                        </a>

                        <a href="#" className="group p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">Behind The Scenes</p>
                                    <p className="text-slate-400 text-xs">8 min</p>
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* CTA Below Videos */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-400 mb-6">
                            Ready to make <span className="text-emerald-400 font-bold">CENTS</span> of sustainable sourcing?
                        </p>
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105"
                        >
                            <span className="text-2xl">🚀</span>
                            Start Saving Money & The Planet
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            <WhySection />

            {/* Final CTA - Last Chance */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                    <div className="inline-block px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold mb-6">
                        👑 Last Chance for Founding Member Benefits 👑
                    </div>
                    <h3 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
                        Don't Miss The <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">Best Deal Ever</span>
                    </h3>
                    <div className="mb-8 space-y-3">
                        <p className="text-3xl font-bold text-emerald-400">
                            GreenChainz Helps You Make Cents of Sustainability 💰
                        </p>
                        <p className="text-2xl font-semibold text-indigo-400">
                            Verified and Authenticated — Build and Design with Confidence
                        </p>
                    </div>
                    <p className="text-2xl text-slate-300 mb-4 font-semibold">
                        Join the sustainable building revolution as a FOUNDING MEMBER
                    </p>
                    <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
                        Lock in <span className="text-emerald-400 font-bold">lifetime zero fees</span>, 
                        get <span className="text-purple-400 font-bold">equity in GreenChainz</span>, 
                        and enjoy <span className="text-amber-400 font-bold">VIP treatment forever</span>. 
                        <span className="text-white font-bold"> Build smarter, greener, and more profitable with GreenChainz</span>. 
                        This offer will NEVER come back.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link
                            to="/signup"
                            className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-white font-black text-2xl shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300 hover:scale-105 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 opacity-0 group-hover:opacity-30 transition-opacity" />
                            <span className="relative flex items-center gap-3">
                                <span className="text-3xl">👑</span>
                                BECOME A FOUNDING MEMBER
                                <span className="text-3xl">👑</span>
                            </span>
                        </Link>
                    </div>
                    <div className="mt-8 text-slate-500 text-sm">
                        ⚡ Instant access • 💎 Lifetime benefits • 🏆 No better deal ever
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}