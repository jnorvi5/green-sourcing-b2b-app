'use client';

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatShortDate } from "@/lib/utils/formatters";
import type { Rfq } from "@/types/rfq";

export default function ArchitectRfqsPage() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadRfqs();
  }, []);

  async function loadRfqs() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("rfqs")
        .select(
          `
          *,
          quotes:rfq_responses(count)
        `
        )
        .eq("architect_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRfqs(data || []);
    } catch (err) {
      console.error("Error loading RFQs:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Requests</h1>
            <p className="text-gray-400">
              Manage your active RFQs and view quotes
            </p>
          </div>
          <Link
            href="/architect/rfq/new"
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition"
          >
            + New RFQ
          </Link>
        </div>

        {rfqs.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-xl font-medium mb-4">No RFQs yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first request to start getting quotes from suppliers.
            </p>
            <Link
              href="/architect/rfq/new"
              className="text-green-400 hover:text-green-300 underline"
            >
              Create New RFQ
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {rfqs.map((rfq: Record<string, unknown>) => (
              <Link
                key={rfq.id}
                href={`/architect/rfqs/${rfq.id}`}
                className="block p-6 bg-white/5 border border-white/10 rounded-xl hover:border-green-500/50 transition group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-green-400 transition">
                      {rfq.project_name}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>{rfq.material_specs.material_type}</span>
                      <span>•</span>
                      <span>
                        {rfq.material_specs.quantity} {rfq.material_specs.unit}
                      </span>
                      <span>•</span>
                      <span>
                        Deadline: {formatShortDate(rfq.delivery_deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                      ${
                        rfq.status === "open" || rfq.status === "pending"
                          ? "bg-green-500/20 text-green-400"
                          : ""
                      }
                      ${
                        rfq.status === "closed"
                          ? "bg-gray-700 text-gray-300"
                          : ""
                      }
                    `}
                    >
                      {rfq.status}
                    </span>
                    <span className="text-sm text-gray-400">
                      {rfq.quotes?.[0]?.count || 0} Quotes
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
