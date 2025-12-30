"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, Database, ShieldCheck } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 lg:pt-48 lg:pb-32">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute w-[1000px] h-[1000px] -top-[400px] -left-[200px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Content */}
        <div className="text-center max-w-5xl mx-auto">
          {/* Trust Badge / Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Building the Future of Green Construction
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            The Future of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Verified Green Sourcing
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Stop digging through PDFs. Start sourcing verified sustainable materials with confidence.
            <span className="block mt-4 text-emerald-400/90 font-medium">
              Join the founding cohort today.
            </span>
          </p>

          {/* Segmented CTAs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-20">
            {/* Data Provider CTA */}
            <Link
              href="/data-providers"
              className="group relative p-6 bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center">
                <Database className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-1">I'm a Data Provider</h3>
                <span className="text-sm text-slate-400 group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                  Integrate your data <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* Architect CTA - Featured */}
            <Link
              href="/architect"
              className="group relative p-6 bg-gradient-to-br from-emerald-900/40 to-slate-900/40 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.2)] hover:-translate-y-1 scale-105 z-10"
            >
              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center">
                <Building2 className="w-10 h-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-white mb-1">I'm an Architect</h3>
                <span className="text-sm text-emerald-300 group-hover:text-white transition-colors flex items-center gap-1">
                  Get Early Access <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* Supplier CTA */}
            <Link
              href="/suppliers"
              className="group relative p-6 bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-1">I'm a Supplier</h3>
                <span className="text-sm text-slate-400 group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                  List your products <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="pt-8 border-t border-slate-800/50">
            <p className="text-sm text-slate-500 font-medium tracking-wider uppercase mb-8">
              Trusted Data Standards & Partners
            </p>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-70 hover:opacity-100 transition-opacity duration-500 mix-blend-screen">
              {/* Partner Logos - Using Text/Icons for now if images missing, but aiming for sleekness */}
              <div className="flex items-center gap-2 group cursor-default">
                <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">EPD</span>
                <span className="text-xs text-slate-400 border border-slate-700 px-1 rounded">Intl</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">FSC</span>
                <span className="text-xs text-slate-400 border border-slate-700 px-1 rounded">Verified</span>
              </div>
               <div className="flex items-center gap-2 group cursor-default">
                <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">LEED</span>
                <span className="text-xs text-slate-400 border border-slate-700 px-1 rounded">Compliant</span>
              </div>
               <div className="grayscale hover:grayscale-0 transition-all duration-300 relative w-32 h-8">
                {/* Fallback for Autodesk if image fails */}
                 <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white italic">Autodesk</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
