'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/80 backdrop-blur-md border-b border-white/5 py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder - using text for now but styled elegantly */}
            <Link href="/" className="group flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-bold font-playfair text-xl shadow-[0_0_15px_-3px_rgba(52,211,153,0.4)]">
                G
              </div>
              <span className="text-xl font-playfair font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                GreenChainz
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {/* <Link
              href="/search"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Product Search
            </Link>
            <Link
              href="/suppliers"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Suppliers
            </Link> */}
            <Link
              href="/about"
              className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/founding-50"
              className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors relative group"
            >
              Founding 50
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-400 transition-all group-hover:w-full"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5 font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-200 font-semibold border border-transparent shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
