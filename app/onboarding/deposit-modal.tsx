"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]!
);

export default function DepositModal({ userId: _userId }: { userId: string }) {
  const [selected, setSelected] = useState<"deposit" | "skip" | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const router = useRouter();

  const handleDepositClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: 5000, // $50
          purchase_type: "deposit",
        }),
      });

      if (!res.ok) throw new Error("Failed to init deposit");

      const { client_secret } = await res.json();
      setClientSecret(client_secret);
      setSelected("deposit");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setSelected("skip");
    router.push("/dashboard");
  };

  if (selected === "deposit" && clientSecret) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="p-4">
          <button
            onClick={() => setSelected(null)}
            className="mb-4 text-gray-500 hover:text-gray-900"
          >
            &larr; Back
          </button>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">
          Get Started with GreenChainz
        </h2>

        <p className="text-gray-600 mb-6">
          Choose how you want to use our platform:
        </p>

        <div className="space-y-4">
          {/* Deposit Option */}
          <button
            onClick={handleDepositClick}
            disabled={loading}
            className="w-full border-2 border-green-500 rounded-lg p-6 hover:bg-green-50 transition text-left group"
          >
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-green-700">
                🎯 Pay $50 Deposit
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Commit to quality leads. Get immediate access to 25 RFQs.
              </p>
              <p className="text-xs text-green-600 font-bold uppercase tracking-wide">
                Best for serious architects
              </p>
            </div>
          </button>

          {/* Pay-Per-RFQ Option */}
          <button
            onClick={handleSkip}
            className="w-full border-2 border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition text-left group"
          >
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-gray-800">
                💳 Pay Per RFQ ($2 each)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Try it out. Only pay when you send RFQs.
              </p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                No commitment needed
              </p>
            </div>
          </button>

          {/* Subscribe Option */}
          <button
            onClick={() => router.push("/pricing")}
            className="w-full border-2 border-blue-500 rounded-lg p-6 hover:bg-blue-50 transition text-left group"
          >
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-700">
                📦 Subscribe ($99/mo)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Unlimited RFQs + priority support + LCA export.
              </p>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                Best for volume buyers
              </p>
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          You can upgrade or change plans anytime
        </p>
      </div>
    </div>
  );
}
