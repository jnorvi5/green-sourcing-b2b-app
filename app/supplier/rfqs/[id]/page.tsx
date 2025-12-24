"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import RFQChatButton from "@/app/components/rfq-chat-button";
import { createClient } from "@/lib/supabase/client";
import type { RfqWithResponse } from "@/types/rfq";
import {
  formatMaterialType,
  formatShortDate,
  getDeadlineUrgencyColor,
  getDeadlineUrgencyIcon,
} from "@/lib/utils/formatters";
import QuoteSubmissionForm from "@/components/QuoteSubmissionForm";

export default function SupplierRFQDetail() {
  const params = useParams();
  const rfqId = params?.["id"] as string;
  const router = useRouter();
  const supabase = createClient();

  interface DraftResponse {
    matched_products: Array<{ product_id: string; product_name: string }>;
    estimated_total: number;
    lca_summary: string;
    draft_message: string;
  }

  const [rfq, setRfq] = useState<RfqWithResponse | null>(null);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAIDraft = async () => {
    setDrafting(true);
    try {
      const res = await fetch("/api/agent/draft-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfq_id: rfqId }),
      });

      const data = await res.json();
      setDraft(data);
    } catch (err) {
      alert("AI Drafting failed");
    } finally {
      setDrafting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center animate-pulse">
        Loading RFQ details...
      </div>
    );
  }

  if (!rfq) {
    return <div className="p-10 text-center text-red-500">RFQ not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 mb-20">
      <header className="flex justify-between items-center mb-10 pb-6 border-b">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200`}
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
          <h1 className="text-3xl font-black text-gray-900">
            {rfq.project_name}
          </h1>
          <p className="text-gray-500">
            {rfq.users?.company_name || rfq.users?.full_name || "Architect"} •{" "}
            {rfq.project_location}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <RFQChatButton rfq_id={rfqId} user_role="supplier" />
          {rfq.rfq_response ? (
            <div className="px-6 py-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <p className="text-sm text-blue-800 mb-1">Quote Submitted</p>
              <p className="text-2xl font-bold text-blue-900">
                ${rfq.rfq_response.quote_amount.toLocaleString()}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowQuoteModal(true)}
              disabled={rfq.status === "closed" || rfq.status === "expired"}
              className={`
                   px-6 py-3 rounded-xl font-bold text-lg shadow-md transition transform hover:-translate-y-1
                   ${
                     rfq.status === "closed" || rfq.status === "expired"
                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                       : "bg-teal-600 hover:bg-teal-500 text-white"
                   }
                 `}
            >
              {rfq.status === "closed" ? "RFQ Closed" : "Submit Quote"}
            </button>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">
              Requirements
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Material Type
                </p>
                <p className="font-semibold">
                  {formatMaterialType(rfq.material_specs.material_type)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Quantity Needed
                </p>
                <p className="font-semibold">
                  {rfq.material_specs.quantity.toLocaleString()}{" "}
                  <span className="text-gray-400 text-sm">
                    {rfq.material_specs.unit}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Budget Range
                </p>
                <p className="font-semibold text-green-700">
                  {rfq.budget_range}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Required Certifications
                </p>
                <div className="flex flex-wrap gap-1">
                  {rfq.required_certifications.length > 0 ? (
                    rfq.required_certifications.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full border border-emerald-100"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 font-semibold">
                      None specific
                    </span>
                  )}
                </div>
              </div>
            </div>
            {rfq.message && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Additional Message
                </p>
                <p className="text-gray-700 italic">
                  &quot;{rfq.message}&quot;
                </p>
              </div>
            )}
          </section>

          {draft && (
            <section className="bg-purple-50 ring-2 ring-purple-200 p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-purple-900">
                  🤖 AI-Generated Draft
                </h2>
                <span className="bg-purple-200 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                  GPT-4o Enhanced
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-purple-800 mb-2">
                    Recommended Matching Products:
                  </h3>
                  <div className="grid gap-2">
                    {draft.matched_products.map((p) => (
                      <div
                        key={p.product_id}
                        className="bg-white/50 p-3 rounded-xl flex justify-between items-center border border-purple-100"
                      >
                        <span className="font-bold">{p.product_name}</span>
                        <span className="text-xs bg-purple-100 px-2 py-1 rounded font-bold">
                          Match found
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-400 uppercase mb-1">
                      Est. Total
                    </p>
                    <p className="text-2xl font-black text-green-600">
                      ${draft.estimated_total.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-purple-100">
                    <p className="text-xs font-bold text-purple-400 uppercase mb-1">
                      Environmental Impact
                    </p>
                    <p className="text-sm font-medium line-clamp-2">
                      {draft.lca_summary}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-purple-800 mb-2">
                    Draft Quote Message:
                  </h3>
                  <textarea
                    className="w-full p-4 bg-white border border-purple-100 rounded-2xl h-48 focus:ring-2 focus:ring-purple-500 outline-none text-sm transition"
                    defaultValue={draft.draft_message}
                    aria-label="Draft Quote Message"
                  />
                </div>

                <button className="w-full py-4 bg-purple-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition active:scale-[0.99]">
                  Review & Send Detailed Quote →
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-2xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-400">🤖</span> AI Copilot
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Let our AI agent analyze the architect&apos;s request and your
              product catalog to draft the perfect response.
            </p>
            <button
              onClick={handleAIDraft}
              disabled={drafting}
              className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-purple-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {drafting ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                "Generate Smart Draft"
              )}
            </button>
          </div>

          <div className="p-6 border border-gray-200 rounded-2xl space-y-4">
            <h3 className="font-bold">Project Contact</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                A
              </div>
              <div>
                <p className="font-bold text-sm">Lead Architect</p>
                <p className="text-xs text-gray-500">
                  {rfq.users?.company_name || "Company Confidential"}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 pt-4 border-t border-dashed">
              Verified architects have direct access to your EPD data.
            </p>
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
    </div>
  );
}
