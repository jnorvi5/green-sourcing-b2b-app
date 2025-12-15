'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/greenchainz-logo.png"
              alt="GreenChainz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
              GreenChainz
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/search"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Product Search
            </Link>
            <Link
              href="/suppliers"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Suppliers
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
