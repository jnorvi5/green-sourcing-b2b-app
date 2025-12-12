import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/greenchainz-logo.png"
              alt="GreenChainz Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <Link href="/" className="text-2xl font-bold text-white">
              GreenChainz
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/search"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Product Search
            </Link>
            <Link
              href="/suppliers"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Suppliers
            </Link>
            <Link
              href="/about"
              className="text-slate-300 hover:text-white transition-colors"
            >
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
