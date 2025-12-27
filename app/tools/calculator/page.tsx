"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf, Truck, Zap, FileText, MapPin, CheckCircle } from "lucide-react";
import MotionWrapper from "@/components/ui/motion-wrapper";

export default function CarbonCalculatorPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [category, setCategory] = useState("Concrete");
  const [zipCode, setZipCode] = useState("");
  const [quantity, setQuantity] = useState(100);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null); // Reset prev results

    try {
      // Simulate API call to the route we just created
      const response = await fetch("/api/tools/calculate-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: zipCode || "27601",
          category: category,
          quantity: Number(quantity),
          currentProductGWP: 45000, // Mock baseline: 450kg * 100 units
        }),
      });

      if (!response.ok) throw new Error("Failed to calculate");

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error calculating:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] py-12 px-4">
      <MotionWrapper className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold uppercase">
            Beta Access
          </span>
          <h1 className="text-4xl font-bold text-slate-900 mt-4">
            Carbon & Logistics Auditor
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Compare materials and calculate real-world environmental impact in
            seconds.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <Card className="lg:col-span-4 p-6 h-fit bg-white shadow-sm border border-slate-200">
            <form onSubmit={handleCalculate} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Project Zip Code
                </label>
                <Input
                  placeholder="Enter Zip Code..."
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Material Type
                </label>
                <select
                  className="w-full p-2 border rounded-md bg-white border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Concrete">Ready-Mix Concrete</option>
                  <option value="Steel">Structural Steel</option>
                  <option value="Timber">Mass Timber</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Planned Quantity (m3)
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <Button className="w-full bg-[#218a8d] hover:bg-[#1a7473] h-12 text-lg text-white font-semibold transition-colors">
                {loading ? "Analyzing..." : "Calculate Impact"}
              </Button>
            </form>
          </Card>

          {/* Results Area */}
          <div className="lg:col-span-8">
            {!results && !loading && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl h-96 flex flex-col items-center justify-center p-12 text-center">
                <Zap size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">
                  Enter project details to see your carbon analysis and local
                  alternatives.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-white border border-slate-100 rounded-2xl h-96 flex flex-col items-center justify-center p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-500 font-medium">
                  Crunching supply chain data...
                </p>
              </div>
            )}

            {results && results.bestOption && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6 border-l-4 border-emerald-500 bg-white shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold text-xs uppercase">
                        Total Carbon (A1-A4)
                      </span>
                      <Leaf size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-3xl font-black mt-2 text-slate-900">
                      {results.bestOption.totalCarbon.toLocaleString()} kg
                    </p>
                    <p className="text-emerald-600 font-bold text-sm">
                      Save {results.bestOption.savings}% vs baseline
                    </p>
                  </Card>
                  <Card className="p-6 border-l-4 border-blue-500 bg-white shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold text-xs uppercase">
                        Closest Supplier
                      </span>
                      <MapPin size={16} className="text-blue-500" />
                    </div>
                    <p className="text-xl font-bold mt-2 text-slate-900">
                      {results.bestOption.supplierName}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {results.bestOption.distance} miles from site
                    </p>
                  </Card>
                </div>

                {/* The Comparison Call to Action */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                      <CheckCircle size={20} />
                      <span>Recommended GreenChainz Alternative</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      {results.bestOption.name}
                    </h3>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="bg-white px-3 py-1 rounded-full border border-emerald-200 text-sm font-medium text-emerald-800">
                        LEED v5: +
                        {results.bestOption.leedContribution === "Significant"
                          ? "2"
                          : "1"}{" "}
                        Points
                      </div>
                      <div className="bg-white px-3 py-1 rounded-full border border-emerald-200 text-sm font-medium text-emerald-800">
                        Buy Clean NC: Compliant
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="bg-[#218a8d] hover:bg-[#1a7473] text-white">
                        Request Quote
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-white flex gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                      >
                        <FileText size={18} />
                        Export Spec
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {results && results.error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <p className="font-bold">Error finding materials:</p>
                <p>{results.error}</p>
              </div>
            )}
          </div>
        </div>
      </MotionWrapper>
    </div>
  );
}
