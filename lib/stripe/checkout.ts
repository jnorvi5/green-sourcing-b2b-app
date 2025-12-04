/**
 * Stripe Checkout Service
 * Handles creation of Stripe Checkout sessions for subscription upgrades
 */

import { stripe, STRIPE_PRICE_IDS, getSuccessUrl, getCancelUrl } from './config';
import { createClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from '@/types/stripe';

/**
 * Create Stripe Checkout session for subscription upgrade
 */
export async function createCheckoutSession(
  supplierId: string,
  tier: 'standard' | 'verified',
  options?: {
    successUrl?: string;
    cancelUrl?: string;
  }
): Promise<{ url: string; sessionId: string }> {
  // Get supplier details
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('id, name, user_id, stripe_customer_id')
    .eq('id', supplierId)
    .single();

  if (error || !supplier) {
    throw new Error('Supplier not found');
  }

  // Get user email for Stripe customer
  const { data: user } = await supabase.auth.admin.getUserById(supplier.user_id);
  const customerEmail = user?.user?.email;

  // Determine price ID
  const priceId = tier === 'standard' ? STRIPE_PRICE_IDS.standard_monthly : STRIPE_PRICE_IDS.verified_monthly;

  // Create or retrieve Stripe customer
  let customerId = supplier.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: {
        supplier_id: supplierId,
        supplier_name: supplier.name,
      },
    });
    customerId = customer.id;

    // Update supplier with customer ID
    await supabase
      .from('suppliers')
      .update({ stripe_customer_id: customerId })
      .eq('id', supplierId);
  }

  // Create Checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: options?.successUrl || getSuccessUrl('{CHECKOUT_SESSION_ID}'),
    cancel_url: options?.cancelUrl || getCancelUrl(),
    metadata: {
      supplier_id: supplierId,
      tier: tier,
    },
    subscription_data: {
      metadata: {
        supplier_id: supplierId,
        tier: tier,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Get Stripe customer portal URL for subscription management
 */
export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl?: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/supplier/subscription`,
  });

  return session.url;
}

/**
 * Cancel subscription (at period end)
 */
export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<{ cancel_at_period_end: boolean; period_end: number }> {
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return {
    cancel_at_period_end: subscription.cancel_at_period_end,
    period_end: subscription.current_period_end,
  };
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(stripeSubscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(stripeSubscriptionId: string) {
  return await stripe.subscriptions.retrieve(stripeSubscriptionId);
}
