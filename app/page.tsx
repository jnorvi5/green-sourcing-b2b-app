import JoinForm from '../components/JoinForm';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Subtle background pattern */}
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
            <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">
              Login
            </Link>
            <Link href="/signup" className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition text-sm">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-teal-400 text-sm mb-8">
            🚀 Launching Q1 2026 • Join the Founding 50
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Verified Sustainable Materials,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              One Marketplace
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            GreenChainz connects architects with certified green building material suppliers. 
            Real-time EPD verification, blockchain-backed certifications, instant RFQs.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup?role=supplier" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-lg transition-all text-lg">
              I'm a Supplier →
            </Link>
            <Link href="/signup?role=architect" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-lg transition-all text-lg">
              I'm an Architect →
            </Link>
          </div>

          {/* Join Form */}
          <div className="mt-12">
            <JoinForm />
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            <strong className="text-teal-400">50 suppliers</strong> • <strong className="text-teal-400">200 architects</strong> pre-qualified for Q1 2026 beta
          </p>
        </div>

        {/* Social Proof */}
        <div className="max-w-5xl mx-auto mb-16">
          <p className="text-center text-gray-500 text-sm mb-6 uppercase tracking-wider">Trusted Data Partners</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <div className="text-gray-400 font-semibold">Building Transparency (EC3)</div>
            <div className="text-gray-400 font-semibold">EPD International</div>
            <div className="text-gray-400 font-semibold">Autodesk</div>
            <div className="text-gray-400 font-semibold">FSC</div>
          </div>
        </div>

        {/* Problem/Solution */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problem */}
            <div>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-red-400">The Problem</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Architects can't find verified green suppliers</li>
                <li>• EPD data trapped in PDFs, not searchable</li>
                <li>• No trust layer for certifications</li>
                <li>• Small suppliers excluded from major projects</li>
                <li>• Manual procurement = weeks of research</li>
              </ul>
            </div>

            {/* Solution */}
            <div>
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-teal-400">GreenChainz Solution</h3>
              <ul className="space-y-2 text-gray-400">
                <li>✅ Real-time EPD verification via EC3 API</li>
                <li>✅ Blockchain-backed certification audit trail</li>
                <li>✅ Instant RFQ matching (supplier ↔ architect)</li>
                <li>✅ Searchable carbon footprint data</li>
                <li>✅ 10-minute sourcing vs. 2-week research</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">For Architects</h3>
            <p className="text-gray-400 text-sm">
              Search 50+ verified suppliers by carbon footprint, certifications, and location. Get RFQs in 10 minutes.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">For Suppliers</h3>
            <p className="text-gray-400 text-sm">
              Get discovered by 200+ architects. Display EPDs, FSC, B Corp certs. Receive qualified RFQs automatically.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 group-hover:bg-teal-500/20 transition-all">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Verified Trust Layer</h3>
            <p className="text-gray-400 text-sm">
              Blockchain-backed certification audit trail. No fake EPDs. Real-time carbon data from Autodesk API.
            </p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Supplier Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Bronze */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Bronze</div>
              <div className="text-3xl font-bold mb-4">$99<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ Basic product listing</li>
                <li>✓ Priority search placement</li>
                <li>✓ 1 certification verification</li>
                <li>✓ RFQ notifications</li>
              </ul>
              <Link href="/signup?role=supplier&tier=bronze" className="block text-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                Start Free Trial
              </Link>
            </div>

            {/* Silver */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-2 border-teal-500/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal-500 text-black text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm text-teal-400 uppercase tracking-wider mb-2">Silver</div>
              <div className="text-3xl font-bold mb-4">$249<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li>✓ Everything in Bronze</li>
                <li>✓ 3 certifications + EPD data</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Export reports</li>
              </ul>
              <Link href="/signup?role=supplier&tier=silver" className="block text-center px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition">
                Start Free Trial
              </Link>
            </div>

            {/* Gold */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-2">Gold</div>
              <div className="text-3xl font-bold mb-4">$499<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ Everything in Silver</li>
                <li>✓ Unlimited certifications</li>
                <li>✓ API access</li>
                <li>✓ Dedicated account manager</li>
              </ul>
              <Link href="/signup?role=supplier&tier=gold" className="block text-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10">
            <h3 className="text-2xl font-bold mb-6 text-center">The $1 Trillion Opportunity</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-teal-400">$471B</div>
                <div className="text-sm text-gray-400">Market Size (2024)</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-400">12.4%</div>
                <div className="text-sm text-gray-400">CAGR</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-400">$1T</div>
                <div className="text-sm text-gray-400">By 2037</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-400">Q1 2026</div>
                <div className="text-sm text-gray-400">Launch</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-20 pb-8">
          <p>GreenChainz • The B2B Marketplace for Verified Sustainable Materials</p>
          <p className="mt-2">© 2025 GreenChainz. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
