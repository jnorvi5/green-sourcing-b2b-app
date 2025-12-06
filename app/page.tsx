'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* GIANT FADED BACKGROUND LOGO WATERMARK */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image 
          src="/logos/logo-icon.jpg" 
          alt="" 
          width={1200} 
          height={1200}
          className="object-contain"
          style={{ transform: `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.05}deg)` }}
        />
      </div>

      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 animate-pulse" />
        <div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-400/20 via-transparent to-transparent"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Minimal Header with REAL LOGO */}
        <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src="/logos/logo-icon.jpg" 
                alt="GreenChainz" 
                width={48} 
                height={48}
                className="rounded-xl shadow-lg shadow-teal-500/50 group-hover:shadow-teal-500/80 transition-all group-hover:scale-105"
              />
              <span className="text-xl font-bold tracking-tight">GREENCHAINZ</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-sm text-gray-400 hover:text-white transition-colors">
                Search
              </Link>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/supplier/pricing" className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-teal-400 transition-all hover:shadow-lg hover:shadow-teal-400/50">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-6xl mx-auto text-center">
            {/* Floating badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm mb-8 backdrop-blur-sm animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Launching Q1 2026
            </div>

            {/* PROMINENT LOGO ABOVE HEADLINE */}
            <div className="mb-8 flex justify-center">
              <Image 
                src="/logos/logo-main.jpg" 
                alt="GreenChainz" 
                width={400} 
                height={200}
                className="drop-shadow-[0_0_60px_rgba(45,212,191,0.4)]"
                priority
              />
            </div>

            {/* Main headline with glow effect */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Find Verified<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 animate-gradient-x drop-shadow-[0_0_80px_rgba(45,212,191,0.3)]">
                Green Suppliers
              </span>
              <br />
              <span className="text-4xl md:text-6xl text-gray-500">in 10 minutes</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light">
              The B2B marketplace where architects discover certified sustainable material suppliers. 
              <span className="text-white font-medium"> No PDFs. No greenwashing. Just verified data.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/search" 
                className="group px-10 py-5 bg-gradient-to-r from-teal-500 to-emerald-500 text-black text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-teal-500/50 transition-all hover:scale-105"
              >
                <span className="flex items-center gap-2 justify-center">
                  Search Suppliers
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              <Link 
                href="/supplier/pricing" 
                className="px-10 py-5 bg-white/5 backdrop-blur-sm border border-white/10 text-white text-lg font-semibold rounded-full hover:bg-white/10 hover:border-white/20 transition-all"
              >
                I'm a Supplier
              </Link>
            </div>

            {/* Trusted By / Partner Badges */}
            <div className="pt-12 border-t border-white/5">
              <p className="text-sm text-gray-500 mb-6">TRUSTED PARTNERS</p>
              <div className="flex items-center justify-center gap-12 flex-wrap">
                <Image 
                  src="/logos/wap_logo.jpg" 
                  alt="WAP Sustainability" 
                  width={120} 
                  height={60}
                  className="opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                />
                <Image 
                  src="/logos/usgbc_logo.jpg" 
                  alt="USGBC LEED" 
                  width={100} 
                  height={100}
                  className="opacity-60 hover:opacity-100 transition-opacity hover:scale-110 transition-transform"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 mt-12 border-t border-white/5">
              <div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">50+</div>
                <div className="text-sm text-gray-500 mt-1">Verified Suppliers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">200+</div>
                <div className="text-sm text-gray-500 mt-1">Architects</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">$471B</div>
                <div className="text-sm text-gray-500 mt-1">Market Size</div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Problem */}
              <div className="relative p-10 rounded-3xl bg-gradient-to-br from-red-500/5 to-red-500/0 border border-red-500/10">
                <div className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl bg-red-500/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-6 mt-8">The Problem</h3>
                <ul className="space-y-4 text-gray-400 text-lg">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">×</span>
                    <span>2 weeks wasted finding certified suppliers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">×</span>
                    <span>EPD data buried in PDFs, not searchable</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">×</span>
                    <span>No way to verify greenwashing claims</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">×</span>
                    <span>Small sustainable suppliers invisible</span>
                  </li>
                </ul>
              </div>

              {/* Solution */}
              <div className="relative p-10 rounded-3xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/20 shadow-2xl shadow-teal-500/10">
                <div className="absolute -top-4 -left-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/50">
                  <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-6 mt-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">GreenChainz</h3>
                <ul className="space-y-4 text-gray-300 text-lg">
                  <li className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">✓</span>
                    <span><strong className="text-white">10 minutes</strong> to find verified suppliers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">✓</span>
                    <span>Real-time carbon footprint comparison</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">✓</span>
                    <span>Verified EPDs, FSC, B Corp badges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">✓</span>
                    <span>Instant RFQs to qualified suppliers</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 px-6 bg-gradient-to-b from-transparent via-teal-500/5 to-transparent">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl font-bold text-center mb-20">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">How It Works</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { num: '01', title: 'Search', desc: 'Filter by material, certification, carbon footprint, location' },
                { num: '02', title: 'Compare', desc: 'See verified EPDs, certifications, carbon data side-by-side' },
                { num: '03', title: 'Connect', desc: 'Send RFQ instantly. Suppliers respond in dashboard' }
              ].map((step, i) => (
                <div key={i} className="relative group">
                  <div className="text-8xl font-bold text-teal-500/10 group-hover:text-teal-500/20 transition-colors mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Suppliers */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="relative p-12 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  For Suppliers:<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Get Discovered</span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-10 max-w-2xl">
                  List your certified products. Get qualified RFQs from architects specifying materials for real projects.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  {[
                    { tier: 'Bronze', price: '$99', color: 'from-orange-400 to-yellow-600' },
                    { tier: 'Silver', price: '$249', color: 'from-gray-300 to-gray-500' },
                    { tier: 'Gold', price: '$499', color: 'from-yellow-400 to-yellow-600' }
                  ].map((plan, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/50 transition-all group">
                      <div className={`text-sm font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${plan.color}`}>
                        {plan.tier}
                      </div>
                      <div className="text-3xl font-bold mb-1">{plan.price}<span className="text-lg text-gray-500">/mo</span></div>
                    </div>
                  ))}
                </div>

                <Link 
                  href="/supplier/pricing" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-black text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-teal-500/50 transition-all hover:scale-105"
                >
                  View Pricing Details
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image 
                src="/logos/logo-icon.jpg" 
                alt="GreenChainz" 
                width={32} 
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold">GREENCHAINZ</span>
            </div>
            <p className="text-gray-500 text-sm">B2B Marketplace for Verified Sustainable Materials</p>
            <p className="text-gray-600 text-xs mt-2">© 2025 GreenChainz. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </main>
  );
}
// Force rebuild Fri Dec  5 21:44:59 EST 2025
