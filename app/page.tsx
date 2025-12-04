import JoinForm from '../components/JoinForm';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Subtle background pattern/grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center font-bold text-black">
              GC
            </div>
            <span className="text-xl font-semibold">GREENCHAINZ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/data-licensing" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-gray-300">
              Data Licensing
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-teal-400 text-sm mb-8">
            🌿 Founding 50 Program
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            The Trusted Data Layer for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              Sustainable Sourcing
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            GreenChainz connects architects and contractors with verified green suppliers, 
            backed by standardized EPD data and certification transparency.
          </p>

          {/* JoinForm Component */}
          <JoinForm />
          
          <p className="text-sm text-gray-500 mt-4">
            Join the first 50 verified suppliers shaping the future of sustainable procurement.
          </p>
        </div>

        {/* Features Grid - Glassmorphism Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Verified Visibility</h3>
            <p className="text-gray-400 text-sm">
              Get discovered by architects and procurement teams searching for verified sustainable materials.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Standardized EPD Data</h3>
            <p className="text-gray-400 text-sm">
              Your Environmental Product Declarations presented in a unified, comparable format buyers trust.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Direct RFQ Pipeline</h3>
            <p className="text-gray-400 text-sm">
              Receive qualified leads directly from architects specifying materials for real projects.
            </p>
          </div>
        </div>

        {/* Partnership Section - Glass Card */}
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-medium uppercase tracking-wider">
                Strategic Partnership Concept
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-medium">
                EPD Ecosystem Infrastructure
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              EPD data → market access → impact intelligence → back to EPD registration
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              GreenChainz × <span className="text-teal-400">EPD International</span>
            </h2>
            
            <p className="text-gray-400 mb-6 max-w-2xl">
              Accelerating global EPD adoption together with infrastructure built for both manufacturers and specifiers. 
              We&apos;re building the infrastructure to make Environmental Product Declarations the universal standard for 
              sustainable materials procurement.
            </p>
            
            <Link href="/data-licensing" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-black font-semibold rounded-lg transition-all">
              Explore Partnership Vision
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-20 pb-8">
          <p>Building Infrastructure for the EPD Ecosystem</p>
          <p className="mt-2">© 2025 GreenChainz. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
