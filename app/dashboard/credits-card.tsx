"use client";

import { useEffect, useState } from "react";

export default function CreditsCard({ userId }: { userId: string }) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      // NOTE: Using supabase generic query endpoint or a dedicated user credits endpoint if exists
      // For now we don't have a direct GET /api/credits/[id] endpoint created in the plan.
      // We can use the supabase client directly if RLS allows, or create the endpoint.
      // Assuming RLS allows users to read their own credits.
      // But this component runs on client. We need supabase client.
      // OR we can make a simple server action or just a quick fetch if we had the endpoint.
      // The user's code: fetch(`/api/credits/${userId}`)
      // I did NOT create `app/api/credits/[id]/route.ts`.
      // I should create it or use supabase client here.
      // I will use supabase client for simplicity if I can inject it, but usually standard approach in this code base
      // seems to be API routes for data.
      // I will fetch from a new endpoint `app/api/credits/balance/route.ts` (using session) instead of ID in URL for security.

      try {
        const res = await fetch("/api/credits/balance");
        if (res.ok) {
          const data = await res.json();
          setCredits(data.balance_cents / 100);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
  }, [userId]);

  if (loading)
    return <div className="animate-pulse h-48 bg-gray-100 rounded-lg"></div>;

  const rfqsRemaining = Math.floor(credits / 2);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
      <h3 className="font-bold text-lg mb-2">RFQ Credits</h3>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-bold text-blue-600">
          ${credits.toFixed(2)}
        </span>
        <span className="text-gray-600">= {rfqsRemaining} RFQs @ $2 each</span>
      </div>

      {credits < 4 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <p className="text-sm text-yellow-800">
            Low balance. Refill now to continue sending RFQs.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => (window.location.href = "/dashboard/buy-credits")}
          className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
        >
          Buy More Credits
        </button>
        <button
          onClick={() => (window.location.href = "/pricing")}
          className="flex-1 bg-white text-blue-600 font-semibold py-2 rounded border border-blue-600 hover:bg-blue-50 transition"
        >
          Subscribe Instead
        </button>
      </div>
    </div>
  );
}
