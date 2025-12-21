'use client';

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Rfq } from "@/types/rfq";
import { formatShortDate } from "@/lib/utils/formatters";

export default function RespondToRfqPage({
  params,
}: {
  params: { id: string };
}) {
  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    quote_amount: "",
    lead_time_days: "",
    message: "",
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadRfq();
  }, [params.id]);

  async function loadRfq() {
    try {
      const { data, error } = await supabase
        .from("rfqs")
        .select(
          `
          *,
          users (
            full_name,
            company_name
          )
        `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setRfq(data);
    } catch (err: unknown) {
      console.error("Error loading RFQ:", err);
      setError("Failed to load RFQ details");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Get current user & supplier profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!supplier) throw new Error("Supplier profile not found");

      // 2. Submit response
      const { error: submitError } = await supabase
        .from("rfq_responses")
        .insert({
          rfq_id: params.id,
          supplier_id: supplier.id,
          quote_amount: parseFloat(formData.quote_amount),
          lead_time_days: parseInt(formData.lead_time_days),
          message: formData.message,
          status: "submitted",
        });

      if (submitError) throw submitError;

      // 3. Update RFQ status if needed (optional, or handle via trigger)
      // For now, simpler to just redirect

      router.push("/supplier/rfqs");
      router.refresh();
    } catch (err: unknown) {
      console.error("Error submitting quote:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to submit quote";
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (!rfq) return <div className="p-8 text-white">RFQ not found</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2"
        >
          ← Back to RFQs
        </button>

        <h1 className="text-3xl font-bold mb-2">Submit Quote</h1>
        <p className="text-gray-400 mb-8">for {rfq.project_name}</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* RFQ Details */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4 text-teal-400">
              Request Details
            </h2>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-500 mb-1">Material</label>
                <div className="font-medium">
                  {rfq.material_specs.material_type}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 mb-1">Quantity</label>
                  <div className="font-medium">
                    {rfq.material_specs.quantity} {rfq.material_specs.unit}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Deadline</label>
                  <div className="font-medium">
                    {rfq.delivery_deadline
                      ? formatShortDate(rfq.delivery_deadline)
                      : "Flexible"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Location</label>
                <div className="font-medium">{rfq.project_location}</div>
              </div>

              {rfq.message && (
                <div>
                  <label className="block text-gray-500 mb-1">Notes</label>
                  <div className="bg-black/20 p-3 rounded text-gray-300">
                    {rfq.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quote Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Your Offer
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total Price ($) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.quote_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, quote_amount: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-teal-500 outline-none transition"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lead Time (Days) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.lead_time_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lead_time_days: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-teal-500 outline-none transition"
                    placeholder="e.g. 14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Message / Clarifications
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-teal-500 outline-none transition"
                    placeholder="Include details about shipping, availability, etc."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Send Quote"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
