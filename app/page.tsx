import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/home/Hero'
import EmailSignup from '@/components/home/EmailSignup'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <Header />
      <Hero />
      
      {/* Problem/Solution/Roadmap sections */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-sky-500/30 transition-colors">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">The Problem</h3>
              <p className="text-slate-400">
                Greenwashing is rampant. Architects waste hours verifying claims and hunting for valid EPDs across fragmented sources.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-sky-500/30 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">The Solution</h3>
              <p className="text-slate-400">
                GreenChainz aggregates verified EPDs, certifications, and carbon data into a single, searchable marketplace.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-sky-500/30 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">The Roadmap</h3>
              <p className="text-slate-400">
                Q1 2026: Founding 50 Supplier Launch. Q2: Public Beta. Join now to shape the platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EmailSignup />
      <Footer />
    </div>
  )
}
