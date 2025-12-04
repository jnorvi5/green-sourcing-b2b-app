'use client';

/**
 * Subscription Management Dashboard
 * Allows suppliers to view and manage their subscription
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriptionStatusResponse } from '@/types/stripe';

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const response = await fetch('/api/stripe/subscription');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setCanceling(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
      alert('Subscription canceled successfully. You will retain access until the end of your billing period.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  }

  async function handleReactivate() {
    setCanceling(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }

      await fetchSubscription();
      alert('Subscription reactivated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
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
          <p className="text-red-600 mb-4">{error || 'Failed to load subscription'}</p>
          <button
            onClick={() => router.push('/supplier/pricing')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Pricing
          </button>
        </div>
      </div>
    );
  }

  const { limits, usage } = subscription;
  const productsPercent = limits.products === 'unlimited' ? 0 : (usage!.products_used / limits.products) * 100;
  const rfqsPercent = limits.rfqs === 'unlimited' ? 0 : (usage!.rfqs_used_this_month / limits.rfqs) * 100;

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
              <h2 className="text-2xl font-bold capitalize">{subscription.tier} Plan</h2>
              {subscription.has_subscription && (
                <p className="text-gray-600 mt-1">
                  Status: <span className="font-medium capitalize">{subscription.status}</span>
                </p>
              )}
            </div>
            {subscription.tier !== 'free' && subscription.tier !== 'verified' && (
              <button
                onClick={() => router.push('/supplier/pricing')}
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
                  Current period ends:{' '}
                  <span className="font-medium">
                    {new Date(subscription.current_period_end!).toLocaleDateString()}
                  </span>
                </p>
                {subscription.cancel_at_period_end && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ Your subscription will be canceled at the end of the billing period
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
                  {usage!.products_used} / {limits.products === 'unlimited' ? '∞' : limits.products}
                </span>
              </div>
              {limits.products !== 'unlimited' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      productsPercent >= 100 ? 'bg-red-500' : productsPercent >= 80 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(productsPercent, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* RFQs */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">RFQs Received</span>
                <span className="font-medium">
                  {usage!.rfqs_used_this_month} / {limits.rfqs === 'unlimited' ? '∞' : limits.rfqs}
                </span>
              </div>
              {limits.rfqs !== 'unlimited' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      rfqsPercent >= 100 ? 'bg-red-500' : rfqsPercent >= 80 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(rfqsPercent, 100)}%` }}
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
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{limits.visibility === 'premium' ? 'Premium' : 'Standard'} visibility</span>
            </li>
            {limits.analytics && (
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{limits.analytics === 'advanced' ? 'Advanced' : 'Basic'} analytics</span>
              </li>
            )}
            {limits.verified_badge && (
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Verified badge on profile</span>
              </li>
            )}
            {limits.epd_verifications > 0 && (
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{limits.epd_verifications} EPD verification/month</span>
              </li>
            )}
            {limits.ranking_boost > 1 && (
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{limits.ranking_boost}x search ranking boost</span>
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
        {subscription.has_subscription && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Manage Subscription</h3>
            {subscription.cancel_at_period_end ? (
              <button
                onClick={handleReactivate}
                disabled={canceling}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {canceling ? 'Processing...' : 'Reactivate Subscription'}
              </button>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {canceling ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Canceling will retain your access until the end of the current billing period
            </p>
          </div>
        )}

        {!subscription.has_subscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-4">
              You're currently on the Free plan. Upgrade to unlock more features!
            </p>
            <button
              onClick={() => router.push('/supplier/pricing')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Pricing Plans
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
