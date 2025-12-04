'use client';

/**
 * Pricing Page
 * Displays subscription tiers and upgrade buttons
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TIER_LIMITS, TIER_PRICES } from '@/types/stripe';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(tier: 'standard' | 'verified') {
    setLoading(tier);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  }

  const tiers = [
    {
      name: 'Free',
      price: 0,
      tier: 'free' as const,
      limits: TIER_LIMITS.free,
      features: [
        '1 product listing',
        '3 RFQs per month',
        'Standard visibility',
        'Basic support',
      ],
      cta: 'Current Plan',
      disabled: true,
    },
    {
      name: 'Standard',
      price: TIER_PRICES.standard / 100,
      tier: 'standard' as const,
      limits: TIER_LIMITS.standard,
      features: [
        '10 product listings',
        'Unlimited RFQs',
        'Standard visibility',
        'Basic analytics',
        'Priority support',
      ],
      cta: 'Upgrade to Standard',
      popular: false,
    },
    {
      name: 'Verified',
      price: TIER_PRICES.verified / 100,
      tier: 'verified' as const,
      limits: TIER_LIMITS.verified,
      features: [
        'Unlimited product listings',
        'Unlimited RFQs',
        '2x Premium visibility boost',
        'Advanced analytics',
        '1 EPD verification/month',
        'Verified badge on profile',
        'Dedicated support',
      ],
      cta: 'Upgrade to Verified',
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Scale your sustainable sourcing business with the right tier
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                tier.popular ? 'ring-2 ring-blue-600 relative' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold mb-2">
                  ${tier.price}
                  <span className="text-lg text-gray-500">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
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
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => tier.tier !== 'free' && handleUpgrade(tier.tier)}
                disabled={tier.disabled || loading === tier.tier}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  tier.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === tier.tier ? 'Processing...' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>All plans include secure payment processing and can be canceled anytime.</p>
          <p className="mt-2">
            Questions?{' '}
            <a href="mailto:support@greenchainz.com" className="text-blue-600 hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
