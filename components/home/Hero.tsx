import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-cyan-500/10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl lg:text-7xl font-extrabold text-white mb-4 leading-tight">
            The Future of
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              {' '}Verified Green Sourcing
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            GreenChainz is the B2B marketplace for sustainable building materials. 
            Connect with verified suppliers, access EPD data, and streamline your green procurement.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register?type=architect" 
              className="px-8 py-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-sky-500/20"
            >
              I&apos;m an Architect
            </Link>
            <Link 
              href="/register?type=supplier" 
              className="px-8 py-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg border border-slate-700 transition-all hover:scale-105"
            >
              I&apos;m a Supplier
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
