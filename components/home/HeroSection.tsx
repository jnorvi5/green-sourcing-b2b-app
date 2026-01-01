"use client";

import Link from "next/link";
import { ArrowRight, Building2, Database, ShieldCheck, Star } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-24">
      {/* 1. Dynamic Background - "The Mood" */}
      <div className="absolute inset-0 bg-brand-obsidian z-0">
        {/* Subtle Gradient Mesh */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-brand-obsidian to-black opacity-80" />

        {/* Animated Orbs for "Life" */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-gold-dark/10 rounded-full blur-[100px] animate-float" />

        {/* Grid Overlay for Tech Feel, but subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Hero Content */}
        <div className="text-center max-w-5xl mx-auto">

          {/* 2. Exclusive Invitation Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-brand-gold-light text-sm font-sans font-medium mb-10 backdrop-blur-md animate-fade-in-up hover:bg-white/10 transition-colors cursor-default shadow-[0_0_20px_-5px_rgba(212,175,55,0.3)]">
            <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
            <span className="tracking-wide">FOUNDING MEMBER ACCESS</span>
          </div>

          {/* 3. The Headline - Suave & Bold */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold tracking-tight text-white mb-8 leading-[1.05] animate-fade-in-up [animation-delay:200ms]">
            Build <span className="text-gradient-emerald italic pr-2">Green.</span> <br className="hidden md:block" />
            Build <span className="text-gradient-gold">Verified.</span>
          </h1>

          {/* 4. Subheadline - The Pitch */}
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed font-light animate-fade-in-up [animation-delay:400ms]">
            The exclusive marketplace for architects who demand
            <span className="text-white font-medium"> verified data</span> and suppliers who define
            <span className="text-white font-medium"> sustainable luxury</span>.
          </p>

          {/* 5. The "Velvet Rope" CTAs - High Contrast, Touchable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24 animate-fade-in-up [animation-delay:600ms]">

            {/* Data Provider - Subtle Luxury */}
            <Link
              href="/data-providers"
              className="group relative p-8 glass glass-hover rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 hover:-translate-y-2"
            >
              <div className="mb-4 p-4 bg-emerald-900/20 rounded-full group-hover:bg-emerald-500/20 transition-colors duration-500">
                <Database className="w-8 h-8 text-emerald-400/80 group-hover:text-emerald-300 transition-colors" />
              </div>
              <h3 className="text-xl font-serif text-slate-200 mb-2 group-hover:text-white">Data Providers</h3>
              <span className="text-sm text-slate-500 font-sans tracking-wide group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                Integrate Now <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Architect - The Main Event (Center Stage) */}
            <Link
              href="/architect"
              className="relative p-8 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 hover:-translate-y-2 transform md:scale-110 z-10 border border-emerald-500/50 shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)] bg-gradient-to-b from-slate-900 to-black overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 via-transparent to-brand-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="mb-4 p-4 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-lg group-hover:shadow-emerald-500/50 transition-shadow duration-500">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-2">Architects</h3>
              <span className="text-sm text-emerald-300 font-sans tracking-wide font-medium flex items-center gap-2 group-hover:text-white transition-colors">
                Claim Access <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* Supplier - Subtle Luxury */}
            <Link
              href="/suppliers"
              className="group relative p-8 glass glass-hover rounded-xl flex flex-col items-center justify-center text-center transition-all duration-500 hover:-translate-y-2"
            >
              <div className="mb-4 p-4 bg-brand-gold-dark/10 rounded-full group-hover:bg-brand-gold/20 transition-colors duration-500">
                <ShieldCheck className="w-8 h-8 text-brand-gold/80 group-hover:text-brand-gold transition-colors" />
              </div>
              <h3 className="text-xl font-serif text-slate-200 mb-2 group-hover:text-white">Suppliers</h3>
              <span className="text-sm text-slate-500 font-sans tracking-wide group-hover:text-brand-gold transition-colors flex items-center gap-2">
                Get Verified <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

          {/* 6. Social Proof - Minimalist & Trustworthy */}
          <div className="pt-8 border-t border-white/5 animate-fade-in-up [animation-delay:800ms]">
            <p className="text-xs text-slate-600 font-sans font-bold tracking-[0.2em] uppercase mb-8">
              Standards & Partners
            </p>
            <div className="flex flex-wrap justify-center gap-16 items-center opacity-60 hover:opacity-100 transition-opacity duration-700 grayscale hover:grayscale-0">
               {/* Stylish Text Logos for Speed */}
               <div className="text-xl font-serif font-bold text-white tracking-widest hover:text-emerald-400 transition-colors cursor-default">EPD<span className="text-xs align-top opacity-50">INTL</span></div>
               <div className="text-xl font-serif font-bold text-white tracking-widest hover:text-emerald-400 transition-colors cursor-default">FSC<span className="text-xs align-top opacity-50">®</span></div>
               <div className="text-xl font-serif font-bold text-white tracking-widest hover:text-emerald-400 transition-colors cursor-default">LEED</div>
               <div className="text-xl font-serif font-bold text-white tracking-widest hover:text-emerald-400 transition-colors italic">Autodesk</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
