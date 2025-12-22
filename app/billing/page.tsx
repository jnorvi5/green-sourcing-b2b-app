"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: "free" | "architect" | "enterprise") => {
    // Free tier - redirect to signup
    if (tier === "free") {
      router.push("/signup?plan=free");
      return;
    }

    // Enterprise tier - open email client
    if (tier === "enterprise") {
      window.location.href = "mailto:sales@greenchainz.com?subject=Enterprise Plan Inquiry";
      return;
    }

    // Architect tier - proceed with Stripe checkout
    setLoading(tier);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      // Redirect to login if not authenticated
      if (authError || !user) {
        router.push("/login?redirect=/billing");
        return;
      }

      // Call Stripe checkout API
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      alert(errorMessage);
      setLoading(null);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for exploring sustainable materials",
      features: [
        "5 RFQs per month",
        "Read-only material data",
        "Basic EPD access",
        "Email support",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      id: "architect",
      name: "Architect",
      price: "$49",
      period: "per month",
      description: "For professionals who need full access",
      features: [
        "Unlimited RFQs",
        "Full database access",
        "10 audit credits per month",
        "Advanced EPD search",
        "Priority support",
        "Export capabilities",
      ],
      cta: "Subscribe Now",
      highlighted: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For teams and large organizations",
      features: [
        "Everything in Architect",
        "White-label solutions",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantees",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start building sustainably today.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-8 ${
                tier.highlighted
                  ? "bg-green-600 text-white shadow-2xl scale-105 border-4 border-green-500"
                  : "bg-white text-gray-900 shadow-lg border-2 border-gray-200"
              } transition-all duration-300 hover:shadow-xl`}
            >
              {tier.highlighted && (
                <div className="mb-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    tier.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`text-sm ${
                    tier.highlighted ? "text-green-100" : "text-gray-600"
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span
                    className={`text-5xl font-bold ${
                      tier.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`ml-2 text-sm ${
                      tier.highlighted ? "text-green-100" : "text-gray-600"
                    }`}
                  >
                    {tier.period}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(tier.id as "free" | "architect" | "enterprise")}
                disabled={loading === tier.id}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 mb-6 ${
                  tier.highlighted
                    ? "bg-white text-green-600 hover:bg-green-50"
                    : "bg-green-600 text-white hover:bg-green-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === tier.id ? "Loading..." : tier.cta}
              </button>

              <div className="space-y-3">
                {tier.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        tier.highlighted ? "text-green-300" : "text-green-600"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        tier.highlighted ? "text-green-50" : "text-gray-700"
                      }`}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Trusted by architects and contractors worldwide
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              Secure payments
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              No hidden fees
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
