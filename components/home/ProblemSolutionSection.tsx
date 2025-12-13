export default function ProblemSolutionSection() {
  return (
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
              <li>• $70 data buried in PDFs, not searchable</li>
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
  );
}
