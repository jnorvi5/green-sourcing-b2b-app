"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STRIPE_PRICE_IDS } from "@/lib/stripe/config";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (
    plan: "explorer" | "professional" | "supplier"
  ) => {
    if (plan === "explorer") {
      router.push("/signup?plan=explorer");
      return;
    }

    setLoading(plan);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Not logged in: Redirect to signup with plan param
        router.push(`/signup?plan=${plan}`);
        return;
      }

      // Determine priceId based on plan
      let priceId = "";
      if (plan === "professional") {
        priceId = STRIPE_PRICE_IDS.architect_pro_monthly;
      } else if (plan === "supplier") {
        priceId = STRIPE_PRICE_IDS.supplier_monthly;
      }

      if (!priceId) {
        throw new Error("Invalid plan selected or pricing configuration missing.");
      }

      // Logged in: Initiate Stripe Checkout
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: plan, // 'professional' or 'supplier'
          priceId: priceId,
          userId: session.user.id,
          success_url: `${window.location.origin}/dashboard?success=true`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to start checkout");

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error: unknown) {
      console.error("Subscription error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      alert(errorMessage);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include verified EPD
            data and sustainability certifications.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Explorer</h3>
              <p className="text-gray-600 mb-4">
                For individual professionals exploring sustainable materials
              </p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <button
                onClick={() => handleSubscribe("explorer")}
                className="block w-full py-3 px-6 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Get Started Free
              </button>
            </div>

            <div className="border-t pt-6">
              <p className="font-semibold mb-4">Features:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Search 10,000+ sustainable products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>View basic sustainability data</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="bg-white rounded-lg shadow-2xl p-8 border-4 border-green-600 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              MOST POPULAR
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-600 mb-4">
                For architects and contractors sourcing sustainable materials
              </p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$199</span>
                <span className="text-gray-600">/month</span>
              </div>
              <button
                onClick={() => handleSubscribe("professional")}
                disabled={loading === "professional"}
                className="block w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-75"
              >
                {loading === "professional"
                  ? "Processing..."
                  : "Start Free Trial"}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                14-day free trial, cancel anytime
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="font-semibold mb-4">
                Everything in Explorer, plus:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Full EPD data access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Unlimited RFQ submissions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Carbon footprint calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Autodesk Revit integration</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Supplier Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Supplier</h3>
              <p className="text-gray-600 mb-4">
                For manufacturers and distributors showcasing sustainable
                products
              </p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$299</span>
                <span className="text-gray-600">/month</span>
              </div>
              <button
                onClick={() => handleSubscribe("supplier")}
                disabled={loading === "supplier"}
                className="block w-full py-3 px-6 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-75"
              >
                {loading === "supplier" ? "Processing..." : "Start Free Trial"}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                14-day free trial, cancel anytime
              </p>
            </div>

            <div className="border-t pt-6">
              <p className="font-semibold mb-4">Features:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Showcase unlimited products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>EPD verification badge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Receive qualified RFQs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Section */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Enterprise Solutions</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Need custom integrations, white-label solutions, or serving 50+ team
            members?
          </p>
          <a
            href="mailto:founder@greenchainz.com?subject=Enterprise%20Inquiry"
            className="inline-block py-3 px-8 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Contact Sales
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">
              Can I switch plans later?
            </h3>
            <p className="text-gray-500 text-sm">
              That&apos;s okay! You can upgrade or downgrade your plan at any
              time through your account settings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-700">
              We accept all major credit cards (Visa, MasterCard, Amex) and ACH
              transfers for annual plans.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">
              Is there a discount for annual payments?
            </h3>
            <p className="text-gray-700">
              Yes! Save 20% by paying annually. Professional: $1,910/year (vs
              $2,388), Supplier: $2,870/year (vs $3,588).
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">
              What if I need help getting started?
            </h3>
            <p className="text-gray-700">
              All paid plans include onboarding support. Professional and
              Supplier plans get priority email support, and Enterprise includes
              a dedicated account manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
