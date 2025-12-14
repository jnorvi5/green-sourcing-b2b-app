'use client';

export default function StatsSection() {
  return (
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
              $471B
            </div>
            <div className="text-slate-400">Market Size</div>
          </div>
        </div>
      </div>
    </section>
  );
}
