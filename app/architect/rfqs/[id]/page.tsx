"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatShortDate } from "@/lib/utils/formatters";
import type { Rfq, RfqResponse } from "@/types/rfq";

export default function ArchitectRfqDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [quotes, setQuotes] = useState<RfqResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from("rfqs")
        .select("*, projects(id, name)")
        .eq("id", params.id)
        .single();

      if (rfqError) throw rfqError;
      setRfq(rfqData);

      // 2. Fetch Quotes with Suppliers
      const { data: quotesData, error: quotesError } = await supabase
        .from("rfq_responses")
        .select(
          `
          *,
          supplier:suppliers (
            company_name,
            tier,
            verification_status
          )
        `
        )
        .eq("rfq_id", params.id)
        .order("quote_amount", { ascending: true }); // Best price first

      if (quotesError) throw quotesError;
      setQuotes(quotesData || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleStatusUpdate(
    quoteId: string,
    newStatus: "accepted" | "rejected"
  ) {
    try {
      // Update the specific quote status
      const { error } = await supabase
        .from("rfq_responses")
        .update({ status: newStatus })
        .eq("id", quoteId);

      if (error) throw error;

      // If accepted, close the RFQ
      if (newStatus === "accepted") {
        const { error: rfqError } = await supabase
          .from("rfqs")
          .update({ status: "closed" })
          .eq("id", params.id);

        if (rfqError) throw rfqError;
      }

      // Reload data to reflect changes
      loadData();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!rfq) return <div className="p-8 text-white">RFQ not found</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/architect/rfqs"
          className="text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Back to Requests
        </Link>

        {rfq.projects && (
          <Link
            href={`/projects/${rfq.projects.id}`}
            className="text-teal-400 hover:text-teal-300 mb-6 ml-4 inline-block"
          >
            Go to Project: {rfq.projects.name} →
          </Link>
        )}

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{rfq.project_name}</h1>
            <div className="flex gap-4 text-gray-400">
              <span>{rfq.project_location}</span>
              <span>•</span>
              <span className="uppercase">{rfq.status}</span>
            </div>
          </div>
          {rfq.status !== "closed" && (
            <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg border border-green-500/20">
              Open for Quotes
            </div>
          )}
        </div>

        {/* Specs Summary */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 grid md:grid-cols-4 gap-6">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Material</label>
            <div className="font-semibold">
              {rfq.material_specs.material_type}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Quantity</label>
            <div className="font-semibold">
              {rfq.material_specs.quantity} {rfq.material_specs.unit}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Delivery</label>
            <div className="font-semibold">
              {formatShortDate(rfq.delivery_deadline)}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Budget</label>
            <div className="font-semibold">
              {rfq.budget_range || "Not specified"}
            </div>
          </div>
        </div>

        {/* Quotes List */}
        <h2 className="text-2xl font-bold mb-6">
          Received Quotes ({quotes.length})
        </h2>

        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 text-gray-400">
              No quotes received yet.
            </div>
          ) : (
            quotes.map((quote) => (
              <div
                key={quote.id}
                className={`p-6 rounded-xl border transition
                  ${
                    quote.status === "accepted"
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  }
                `}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  {/* Supplier Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">
                        ${quote.quote_amount.toLocaleString()}
                      </h3>
                      {quote.status === "accepted" && (
                        <span className="bg-green-500 text-black text-xs font-bold px-2 py-1 rounded">
                          ACCEPTED
                        </span>
                      )}
                      {quote.status === "rejected" && (
                        <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded">
                          REJECTED
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-medium mb-1">
                      {quote.supplier?.company_name}
                    </div>
                    <div className="text-sm text-gray-400">
                      Lead time: {quote.lead_time_days} days •{" "}
                      {formatShortDate(quote.responded_at)}
                    </div>
                    {quote.message && (
                      <div className="mt-4 p-3 bg-black/20 rounded text-sm text-gray-300">
                        &ldquo;{quote.message}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {rfq.status !== "closed" && quote.status === "submitted" && (
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => handleStatusUpdate(quote.id, "rejected")}
                        className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(quote.id, "accepted")}
                        className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition text-sm font-bold shadow-lg shadow-green-900/20"
                      >
                        Accept Quote
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
