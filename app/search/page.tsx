'use client';

export const dynamic = 'force-dynamic'

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FiSearch } from "react-icons/fi";

export default function SearchPage() {
  const [query, setQuery] = useState("");

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
            <div className="flex gap-4">
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
              <Button size="lg" className="h-12 px-8 text-lg">
                Search
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-muted-foreground">Search functionality is currently being updated.</p>
      </main>
      <Footer />
    </div>
  );
}
