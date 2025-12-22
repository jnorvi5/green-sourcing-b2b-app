'use client';

import Image from "next/image";

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-16">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            How It Works
          </span>
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
              <Image
                src="/images/plugin/step1.svg"
                alt="Login to Revit Plugin"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-500/20 mb-2">
                01
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Install & Login</h3>
              <p className="text-slate-400">
                Download the plugin and log in directly within Revit.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
              <Image
                src="/images/plugin/step2.svg"
                alt="Analyze Model Carbon"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-500/20 mb-2">
                02
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Analyze Model</h3>
              <p className="text-slate-400">
                AI scans your BIM model for high-carbon materials instantly.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
              <Image
                src="/images/plugin/step3.svg"
                alt="Swap Materials"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-500/20 mb-2">
                03
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Swap & Save</h3>
              <p className="text-slate-400">
                Replace generic materials with verified, low-carbon alternatives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
