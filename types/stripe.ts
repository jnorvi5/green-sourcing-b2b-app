/*export type Tier = 'free' | 'pro' | 'premium'

export interface TierPrice {
  monthlyUsd: number
  annualUsd?: number
}

export interface TierLimits {
  maxProducts?: number
  maxTeamSeats?: number
  maxRfqsPerMonth?: number
  analytics?: boolean
  prioritySupport?: boolean
}

export const TIER_PRICES: Record<Tier, TierPrice> = {
  free: { monthlyUsd: 0 },
  pro: { monthlyUsd: 199, annualUsd: 199 * 12 * 0.9 }, // adjust if your pricing differs
  premium: { monthlyUsd: 499, annualUsd: 499 * 12 * 0.9 } // adjust if your pricing differs
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: { maxProducts: 25, maxTeamSeats: 1, maxRfqsPerMonth: 5, analytics: false, prioritySupport: false },
  pro: { maxProducts: 250, maxTeamSeats: 5, maxRfqsPerMonth: 50, analytics: true, prioritySupport: true },
  premium: { maxProducts: undefined, maxTeamSeats: 20, maxRfqsPerMonth: undefined, analytics: true, prioritySupport: true }
}*
 * TypeScript types for Stripe subscription billing
 */

// ============================================
// Subscription Tiers
// ============================================

export type SubscriptionTier = 'free' | 'standard' | 'verified';

export interface SubscriptionLimits {
  products: number | 'unlimited';
  rfqs: number | 'unlimited';
  visibility: 'standard' | 'premium';
  analytics: 'basic' | 'advanced' | null;
  epd_verifications: number;
  verified_badge: boolean;
  ranking_boost: number; // Multiplier for search ranking
}

export const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    products: 1,
    rfqs: 3,
    visibility: 'standard',
    analytics: null,
    epd_verifications: 0,
    verified_badge: false,
    ranking_boost: 1,
  },
  standard: {
    products: 10,
    rfqs: 'unlimited',
    visibility: 'standard',
    analytics: 'basic',
    epd_verifications: 0,
    verified_badge: false,
    ranking_boost: 1,
  },
  verified: {
    products: 'unlimited',
    rfqs: 'unlimited',
    visibility: 'premium',
    analytics: 'advanced',
    epd_verifications: 1,
    verified_badge: true,
    ranking_boost: 2,
  },
};

export const TIER_PRICES = {
  free: 0,
  standard: 9900, // $99.00 in cents
  verified: 29900, // $299.00 in cents
} as const;

// ============================================
// Database Types
// ============================================

export interface Subscription {
  id: string;
  supplier_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier: SubscriptionTier;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  supplier_id?: string;
  subscription_id?: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  amount_cents: number;
  currency: string;
  status: string;
  tier: SubscriptionTier;
  description?: string;
  paid_at: string;
}

export interface SupplierWithSubscription {
  id: string;
  name: string;
  tier: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  upgraded_at?: string;
  product_limit: number;
  rfq_limit: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateCheckoutRequest {
  tier: 'standard' | 'verified'; // Can't checkout for free tier
  success_url?: string;
  cancel_url?: string;
}

export interface CreateCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean;
  tier: SubscriptionTier;
  status?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  limits: SubscriptionLimits;
  usage?: {
    products_used: number;
    rfqs_used_this_month: number;
  };
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  cancel_at_period_end: boolean;
  period_end?: string;
}

// ============================================
// Stripe Webhook Types
// ============================================

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface CheckoutSessionCompleted {
  id: string;
  customer: string;
  subscription: string;
  metadata: {
    supplier_id: string;
    tier: SubscriptionTier;
  };
}

export interface InvoicePaid {
  id: string;
  customer: string;
  subscription: string;
  amount_paid: number;
  currency: string;
  status: string;
}

export interface SubscriptionDeleted {
  id: string;
  customer: string;
  status: string;
}

// ============================================
// Analytics Types
// ============================================

export interface MRRByTier {
  tier: SubscriptionTier;
  subscriber_count: number;
  mrr_cents: number;
}

export interface ChurnMetrics {
  churned_count: number;
  total_paid_suppliers: number;
  churn_rate_percent: number;
}

export interface RevenueMetrics {
  mrr_total: number;
  mrr_by_tier: MRRByTier[];
  churn: ChurnMetrics;
  new_subscribers_30d: number;
  total_revenue_30d: number;
}

// ============================================
// Error Types
// ============================================

export class StripeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

export class SubscriptionLimitError extends Error {
  constructor(
    message: string,
    public limit: keyof SubscriptionLimits,
    public current: number,
    public max: number | 'unlimited'
  ) {
    super(message);
    this.name = 'SubscriptionLimitError';
  }
}
