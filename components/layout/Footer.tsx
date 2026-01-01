"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    // FORCE: Dark Green Background (#14532d), White Text
    <footer className="w-full bg-[#14532d] text-white">
      <div className="max-w-screen-xl px-4 py-16 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
               <Image
                src="/assets/logo/greenchainz-logo.svg"
                alt="GreenChainz"
                width={160}
                height={40}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="max-w-xs text-gray-200">
              The global trust layer for sustainable commerce. Verified green
              material sourcing for architects and manufacturers.
            </p>
            <div className="flex mt-8 space-x-6">
              <a
                className="text-white hover:text-gray-300 transition"
                href="https://www.linkedin.com/company/greenchainz"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="LinkedIn"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="w-6 h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                className="text-white hover:text-gray-300 transition"
                href="https://twitter.com/greenchainzhq"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Twitter"
              >
                 <span className="sr-only">Twitter</span>
                <svg
                  className="w-6 h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                   <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-3 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="font-bold text-white mb-4">Product</p>
              <nav className="flex flex-col space-y-2 text-sm text-gray-200">
                <Link href="/" className="hover:text-white hover:underline">
                  Marketplace
                </Link>
                <Link
                  href="/sourcing"
                  className="hover:text-white hover:underline"
                >
                  Verify Data
                </Link>
                <Link
                  href="/suppliers"
                  className="hover:text-white hover:underline"
                >
                  For Suppliers
                </Link>
                <Link
                  href="/how-it-works"
                  className="hover:text-white hover:underline"
                >
                  How It Works
                </Link>
                <Link
                  href="/pricing"
                  className="hover:text-white hover:underline"
                >
                  Pricing
                </Link>
              </nav>
            </div>

            <div>
              <p className="font-bold text-white mb-4">Company</p>
              <nav className="flex flex-col space-y-2 text-sm text-gray-200">
                <Link
                  href="/about"
                  className="hover:text-white hover:underline"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-white hover:underline"
                >
                  Contact
                </Link>
                <Link
                  href="/careers"
                  className="hover:text-white hover:underline"
                >
                  Careers
                </Link>
              </nav>
            </div>

            <div>
              <p className="font-bold text-white mb-4">Legal</p>
              <nav className="flex flex-col space-y-2 text-sm text-gray-200">
                <Link
                  href="/privacy"
                  className="hover:text-white hover:underline"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-white hover:underline"
                >
                  Terms of Service
                </Link>
                 <Link
                  href="/terms"
                  className="hover:text-white hover:underline"
                >
                  Supplier Agreement
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-12 border-t border-green-700/50">
          <p className="text-sm text-center text-gray-300">
            © {new Date().getFullYear()} GreenChainz. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
