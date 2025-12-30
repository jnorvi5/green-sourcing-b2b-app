"use client";

import Image from "next/image";

export default function PlatformPreviewSection() {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden" id="roadmap">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 text-sm font-medium mb-6">
            Coming December 1, 2025
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            The Platform{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Founding Members
            </span>{" "}
            Will Build
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            We're building the first verified green sourcing platform. Here is a sneak peek at what you will get access to.
          </p>
        </div>

        {/* Mockup Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glass Window Effect */}
          <div className="relative rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
            {/* Window Controls */}
            <div className="h-12 border-b border-slate-800/50 flex items-center px-4 gap-2 bg-slate-900/80">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              <div className="ml-4 px-3 py-1 rounded bg-slate-800/50 text-xs text-slate-500 font-mono flex-1 text-center">
                app.greenchainz.com
              </div>
            </div>

            {/* Mockup Content - Using a placeholder or SVG if no image exists yet, but framing it nicely */}
            <div className="aspect-[16/10] bg-slate-950 relative flex items-center justify-center p-8">
               {/* Replace this with actual screenshot when available. For now, a UI skeleton. */}
               <div className="w-full h-full flex flex-col gap-6">
                  {/* Header Skeleton */}
                  <div className="h-16 w-full bg-slate-900 rounded-lg flex items-center px-6 justify-between border border-slate-800">
                     <div className="w-32 h-6 bg-slate-800 rounded animate-pulse" />
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                        <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                     </div>
                  </div>

                  <div className="flex gap-6 flex-1">
                     {/* Sidebar */}
                     <div className="w-64 bg-slate-900 rounded-lg border border-slate-800 p-4 hidden md:block">
                        <div className="w-3/4 h-4 bg-slate-800 rounded mb-6 animate-pulse" />
                        <div className="space-y-3">
                           <div className="w-full h-8 bg-slate-800/50 rounded animate-pulse" />
                           <div className="w-full h-8 bg-slate-800/50 rounded animate-pulse" />
                           <div className="w-full h-8 bg-slate-800/50 rounded animate-pulse" />
                        </div>
                     </div>

                     {/* Main Content */}
                     <div className="flex-1 space-y-6">
                        {/* Search Bar */}
                        <div className="h-12 w-full bg-slate-900 rounded-lg border border-slate-800 flex items-center px-4">
                           <div className="w-4 h-4 rounded-full bg-slate-800 mr-4" />
                           <div className="w-64 h-4 bg-slate-800/50 rounded animate-pulse" />
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={i} className="bg-slate-900 rounded-lg border border-slate-800 p-4 space-y-3">
                                 <div className="w-full h-32 bg-slate-800/30 rounded mb-2 animate-pulse" />
                                 <div className="w-3/4 h-4 bg-slate-800 rounded animate-pulse" />
                                 <div className="w-1/2 h-4 bg-slate-800/50 rounded animate-pulse" />
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Overlay Text */}
               <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Under Construction</h3>
                  <p className="text-slate-300 max-w-md mb-8">
                     Founding members get early access to shape the platform.
                  </p>
                  <a href="/architect" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors">
                     Join the Waitlist
                  </a>
               </div>
            </div>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="mt-24 max-w-4xl mx-auto">
           <h3 className="text-2xl font-bold text-white mb-12 text-center">Development Roadmap</h3>
           <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-emerald-500/20 before:to-transparent">

              {/* Phase 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-emerald-500 bg-slate-900 text-emerald-500 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <span className="relative flex h-3 w-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-emerald-500/30 bg-emerald-900/10 backdrop-blur-sm shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-emerald-400">Phase 1: Foundation</span>
                       <span className="text-xs font-mono text-emerald-500/70">NOW</span>
                    </div>
                    <p className="text-slate-300 text-sm">Building the data partnerships and architect network. Founding members join.</p>
                 </div>
              </div>

              {/* Phase 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-slate-300">Phase 2: MVP Launch</span>
                       <span className="text-xs font-mono text-slate-500">DEC 1</span>
                    </div>
                    <p className="text-slate-400 text-sm">Search, filter, and RFQ features go live for verified members.</p>
                 </div>
              </div>

              {/* Phase 3 */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                 </div>
                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-bold text-slate-300">Phase 3: Integration</span>
                       <span className="text-xs font-mono text-slate-500">Q1 2026</span>
                    </div>
                    <p className="text-slate-400 text-sm">Revit API integration and automated carbon audits.</p>
                 </div>
              </div>

           </div>
        </div>

      </div>
    </section>
  );
}
