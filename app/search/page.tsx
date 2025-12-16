'use client';

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FiSearch, FiFilter } from "react-icons/fi";
import { FadeIn } from "@/components/ui/motion-wrapper";
import { FaLeaf } from 'react-icons/fa';
import { SustainabilityDataBadge } from '@/components/SustainabilityDataBadge';

export const dynamic = 'force-dynamic';

// Lazy load the AgentChat component
const AgentChat = dynamic(() => import("@/components/AgentChat"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-xl" />,
});

interface ProductSnippet {
  _id: string;
  title: string;
  price: number;
  currency: string;
  material_type?: string;
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
  const [results, setResults] = useState<Supplier[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        setResults(json.data || []);
    } catch (err) {
        console.error(err);
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Find Sustainable Materials
            </h1>
        </div>
        <Card className="mb-12 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 h-12 text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 text-lg" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
            <div className="mb-12 space-y-6">
                <h2 className="text-2xl font-bold">Search Results</h2>
                {results.map((supplier) => (
                    <Card key={supplier.id} className="p-6">
                         <h3 className="text-xl font-bold">{supplier.company_name}</h3>
                         <p className="text-muted-foreground">{supplier.description}</p>

                        {supplier.matched_products && supplier.matched_products.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <div className="flex items-center gap-2 mb-4 text-sm text-teal-600 font-medium">
                            <FaLeaf />
                            <span>Matching Products</span>
                            {supplier.agent_insight && (
                                <span className="text-muted-foreground font-normal ml-2">• {supplier.agent_insight}</span>
                            )}
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                            {supplier.matched_products.map((product) => (
                                <div key={product._id} className="bg-muted/50 rounded-lg p-3 border border-border hover:border-teal-500/30 transition flex flex-col justify-between">
                                <div>
                                    <h4 className="font-medium text-foreground truncate mb-1">{product.title}</h4>
                                    <div className="flex items-center justify-between text-xs mb-3">
                                    <span className="text-muted-foreground">
                                        {product.currency} {product.price}
                                    </span>
                                    </div>
                                </div>

                                {/* LIVE Sustainability Data Badge */}
                                <SustainabilityDataBadge
                                    productId={product.title}
                                    materialType={product.material_type || 'Unknown'}
                                />
                                </div>
                            ))}
                            </div>
                        </div>
                        )}
                    </Card>
                ))}
            </div>
        )}

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
                  Ask complex questions about material availability, certifications, and pricing.
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
                {["Structural Steel", "Concrete", "Insulation", "Glass", "Timber"].map((item) => (
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
                <div className="text-sm text-muted-foreground">No recent searches</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
