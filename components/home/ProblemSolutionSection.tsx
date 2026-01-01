'use client';

export default function ProblemSolutionSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-900/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">
            The Cost of Chaos vs. <span className="text-gradient-emerald">The Clarity of Control</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
            Why settle for outdated spreadsheets when you can have precision at your fingertips?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          {/* The Problem - Darker, Grittier */}
          <div className="p-8 md:p-10 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-sm hover:bg-slate-900/60 transition-colors duration-500 group">
            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
              <span className="text-2xl text-red-400">✕</span>
            </div>
            <h3 className="text-3xl font-serif text-slate-200 mb-6 group-hover:text-white transition-colors">
              The Old Way
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                <span><strong className="text-slate-300 block mb-1">2 Weeks Wasted</strong> Hunting down suppliers through endless emails and calls.</span>
              </li>
              <li className="flex items-start gap-4 text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                <span><strong className="text-slate-300 block mb-1">Data Trapped in PDFs</strong> Critical sustainability metrics buried in non-searchable documents.</span>
              </li>
              <li className="flex items-start gap-4 text-slate-400 group-hover:text-slate-300 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5" />
                <span><strong className="text-slate-300 block mb-1">Unverified Claims</strong> Risking your reputation on greenwashing you can&apos;t easily check.</span>
              </li>
            </ul>
          </div>

          {/* GreenChainz Solution - Sleek, Glowing, Premium */}
          <div className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-slate-900/40 border border-emerald-500/30 backdrop-blur-sm group hover:border-emerald-500/50 transition-all duration-500 shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)]">
            <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 border border-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                <span className="text-2xl text-emerald-400">⚡</span>
              </div>
              <h3 className="text-3xl font-serif text-white mb-6">
                The GreenChainz Standard
              </h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4 text-emerald-100/80 group-hover:text-emerald-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs">✓</span>
                  </div>
                  <span><strong className="text-emerald-400 block mb-1 font-serif text-lg">Instant Verification</strong> Source verified materials in minutes, not weeks.</span>
                </li>
                <li className="flex items-start gap-4 text-emerald-100/80 group-hover:text-emerald-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs">✓</span>
                  </div>
                  <span><strong className="text-emerald-400 block mb-1 font-serif text-lg">Transparent Impact</strong> Compare Real-time carbon footprints side-by-side.</span>
                </li>
                <li className="flex items-start gap-4 text-emerald-100/80 group-hover:text-emerald-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs">✓</span>
                  </div>
                  <span><strong className="text-emerald-400 block mb-1 font-serif text-lg">Direct Access</strong> Connect instantly with suppliers who have the data you need.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
