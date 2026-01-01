"use client";

import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { ArrowRight, Box, BarChart, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";

export default function SupplierPage() {
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
                For Material Manufacturers & Suppliers
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Get Your Products <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Specified Automatically
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Don't wait for RFQs. GreenChainz puts your sustainable materials in front of architects the moment they start designing in Revit.
              </p>

              <div className="flex flex-col gap-4">
                 <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                    <div>
                       <h3 className="font-semibold text-white">Verified "Green" Badge</h3>
                       <p className="text-slate-400 text-sm">Stand out from greenwashing competitors.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3">
                    <Truck className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                    <div>
                       <h3 className="font-semibold text-white">Direct-to-Spec RFQs</h3>
                       <p className="text-slate-400 text-sm">Receive qualified leads directly from BIM models.</p>
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
                     <p className="text-slate-300 font-medium">Supplier Demo Video</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="bg-slate-900/30 py-20 border-y border-slate-800/50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-8">
                 <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                    <BarChart className="w-10 h-10 text-emerald-400 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Market Visibility</h3>
                    <p className="text-slate-400">Be visible to 200+ founding architects actively looking for green alternatives.</p>
                 </div>
                 <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                    <ShieldCheck className="w-10 h-10 text-emerald-400 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Trust & Credibility</h3>
                    <p className="text-slate-400">Our verification process validates your EPDs, building immense trust with buyers.</p>
                 </div>
                 <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                    <Box className="w-10 h-10 text-emerald-400 mb-6" />
                    <h3 className="text-xl font-bold mb-3">Early Access Rates</h3>
                    <p className="text-slate-400">Lock in founding member pricing for listing fees and lead generation.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* CTA Form */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
           <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              <h2 className="text-3xl font-bold mb-4">List Your Products</h2>
              <p className="text-slate-300 mb-8">
                 Join the exclusive list of verified suppliers for our December launch.
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
                       Apply to List Products <ArrowRight className="w-4 h-4" />
                    </button>
                 </form>
              ) : (
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 animate-fade-in-up">
                    <Truck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Application Received!</h3>
                    <p className="text-slate-300">
                       Our verification team will review your credentials and contact you shortly.
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
