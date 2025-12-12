import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Launching Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/search"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105"
            >
              Search Suppliers →
            </Link>
            <Link
              href="/supplier-signup"
              className="px-8 py-4 bg-slate-800/50 text-white rounded-xl font-semibold border border-slate-700 hover:border-emerald-500/50 transition-all"
            >
              I&apos;m a Supplier
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center gap-8 mb-12">
            <div className="text-slate-400 text-sm">Trusted Partners</div>
          </div>
          <div className="flex justify-center gap-12 items-center opacity-60">
            <div className="text-2xl font-bold text-emerald-400">FSC</div>
            <div className="text-2xl font-bold text-emerald-400">WAP</div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                50+
              </div>
              <div className="text-slate-400">Verified Suppliers</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                200+
              </div>
              <div className="text-slate-400">Architects</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                \$471B
              </div>
              <div className="text-slate-400">Market Size</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* The Problem */}
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-red-500/20">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                The Problem
              </h3>
              <ul className="space-y-3 text-slate-400">
                <li>• 2 weeks wasted finding certified suppliers</li>
                <li>• \$70 data buried in PDFs, not searchable</li>
                <li>• No way to verify greenwashing claims</li>
                <li>• Small sustainable suppliers invisible</li>
              </ul>
            </div>

            {/* GreenChainz Solution */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-400 mb-4">
                GreenChainz
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li>
                  ✓{" "}
                  <span className="text-emerald-400 font-semibold">
                    10 minutes
                  </span>{" "}
                  to find verified suppliers
                </li>
                <li>✓ Real-time carbon footprint comparison</li>
                <li>✓ Verified EPDs, FSC, & Corp badges</li>
                <li>✓ Instant RFQs to qualified suppliers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-7xl font-bold text-emerald-500/20 mb-4">
                01
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Search</h3>
              <p className="text-slate-400">
                Filter by material, certification, carbon footprint, location
              </p>
            </div>
            <div className="text-center">
              <div className="text-7xl font-bold text-emerald-500/20 mb-4">
                02
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Compare</h3>
              <p className="text-slate-400">
                See verified EPDs, certifications, carbon data side-by-side
              </p>
            </div>
            <div className="text-center">
              <div className="text-7xl font-bold text-emerald-500/20 mb-4">
                03
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Connect</h3>
              <p className="text-slate-400">
                Send RFQ instantly. Suppliers respond in dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supplier Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="text-white">For Suppliers:</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Get Discovered
            </span>
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            List your certified products. Get qualified RFQs from architects
            specifying materials for real projects.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-emerald-500/30 transition-all">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                \$99<span className="text-lg text-slate-400">/mo</span>
              </div>
              <div className="text-slate-400 mb-4">Basic Tier</div>
              <Link
                href="/supplier-signup"
                className="block w-full text-center px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all"
              >
                Get Started
              </Link>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-emerald-500/50 hover:border-emerald-500 transition-all">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                \$249<span className="text-lg text-slate-400">/mo</span>
              </div>
              <div className="text-slate-400 mb-4">Pro Tier</div>
              <Link
                href="/supplier-signup"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
              >
                Get Started
              </Link>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-emerald-500/30 transition-all">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                \$499<span className="text-lg text-slate-400">/mo</span>
              </div>
              <div className="text-slate-400 mb-4">Enterprise</div>
              <Link
                href="/supplier-signup"
                className="block w-full text-center px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/supplier-signup"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View Pricing Details →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
