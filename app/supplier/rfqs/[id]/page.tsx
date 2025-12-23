"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { RfqWithResponse } from "@/types/rfq";
import {
  formatMaterialType,
  formatShortDate,
  getDeadlineUrgencyColor,
  getDeadlineUrgencyIcon,
} from "@/lib/utils/formatters";
import QuoteSubmissionForm from "@/components/QuoteSubmissionForm";

export default function RfqDetailPage() {
  const [rfq, setRfq] = useState<RfqWithResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const rfqId = params?.["id"] as string;

  useEffect(() => {
    loadRfqDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId]);

  async function loadRfqDetails() {
    try {
      // Check auth
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push("/login");
        return;
      }

      // Get supplier ID
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", authUser.id)
        .single();

      if (supplierError || !supplierData) {
        router.push("/supplier/dashboard");
        return;
      }
      // setSupplierId(supplierData.id);

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from("rfqs")
        .select(
          `
          *,
          users!rfqs_architect_id_fkey(
            id,
            email,
            role,
            full_name,
            company_name
          )
        `
        )
        .eq("id", rfqId)
        .single();

      if (rfqError || !rfqData) {
        console.error("Error fetching RFQ:", rfqError);
        router.push("/supplier/rfqs");
        return;
      }

      // Check if supplier is matched
      const isMatched = rfqData.matched_suppliers?.includes(supplierData.id);
      if (!isMatched) {
        // Optionally redirect or show unauthorized message if strict access control is needed
        // For now, allowing view but maybe disable actions if not matched?
        // But logic says they see what's in their list.
      }

      // Fetch existing response
      const { data: responseData } = await supabase
        .from("rfq_responses")
        .select("*")
        .eq("rfq_id", rfqId)
        .eq("supplier_id", supplierData.id)
        .maybeSingle();

      const enrichedRfq: RfqWithResponse = {
        ...rfqData,
        rfq_response: responseData || null,
        is_new: false, // Not relevant for detail view
      };

      setRfq(enrichedRfq);
    } catch (error) {
      console.error("Error loading RFQ details:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">RFQ not found.</p>
          <Link href="/supplier/rfqs" className="text-teal-400 hover:underline">
            Back to RFQs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white pb-20">
      {/* Navbar Placeholder / Back Button */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link
            href="/supplier/rfqs"
            className="inline-flex items-center text-gray-400 hover:text-white transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to RFQ Inbox
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300 border border-white/10`}
              >
                RFQ #{rfq.id.slice(0, 8).toUpperCase()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getDeadlineUrgencyColor(
                  rfq.delivery_deadline
                )}`}
              >
                {getDeadlineUrgencyIcon(rfq.delivery_deadline)} Due{" "}
                {formatShortDate(rfq.delivery_deadline)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {rfq.project_name}
            </h1>
            <p className="text-xl text-gray-400">
              {rfq.users?.company_name || rfq.users?.full_name || "Architect"} •{" "}
              {rfq.project_location}
            </p>
          </div>

          <div className="flex-shrink-0">
            {rfq.rfq_response ? (
              <div className="px-6 py-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                <p className="text-sm text-blue-300 mb-1">Quote Submitted</p>
                <p className="text-2xl font-bold text-white">
                  ${rfq.rfq_response.quote_amount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  on {formatShortDate(rfq.rfq_response.responded_at)}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowQuoteModal(true)}
                disabled={rfq.status === "closed" || rfq.status === "expired"}
                className={`
                   px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-teal-500/20 transition transform hover:-translate-y-1
                   ${
                     rfq.status === "closed" || rfq.status === "expired"
                       ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                       : "bg-teal-500 hover:bg-teal-400 text-black"
                   }
                 `}
              >
                {rfq.status === "closed" ? "RFQ Closed" : "Submit Quote"}
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Material Specs */}
            <section className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-teal-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Material Requirements
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Material Type</p>
                  <p className="text-lg font-medium">
                    {formatMaterialType(rfq.material_specs.material_type)}
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Quantity Needed</p>
                  <p className="text-lg font-medium">
                    {rfq.material_specs.quantity.toLocaleString()}{" "}
                    <span className="text-gray-400 text-base">
                      {rfq.material_specs.unit}
                    </span>
                  </p>
                </div>
              </div>

              {/* Additional Specs if any */}
              {Object.keys(rfq.material_specs).length > 2 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Additional Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(rfq.material_specs)
                      .filter(
                        ([key]) =>
                          !["quantity", "unit", "material_type"].includes(key)
                      )
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between border-b border-white/5 pb-2"
                        >
                          <span className="text-gray-400 capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* Project Context */}
            <section className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-teal-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Project Details & Message
              </h2>

              {rfq.message && (
                <div className="bg-black/20 p-4 rounded-lg mb-6">
                  <p className="text-gray-400 italic">
                    &quot;{rfq.message}&quot;
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400">Budget Range</span>
                  <span className="text-white font-medium">
                    {rfq.budget_range || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400">Delivery Deadline</span>
                  <span className="text-white font-medium">
                    {formatShortDate(rfq.delivery_deadline)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400">Required Certifications</span>
                  <div className="flex gap-2">
                    {rfq.required_certifications.length > 0 ? (
                      rfq.required_certifications.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">None specific</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Status / Quote Info */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">RFQ Status</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Current State</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                      rfq.rfq_response
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : rfq.status === "closed"
                        ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}
                  >
                    {rfq.rfq_response ? "QUOTED" : rfq.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <p className="text-gray-500 text-sm mb-1">Your Match Score</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                    <div className="bg-teal-500 h-2.5 rounded-full"></div>
                  </div>
                  <p className="text-right text-xs text-teal-400 font-bold">
                    {rfq.match_score || 0}% Match
                  </p>
                </div>

                <hr className="border-white/10" />

                <div>
                  <p className="text-gray-400 text-sm">
                    Need help?{" "}
                    <a href="#" className="text-teal-400 hover:underline">
                      Contact Support
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <QuoteSubmissionForm
            rfqId={rfq.id}
            onSuccess={() => {
              setShowQuoteModal(false);
              loadRfqDetails();
            }}
            onCancel={() => setShowQuoteModal(false)}
          />
        </div>
      )}
    </main>
  );
}
