"use client";

import Image from "next/image";

export default function PlatformPreviewSection() {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden" id="roadmap">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-400 text-sm font-medium mb-8 backdrop-blur-md shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
            Coming December 1, 2025
          </div>
          <h2 className="text-4xl md:text-6xl font-playfair font-bold text-white mb-6 leading-tight">
            The Platform <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400">
              Founding Members
            </span>{" "}
            Will Build
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            We're building the first <span className="text-slate-200 font-medium">verified green sourcing platform</span>. Secure your spot in the inner circle.
          </p>
        </div>

        {/* Mockup Container */}
        <div className="relative max-w-5xl mx-auto mb-32">
          {/* Glass Window Effect */}
          <div className="relative rounded-xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/10">
            {/* Window Controls */}
            <div className="h-14 border-b border-white/5 flex items-center px-6 gap-3 bg-slate-900/60">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
              </div>
              <div className="ml-6 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 text-xs text-slate-500 font-mono flex-1 text-center max-w-md mx-auto">
                app.greenchainz.com
              </div>
            </div>

            {/* Mockup Content */}
            <div className="aspect-[16/10] bg-slate-950/80 relative flex items-center justify-center p-8">
               <div className="w-full h-full flex flex-col gap-6 opacity-40 blur-[1px]">
                  {/* Header Skeleton */}
                  <div className="h-16 w-full bg-slate-900/50 rounded-lg flex items-center px-6 justify-between border border-slate-800/50">
                     <div className="w-32 h-6 bg-slate-800/50 rounded" />
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800/50" />
                        <div className="w-8 h-8 rounded-full bg-slate-800/50" />
                     </div>
                  </div>

                  <div className="flex gap-6 flex-1">
                     {/* Sidebar */}
                     <div className="w-64 bg-slate-900/50 rounded-lg border border-slate-800/50 p-4 hidden md:block">
                        <div className="w-3/4 h-4 bg-slate-800/50 rounded mb-6" />
                        <div className="space-y-3">
                           <div className="w-full h-8 bg-slate-800/30 rounded" />
                           <div className="w-full h-8 bg-slate-800/30 rounded" />
                           <div className="w-full h-8 bg-slate-800/30 rounded" />
                        </div>
                     </div>

                     {/* Main Content */}
                     <div className="flex-1 space-y-6">
                        {/* Search Bar */}
                        <div className="h-12 w-full bg-slate-900/50 rounded-lg border border-slate-800/50 flex items-center px-4">
                           <div className="w-4 h-4 rounded-full bg-slate-800/50 mr-4" />
                           <div className="w-64 h-4 bg-slate-800/30 rounded" />
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={i} className="bg-slate-900/50 rounded-lg border border-slate-800/50 p-4 space-y-3">
                                 <div className="w-full h-32 bg-slate-800/20 rounded mb-2" />
                                 <div className="w-3/4 h-4 bg-slate-800/50 rounded" />
                                 <div className="w-1/2 h-4 bg-slate-800/30 rounded" />
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Overlay Text */}
               <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-20">
                  <div className="p-8 rounded-2xl bg-black/60 border border-emerald-500/30 shadow-2xl backdrop-blur-xl max-w-lg w-full transform hover:scale-105 transition-transform duration-500">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-playfair font-bold text-white mb-3">Members Only</h3>
                    <p className="text-slate-300 mb-8 font-light">
                        The full platform is currently restricted to Founding Members. Join the cohort to get early access.
                    </p>
                    <a href="/architects" className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all shadow-[0_0_20px_-5px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_-5px_rgba(5,150,105,0.6)] w-full group">
                        Join the Waitlist
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </a>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="max-w-4xl mx-auto">
           <h3 className="text-3xl font-playfair font-bold text-white mb-16 text-center">Development Roadmap</h3>
           <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">

              {/* Phase 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-slate-950 text-emerald-500 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-900/50 backdrop-blur-md shadow-lg group-hover:border-emerald-500/40 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                       <span className="font-playfair font-bold text-xl text-emerald-400">Phase 1: Foundation</span>
                       <span className="px-2 py-1 rounded bg-emerald-500/10 text-xs font-mono text-emerald-400 border border-emerald-500/20">NOW</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">Building the verified data partnerships and exclusive architect network. Founding members are currently onboarding.</p>
                 </div>
              </div>

              {/* Phase 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-950 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-8 rounded-2xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                       <span className="font-playfair font-bold text-xl text-slate-300">Phase 2: MVP Launch</span>
                       <span className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-slate-500">DEC 1</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">Advanced search, sustainability filters, and RFQ features go live for verified members.</p>
                 </div>
              </div>

              {/* Phase 3 */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-950 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-8 rounded-2xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 transition-colors duration-300">
                    <div className="flex items-center justify-between mb-3">
                       <span className="font-playfair font-bold text-xl text-slate-300">Phase 3: Integration</span>
                       <span className="px-2 py-1 rounded bg-slate-800 text-xs font-mono text-slate-500">Q1 2026</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">Direct Revit API integration and automated carbon audits for enterprise accounts.</p>
                 </div>
              </div>

           </div>
        </div>

      </div>
    </section>
  );
}
