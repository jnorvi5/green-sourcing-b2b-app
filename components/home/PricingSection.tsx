import Link from "next/link";

export default function PricingSection() {
  return (
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
              $99<span className="text-lg text-slate-400">/mo</span>
            </div>
            <div className="text-slate-400 mb-4">Basic Tier</div>
            <Link
              href="/signup?type=supplier"
              className="block w-full text-center px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-emerald-500/50 hover:border-emerald-500 transition-all">
            <div className="text-3xl font-bold text-emerald-400 mb-2">
              $249<span className="text-lg text-slate-400">/mo</span>
            </div>
            <div className="text-slate-400 mb-4">Pro Tier</div>
            <Link
              href="/signup?type=supplier"
              className="block w-full text-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
            >
              Get Started
            </Link>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-emerald-500/30 transition-all">
            <div className="text-3xl font-bold text-emerald-400 mb-2">
              $499<span className="text-lg text-slate-400">/mo</span>
            </div>
            <div className="text-slate-400 mb-4">Enterprise</div>
            <Link
              href="/signup?type=supplier"
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
  );
}
