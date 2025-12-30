"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Database, CheckCircle, BarChart3, Globe } from "lucide-react";
import { useState } from "react";

export default function DataProvidersPage() {
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
                For EPD & Lifecycle Data Providers
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Monetize Your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Sustainability Data
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Stop letting your data sit in static PDFs. Integrate with GreenChainz to put your verified sustainability data directly into the workflows of thousands of architects.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white">Direct Revit Integration</h3>
                    <p className="text-slate-400 text-sm">Your data appears right where architects design.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white">Automated Attribution</h3>
                    <p className="text-slate-400 text-sm">Every time your data is used, you get credit (and analytics).</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Placeholder */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 opacity-90" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                     <Database className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
                     <p className="text-slate-300 font-medium">Pitch Video Coming Soon</p>
                  </div>
               </div>
               {/* Use this when video is ready
               <iframe
                 className="absolute inset-0 w-full h-full"
                 src="YOUR_VIDEO_URL"
               ></iframe>
               */}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-slate-900/30 py-20 border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Why Partner with GreenChainz?</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">We are building the standard for digital sustainability data exchange.</p>
             </div>

             <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                   <Globe className="w-10 h-10 text-emerald-400 mb-6" />
                   <h3 className="text-xl font-bold mb-3">Global Reach</h3>
                   <p className="text-slate-400">Instantly distribute your EPDs to architects across North America and Europe.</p>
                </div>
                <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                   <BarChart3 className="w-10 h-10 text-emerald-400 mb-6" />
                   <h3 className="text-xl font-bold mb-3">Usage Analytics</h3>
                   <p className="text-slate-400">See exactly which projects are using your data and calculating carbon impact.</p>
                </div>
                <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                   <Database className="w-10 h-10 text-emerald-400 mb-6" />
                   <h3 className="text-xl font-bold mb-3">API-First</h3>
                   <p className="text-slate-400">Modern JSON APIs replace clunky CSV exports. Real-time updates.</p>
                </div>
             </div>
          </div>
        </div>

        {/* CTA Form */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
           <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              <h2 className="text-3xl font-bold mb-4">Become a Launch Partner</h2>
              <p className="text-slate-300 mb-8">
                 We are selecting 5 data providers for our founding cohort (Dec 1 Launch).
              </p>

              {!submitted ? (
                 <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
                    <div>
                       <input
                          type="email"
                          required
                          placeholder="Enter your work email"
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                       />
                    </div>
                    <button
                       type="submit"
                       className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                       Apply for Partnership <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-slate-500 mt-4">
                       Limited spots available for Phase 1.
                    </p>
                 </form>
              ) : (
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 animate-fade-in-up">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Application Received!</h3>
                    <p className="text-slate-300">
                       Thanks for your interest. Our partnership team will be in touch within 24 hours.
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
