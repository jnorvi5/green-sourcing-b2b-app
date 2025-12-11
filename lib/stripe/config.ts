/**
 * Stripe Configuration
 * Centralized Stripe setup and tier definitions
 */

import Stripe from 'stripe';

// Lazily initialize Stripe to avoid build-time errors when env vars are missing
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    });
  }
  return _stripe;
}

// For backward compatibility, provide a getter
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get subscriptions() { return getStripe().subscriptions; },
  get webhooks() { return getStripe().webhooks; },
};

// Stripe Price IDs (set these from your Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  standard_monthly: process.env.STRIPE_PRICE_STANDARD || 'price_standard_monthly',
  verified_monthly: process.env.STRIPE_PRICE_VERIFIED || 'price_verified_monthly',
} as const;

// Webhook signing secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Base URLs
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// Success and cancel URLs
export const getSuccessUrl = (sessionId: string) =>
  `${BASE_URL}/supplier/success?session_id=${sessionId}`;

export const getCancelUrl = () => `${BASE_URL}/supplier/pricing`;
