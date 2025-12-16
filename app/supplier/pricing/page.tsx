'use client';

'use client';

/**
 * Pricing Page
 * Displays subscription tiers and upgrade buttons
 */

import { useState } from 'react';
// Unused: import { useRouter } from 'next/navigation';
import { TIER_LIMITS, TIER_PRICES } from '@/types/stripe';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FiCheck } from 'react-icons/fi';

export default function PricingPage() {
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
      description: 'For suppliers just getting started with sustainable sourcing visibility.',
      features: [
        '1 product listing',
        '3 RFQs per month',
        'Standard visibility',
        'Basic support',
      ],
      cta: 'Current Plan',
      variant: 'outline' as const,
      disabled: true,
    },
    {
      name: 'Standard',
      price: TIER_PRICES.standard / 100,
      tier: 'standard' as const,
      limits: TIER_LIMITS.standard,
      description: 'For growing suppliers who need more exposure and analytics.',
      features: [
        '10 product listings',
        'Unlimited RFQs',
        'Standard visibility',
        'Basic analytics',
        'Priority support',
      ],
      cta: 'Upgrade to Standard',
      variant: 'secondary' as const,
      popular: false,
    },
    {
      name: 'Verified User',
      price: TIER_PRICES.verified / 100,
      tier: 'verified' as const,
      limits: TIER_LIMITS.verified,
      description: 'For enterprise suppliers requiring top-tier verification and reach.',
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
      variant: 'default' as const,
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that best fits your business needs. Upgrade, downgrade, or cancel at any time.
            </p>
          </div>

          {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier) => (
              <Card 
                key={tier.name} 
                className={`relative flex flex-col ${
                  tier.popular ? 'border-primary shadow-lg scale-105' : 'border-border shadow-sm'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <CardDescription className="text-sm mt-2">{tier.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col items-center">
                  <div className="my-6 text-center">
                    <span className="text-4xl font-extrabold">${tier.price}</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>

                  <ul className="space-y-4 w-full px-4 mb-4">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <FiCheck className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground text-left">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2 pb-8 px-6">
                  <Button
                    onClick={() => tier.tier !== 'free' && handleUpgrade(tier.tier)}
                    disabled={tier.disabled || loading === tier.tier}
                    variant={tier.variant}
                    className="w-full"
                    size="lg"
                  >
                    {loading === tier.tier ? 'Processing...' : tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center text-muted-foreground">
            <p>All plans include secure payment processing and can be canceled anytime.</p>
            <p className="mt-2">
              Questions?{' '}
              <a href="mailto:support@greenchainz.com" className="text-primary hover:underline">
                Contact our sales team
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
