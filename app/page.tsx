import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion-wrapper";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32 bg-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(16,185,129,0.15),transparent_60%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            
            {/* Launching Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <span className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Launching Q1 2026
                </span>
              </div>
            </div>

            {/* Logo Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 bg-slate-950 border border-slate-800">
                <Image
                  src="/logos/greenchainz-logo.png"
                  alt="GreenChainz"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Main Headline */}
            <FadeIn delay={0.2}>
              <h1 className="text-center mb-8 max-w-4xl mx-auto">
                <span className="block text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2 tracking-tight">
                  Find Verified
                </span>
                <span className="block text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2 tracking-tight">
                  Green Suppliers
                </span>
                <span className="block text-3xl md:text-5xl font-bold text-slate-400 mt-4">
                  in minutes, not weeks.
                </span>
              </h1>
            </FadeIn>

            {/* Subheadline */}
            <FadeIn delay={0.4}>
              <p className="text-center text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
                The B2B marketplace where architects discover certified sustainable
                material suppliers.{" "}
                <span className="text-emerald-400 font-medium">
                  No PDFs. No greenwashing. Just verified data.
                </span>
              </p>
            </FadeIn>

            {/* CTA Buttons */}
            <FadeIn delay={0.6}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                <Link href="/search">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-none transition-transform hover:scale-105">
                    Search Suppliers →
                  </Button>
                </Link>
                <Link href="/signup?type=supplier">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 hover:text-white transition-transform hover:scale-105">
                    I&apos;m a Supplier
                  </Button>
                </Link>
              </div>
            </FadeIn>

            {/* Trust Badges */}
            <FadeIn delay={0.8}>
              <div className="flex flex-col items-center gap-6">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Trusted Data Sources</p>
                <div className="flex gap-8 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="text-2xl font-bold text-white">FSC</div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="text-2xl font-bold text-white">EPD Int.</div>
                  <div className="w-px h-6 bg-slate-700" />
                  <div className="text-xl font-bold text-white">BuildingTransparency</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-slate-950 border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800/50">
              <div className="p-4">
                <div className="text-4xl font-bold text-emerald-400 mb-2">50+</div>
                <div className="text-slate-400 font-medium">Verified Suppliers</div>
              </div>
              <div className="p-4">
                <div className="text-4xl font-bold text-emerald-400 mb-2">200+</div>
                <div className="text-slate-400 font-medium">Architects</div>
              </div>
              <div className="p-4">
                <div className="text-4xl font-bold text-emerald-400 mb-2">$471B</div>
                <div className="text-slate-400 font-medium">Market Size</div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem vs Solution */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* The Problem */}
              <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/20 shadow-none">
                <CardContent className="p-8 md:p-10">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-6 text-2xl">
                    ⚠️
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    The Old Way
                  </h3>
                  <ul className="space-y-4 text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      2 weeks wasted finding certified suppliers
                    </li>
                    <li className="flex gap-3">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      Data buried in unsearchable PDFs
                    </li>
                    <li className="flex gap-3">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      No way to verify greenwashing claims
                    </li>
                    <li className="flex gap-3">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      Small sustainable suppliers invisible
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* GreenChainz Solution */}
              <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Image src="/logos/greenchainz-logo.png" width={200} height={200} alt="bg" />
                </div>
                <CardContent className="p-8 md:p-10 relative">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 text-2xl">
                    ⚡
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    The GreenChainz Way
                  </h3>
                  <ul className="space-y-4 text-muted-foreground">
                    <li className="flex gap-3 text-foreground font-medium">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      Find verified suppliers in 10 minutes
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      Real-time carbon footprint comparison
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      Verified EPDs, FSC, & Corp badges
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      Instant RFQs to qualified suppliers
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800 to-transparent dashed opacity-50" />
              
              <div className="text-center relative bg-background/50 p-6 rounded-2xl backdrop-blur-sm">
                <div className="w-24 h-24 mx-auto bg-background rounded-full border-4 border-muted flex items-center justify-center text-4xl font-bold text-emerald-500 mb-6 shadow-sm z-10 relative">
                  01
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Search</h3>
                <p className="text-muted-foreground">
                  Filter by material, certification, carbon footprint, and location.
                </p>
              </div>
              <div className="text-center relative bg-background/50 p-6 rounded-2xl backdrop-blur-sm">
                <div className="w-24 h-24 mx-auto bg-background rounded-full border-4 border-muted flex items-center justify-center text-4xl font-bold text-emerald-500 mb-6 shadow-sm z-10 relative">
                  02
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Compare</h3>
                <p className="text-muted-foreground">
                  See verified EPDs, certifications, and carbon data side-by-side.
                </p>
              </div>
              <div className="text-center relative bg-background/50 p-6 rounded-2xl backdrop-blur-sm">
                <div className="w-24 h-24 mx-auto bg-background rounded-full border-4 border-muted flex items-center justify-center text-4xl font-bold text-emerald-500 mb-6 shadow-sm z-10 relative">
                  03
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Connect</h3>
                <p className="text-muted-foreground">
                  Send RFQ instantly. Suppliers respond directly in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Supplier Pricing Preview */}
        <section className="py-24 bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                For Suppliers: <span className="text-emerald-400">Get Discovered</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                List your certified products and get qualified RFQs from architects specifying materials for real projects.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Basic Tier */}
              <Card className="bg-slate-950 border-slate-800 text-slate-300">
                <CardContent className="p-8">
                  <div className="text-3xl font-bold text-white mb-1">$99<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <div className="text-emerald-500 font-medium mb-6">Basic Tier</div>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li>✓ 1 Product Listing</li>
                    <li>✓ Standard Visibility</li>
                    <li>✓ Basic Analytics</li>
                  </ul>
                  <Link href="/signup?type=supplier" className="w-full block">
                    <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="bg-slate-900 border-emerald-500/50 text-slate-300 relative transform md:-translate-y-4 shadow-2xl shadow-emerald-900/20">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardContent className="p-8">
                  <div className="text-3xl font-bold text-white mb-1">$249<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <div className="text-emerald-400 font-medium mb-6">Pro Tier</div>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li>✓ 10 Product Listings</li>
                    <li>✓ Priority Search Ranking</li>
                    <li>✓ Advanced Analytics</li>
                    <li>✓ Verified Batch</li>
                  </ul>
                  <Link href="/signup?type=supplier" className="w-full block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">Get Started</Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enterprise Tier */}
              <Card className="bg-slate-950 border-slate-800 text-slate-300">
                <CardContent className="p-8">
                  <div className="text-3xl font-bold text-white mb-1">$499<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <div className="text-emerald-500 font-medium mb-6">Enterprise</div>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li>✓ Unlimited Listings</li>
                    <li>✓ API Integration</li>
                    <li>✓ Dedicated Success Manager</li>
                  </ul>
                  <Link href="/signup?type=supplier" className="w-full block">
                    <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">Contact Sales</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-12">
              <Link href="/supplier/pricing" className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline">
                View Full Pricing Details →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
