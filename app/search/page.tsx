"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FiSearch, FiFilter } from "react-icons/fi";
import { FadeIn } from "@/components/ui/motion-wrapper";

// Lazy load the AgentChat component
const AgentChat = nextDynamic(() => import("@/components/AgentChat"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
});

interface ProductSnippet {
  _id: string;
  title: string;
  price: number;
  currency: string;
  greenData?: {
    carbonFootprint?: number;
    certifications?: string[];
  };
}

interface Supplier {
  id: string;
  company_name: string;
  description: string;
  location: string;
  certifications: string[];
  epd_verified: boolean;
  fsc_verified: boolean;
  bcorp_verified: boolean;
  leed_verified: boolean;
  verification_source: string | null;
  matched_products?: ProductSnippet[];
  agent_insight?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => setIsSearching(false), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Search Header */}
        <div className="mb-12">
          <FadeIn>
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Find Sustainable Materials
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Search across thousands of verified suppliers, EPDs, and carbon
              data points.
            </p>
          </FadeIn>
        </div>

        {/* Search Input Section */}
        <Card className="mb-12 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="e.g., 'Recycled Steel Beams' or 'FSC Certified Oak'"
                  className="pl-10 h-12 text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8 text-lg"
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 w-12 px-0"
              >
                <FiFilter className="w-5 h-5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Agent Chat Interface */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md overflow-hidden border-emerald-500/20">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  AI Procurement Assistant
                </CardTitle>
                <CardDescription>
                  Ask complex questions about material availability,
                  certifications, and pricing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AgentChat />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Quick Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Structural Steel",
                  "Concrete",
                  "Insulation",
                  "Glass",
                  "Timber",
                ].map((item) => (
                  <Button
                    key={item}
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-primary"
                    onClick={() => setQuery(item)}
                  >
                    {item}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Searches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  No recent searches
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
