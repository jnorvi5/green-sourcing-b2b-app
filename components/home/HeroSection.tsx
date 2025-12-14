"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Background Glowing Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] -z-10 pointer-events-none select-none">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <Image
            src="/logos/hero-glow-icon.png"
            alt="Background Effect"
            fill
            className="object-contain opacity-[0.03] blur-sm"
            priority
          />
        </div>

        {/* Launching Badge */}
        <div className="flex justify-center mb-8 relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
            <span className="text-emerald-400 text-sm font-medium">
              ● Launching Q1 2026
            </span>
          </div>
        </div>

        {/* Logo Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden">
            <Image
              src="/logos/greenchainz-logo.png"
              alt="GreenChainz"
              width={96}
              height={96}
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-center mb-6">
          <span className="block text-5xl md:text-7xl font-bold text-white mb-4">
            Find Verified
          </span>
          <span className="block text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Green Suppliers
          </span>
          <span className="block text-4xl md:text-5xl font-bold text-slate-400 mt-4">
            in 10 minutes
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-center text-xl text-slate-300 max-w-3xl mx-auto mb-12">
          The B2B marketplace where architects discover certified sustainable
          material suppliers.{" "}
          <span className="text-emerald-400 font-semibold">
            No PDFs. No greenwashing. Just verified data.
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 relative z-10">
          <Link
            href="/search"
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105"
          >
            Search Suppliers →
          </Link>
          <Link
            href="/signup?type=supplier"
            className="px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold border border-slate-700 hover:border-emerald-500/50 transition-all"
          >
            I&apos;m a Supplier
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">
            Backed By & Integration Partners
          </p>
          <div className="flex justify-center gap-12 items-center opacity-80 mix-blend-screen">
            <div className="relative w-48 h-12 grayscale hover:grayscale-0 transition-all duration-300">
              <Image
                src="/logos/autodesk-startups.png"
                alt="Autodesk for Startups"
                fill
                className="object-contain"
              />
            </div>
            <div className="text-2xl font-bold text-emerald-400">FSC</div>
            <div className="text-2xl font-bold text-emerald-400">WAP</div>
          </div>
        </div>
      </div>
    </section>
  );
}
