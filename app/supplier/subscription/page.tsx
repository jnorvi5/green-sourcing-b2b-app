"use client";

/**
 * Subscription Management Dashboard
 * Allows suppliers to view and manage their subscription
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionStatusResponse } from "@/types/stripe";

interface BillingHistoryItem {
  id: string;
  stripe_invoice_id?: string;
  amount_cents: number;
  currency: string;
  status: string;
  description?: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created_at: string;
  paid_at?: string;
}

interface BillingHistory {
  invoices: BillingHistoryItem[];
  payments: Array<{
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    description?: string;
    paid_at: string;
  }>;
  success_fee_invoices: Array<{
    id: string;
    amount_cents: number;
    status: string;
    description?: string;
    invoice_pdf_url?: string;
    invoice_hosted_url?: string;
    due_date?: string;
    created_at: string;
  }>;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] =
    useState<SubscriptionStatusResponse | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/stripe/subscription");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subscription");
      }

      setSubscription(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subscription"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBillingHistory = useCallback(async () => {
    setLoadingBilling(true);
    try {
      const response = await fetch("/api/stripe/billing-history");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch billing history");
      }

      setBillingHistory(data);
    } catch (err) {
      console.error("Failed to load billing history:", err);
    } finally {
      setLoadingBilling(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  async function handleManageBilling() {
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          return_url: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create portal session");
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
    }
  }

  async function handleCancelSubscription() {
    setShowCancelModal(false);

    setCanceling(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Refresh subscription data
      await fetchSubscription();
      setError(null);
      // Show success message in UI instead of alert
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setCanceling(false);
    }
  }

  async function handleReactivate() {
    setCanceling(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscription", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reactivate subscription");
      }

      await fetchSubscription();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reactivate subscription"
      );
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "Failed to load subscription"}
          </p>
          <button
            onClick={() => router.push("/supplier/pricing")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  const { limits, usage } = subscription;
  const productsPercent =
    limits.products === "unlimited"
      ? 0
      : (usage!.products_used / limits.products) * 100;
  const rfqsPercent =
    limits.rfqs === "unlimited"
      ? 0
      : (usage!.rfqs_used_this_month / limits.rfqs) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold capitalize">
                {subscription.tier} Plan
              </h2>
              {subscription.has_subscription && (
                <p className="text-gray-600 mt-1">
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {subscription.status}
                  </span>
                </p>
              )}
            </div>
            {subscription.tier !== "free" &&
              subscription.tier !== "verified" && (
                <button
                  onClick={() => router.push("/supplier/pricing")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Upgrade
                </button>
              )}
          </div>

          {subscription.has_subscription && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600">
                  Current period ends:{" "}
                  <span className="font-medium">
                    {new Date(
                      subscription.current_period_end!
                    ).toLocaleDateString()}
                  </span>
                </p>
                {subscription.cancel_at_period_end && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ Your subscription will be canceled at the end of the
                    billing period
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Usage This Month</h3>

          <div className="space-y-6">
            {/* Products */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Product Listings</span>
                <span className="font-medium">
                  {usage!.products_used} /{" "}
                  {limits.products === "unlimited" ? "∞" : limits.products}
                </span>
              </div>
              {limits.products !== "unlimited" && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`progress-bar transition-all duration-300 ${
                      productsPercent >= 100
                        ? "bg-red-500"
                        : productsPercent >= 80
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                    style={productProgressStyle}
                  ></div>
                </div>
              )}
            </div>

            {/* RFQs */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">RFQs Received</span>
                <span className="font-medium">
                  {usage!.rfqs_used_this_month} /{" "}
                  {limits.rfqs === "unlimited" ? "∞" : limits.rfqs}
                </span>
              </div>
              {limits.rfqs !== "unlimited" && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      rfqsPercent >= 100
                        ? "bg-red-500"
                        : rfqsPercent >= 80
                        ? "bg-orange-500"
                        : "bg-green-500"
                    }`}
                    style={rfqProgressStyle}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Your Features</h3>
          <ul className="space-y-2">
            <li className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                {limits.visibility === "premium" ? "Premium" : "Standard"}{" "}
                visibility
              </span>
            </li>
            {limits.analytics && (
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  {limits.analytics === "advanced" ? "Advanced" : "Basic"}{" "}
                  analytics
                </span>
              </li>
            )}
            {limits.verified_badge && (
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Verified badge on profile</span>
              </li>
            )}
            {limits.epd_verifications > 0 && (
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{limits.epd_verifications} EPD verification/month</span>
              </li>
            )}
            {limits.ranking_boost > 1 && (
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{limits.ranking_boost}x search ranking boost</span>
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        {subscription.has_subscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Manage Subscription</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleManageBilling}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Manage Billing
              </button>
              <button
                onClick={() => router.push("/supplier/pricing")}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Change Plan
              </button>
              {subscription.cancel_at_period_end ? (
                <button
                  onClick={handleReactivate}
                  disabled={canceling}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {canceling ? "Processing..." : "Reactivate Subscription"}
                </button>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={canceling}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Use &quot;Manage Billing&quot; to update payment methods, view
              invoices, or change billing details.
            </p>
          </div>
        )}

        {/* Billing History */}
        {subscription.has_subscription && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Billing History</h3>
              <button
                onClick={fetchBillingHistory}
                disabled={loadingBilling}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {loadingBilling ? "Loading..." : "Refresh"}
              </button>
            </div>

            {!billingHistory && !loadingBilling && (
              <button
                onClick={fetchBillingHistory}
                className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
              >
                Load Billing History
              </button>
            )}

            {loadingBilling && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}

            {billingHistory && (
              <div className="space-y-4">
                {billingHistory.invoices.length === 0 &&
                billingHistory.payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No billing history yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {billingHistory.invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(
                                invoice.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {invoice.description || "Subscription payment"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              ${(invoice.amount_cents / 100).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  invoice.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : invoice.status === "open"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {invoice.invoice_pdf && (
                                <a
                                  href={invoice.invoice_pdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 mr-3"
                                >
                                  PDF
                                </a>
                              )}
                              {invoice.hosted_invoice_url && (
                                <a
                                  href={invoice.hosted_invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  View
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!subscription.has_subscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-4">
              You&apos;re currently on the Free plan. Upgrade to unlock more
              features!
            </p>
            <button
              onClick={() => router.push("/supplier/pricing")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Pricing Plans
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You will retain
              access until the end of your billing period on{" "}
              <span className="font-medium">
                {subscription.current_period_end
                  ? new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()
                  : "your billing period ends"}
              </span>
              .
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={canceling}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {canceling ? "Canceling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
