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
  );
}
