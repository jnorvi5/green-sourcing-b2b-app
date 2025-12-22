"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SupplierCard from "@/app/components/SupplierCard";

export default function FindSuppliers() {
  const params = useParams();
  const rfqId = params?.["id"] as string;

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findSuppliers = async () => {
      try {
        const res = await fetch("/api/agent/find-suppliers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rfq_id: rfqId }),
        });

        if (!res.ok) throw new Error("Matching agent failed");
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (rfqId) findSuppliers();
  }, [rfqId]);

  if (loading)
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-black text-gray-900 animate-pulse">
          🤖 AI Agent Matching System...
        </h2>
        <p className="text-gray-500 mt-2">
          Calculating tier priority, distance, and carbon footprint for matching
          suppliers.
        </p>
      </div>
    );

  if (error)
    return (
      <div className="max-w-2xl mx-auto p-10 bg-red-50 border border-red-200 rounded-2xl my-10 text-center">
        <h2 className="text-xl font-bold text-red-800 mb-2">
          Something went wrong
        </h2>
        <p className="text-red-600">{error}</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-8 mb-20">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black mb-3 text-gray-900">
          🤖 AI-Matched Suppliers
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          We found {suppliers.length} matching suppliers. Tier 1 is prioritized
          by Verified status, Premium partnership, and Local proximity.
        </p>
      </header>

      {/* Tiers Section */}
      {[1, 2, 3, 4].map((tier) => {
        const tierSuppliers = suppliers.filter((s) => s.tier === tier);
        if (tierSuppliers.length === 0) return null;

        return (
          <section key={tier} className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2
                className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded bg-gray-100 ${
                  tier === 1
                    ? "text-green-700 bg-green-100"
                    : tier === 2
                    ? "text-blue-700 bg-blue-100"
                    : "text-gray-500"
                }`}
              >
                {tier === 1
                  ? "⭐ Tier 1: Verified + Premium + Local"
                  : tier === 2
                  ? "Tier 2: High Match Potential"
                  : tier === 3
                  ? "Tier 3: Verified Basic"
                  : "⚠️ Tier 4: In Transition (Verification Required)"}
              </h2>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="grid gap-2">
              {tierSuppliers.map((s: any) => (
                <SupplierCard key={s.id} supplier={s} rfq_id={rfqId} />
              ))}
            </div>
          </section>
        );
      })}

      {suppliers.length === 0 && (
        <div className="text-center p-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">
            No direct matches found. Try adjusting your material requirements.
          </p>
        </div>
      )}
    </div>
  );
}
