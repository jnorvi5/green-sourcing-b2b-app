"use client";

import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, Box, Compass, FileCheck, Layers } from "lucide-react";
import { useState } from "react";

export default function ArchitectPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => setSubmitted(true), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Header />

      <main className="flex-grow pt-32 pb-20">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                For Architects & Specifiers
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Design Green. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Verify Instantly.
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                The first marketplace that integrates directly with your Revit workflow. Find verified low-carbon materials, check EPDs, and specify with confidence.
              </p>

              <div className="flex flex-col gap-4">
                 {/* Feature List */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Layers className="w-5 h-5 text-emerald-400" />
                       </div>
                       <span className="text-slate-300">Revit Plugin Integration</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <FileCheck className="w-5 h-5 text-emerald-400" />
                       </div>
                       <span className="text-slate-300">Automated Carbon Audits</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Compass className="w-5 h-5 text-emerald-400" />
                       </div>
                       <span className="text-slate-300">Verified Supplier Marketplace</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Video Placeholder */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 opacity-90" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                     <Box className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                     <p className="text-slate-300 font-medium">Platform Demo Video</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Roadmap Preview */}
        <div className="bg-slate-900/30 py-20 border-y border-slate-800/50">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-8">Join the Founding Cohort</h2>
              <div className="relative pt-12 pb-12">
                 {/* Timeline Line */}
                 <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full hidden md:block" />

                 <div className="grid md:grid-cols-3 gap-8 relative z-10">
                    <div className="bg-slate-950 p-6 rounded-xl border border-emerald-500 shadow-lg shadow-emerald-500/10">
                       <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4 shadow-lg shadow-emerald-500/30">1</div>
                       <h3 className="text-emerald-400 font-bold mb-2">Sign Up Now</h3>
                       <p className="text-sm text-slate-400">Secure your spot in the founding cohort.</p>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-700 opacity-75">
                       <div className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 font-bold mx-auto mb-4">2</div>
                       <h3 className="text-white font-bold mb-2">Dec 1: Beta Launch</h3>
                       <p className="text-sm text-slate-400">Get access to search & RFQ tools.</p>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 opacity-50">
                       <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-500 font-bold mx-auto mb-4">3</div>
                       <h3 className="text-slate-300 font-bold mb-2">Q1 2026</h3>
                       <p className="text-sm text-slate-500">Full Revit Integration Live.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* CTA Form */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
           <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              <h2 className="text-3xl font-bold mb-4">Claim Your Spot</h2>
              <p className="text-slate-300 mb-8">
                 Founding members get free lifetime access to core features.
              </p>

              {!submitted ? (
                 <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                    <div>
                       <input
                          type="email"
                          required
                          placeholder="Enter your email"
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                       />
                    </div>
                    <button
                       type="submit"
                       className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                       Join Founding Cohort <ArrowRight className="w-4 h-4" />
                    </button>
                 </form>
              ) : (
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 animate-fade-in-up">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                       <FileCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">You're In!</h3>
                    <p className="text-slate-300">
                       Welcome to the future of green building. Watch your inbox for your access details on December 1st.
                    </p>
                 </div>
              )}
           </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
