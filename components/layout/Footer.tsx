'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="max-w-screen-xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <Image 
                src="/assets/logo-white.png" 
                alt="GreenChainz Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
              <span className="text-2xl font-bold">GreenChainz</span>
            </div>
            <p className="max-w-xs text-gray-300">
              The global trust layer for sustainable commerce. Verified green material sourcing for architects and manufacturers.
            </p>
            <div className="flex mt-8 space-x-6">
              <a
                className="text-gray-300 hover:text-white transition"
                href="https://www.linkedin.com/company/greenchainz"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
            <div>
              <p className="font-bold">Product</p>
              <nav className="flex flex-col mt-4 space-y-2 text-sm text-gray-300">
                <Link href="/" className="hover:text-white transition">Marketplace</Link>
                <Link href="/sourcing" className="hover:text-white transition">Verify Data</Link>
                <Link href="/suppliers" className="hover:text-white transition">For Suppliers</Link>
              </nav>
            </div>

            <div>
              <p className="font-bold">Company</p>
              <nav className="flex flex-col mt-4 space-y-2 text-sm text-gray-300">
                <Link href="/about" className="hover:text-white transition">About Us</Link>
                <Link href="/contact" className="hover:text-white transition">Contact</Link>
                <Link href="/careers" className="hover:text-white transition">Careers</Link>
              </nav>
            </div>

            <div>
              <p className="font-bold">Legal</p>
              <nav className="flex flex-col mt-4 space-y-2 text-sm text-gray-300">
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-12 border-t border-green-800">
          <p className="text-sm text-center text-gray-400">
            © {new Date().getFullYear()} GreenChainz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
