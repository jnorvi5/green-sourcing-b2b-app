"use client";

import Link from "next/link";
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-16 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 mb-6 group"
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-bold font-playfair text-xl">
                G
              </div>
              <span className="text-2xl font-playfair font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                GreenChainz
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-sm font-light">
              The exclusive verified B2B marketplace for sustainable construction materials. Connecting elite architects with certified suppliers.
            </p>
            <div className="flex gap-4">
            <a
              href="#"
              aria-label="LinkedIn"
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300"
            >
              <FaLinkedin size={18} />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300"
            >
              <FaTwitter size={18} />
            </a>
            <a
              href="#"
              aria-label="GitHub"
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300"
            >
              <FaGithub size={18} />
            </a>
          </div>
          </div>

          <div>
            <h4 className="font-playfair font-bold text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              {/* <li>
                <Link
                  href="/download-plugin"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Download Plugin
                </Link>
              </li> */}
              <li>
                <Link
                  href="/search"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Search Materials
                </Link>
              </li>
              <li>
                <Link
                  href="/suppliers"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Browse Suppliers
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <Link
                  href="/about"
                  className="hover:text-emerald-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/founding-50"
                  className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Founding 50 Cohort
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 font-light">
          <p>
            © {new Date().getFullYear()} GreenChainz Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
