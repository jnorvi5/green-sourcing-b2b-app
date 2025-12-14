/**
 * Stripe Checkout Service
 * Handles creation of Stripe Checkout sessions for subscription upgrades
 */

import { stripe, STRIPE_PRICE_IDS, getSuccessUrl, getCancelUrl } from './config';
import { createClient } from '@supabase/supabase-js';

/**
 * Create Stripe Checkout session for subscription upgrade
 */
/**
 * Create Stripe Checkout session for subscription upgrade
 */
export async function createCheckoutSession(
  entityId: string, // User ID or Supplier ID
  priceIdKey: keyof typeof STRIPE_PRICE_IDS,
  options?: {
    successUrl?: string;
    cancelUrl?: string;
  }
): Promise<{ url: string; sessionId: string }> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  // Attempt to find if entity is a supplier
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name, user_id, stripe_customer_id')
    .eq('id', entityId)
    .single();

  let customerId = supplier?.stripe_customer_id;
  let email: string | undefined;
  let userId = supplier?.user_id || entityId; // Fallback to treating entityId as userId if not supplier

  const metadata: Record<string, string> = { tier: priceIdKey };

  if (supplier) {
    metadata['supplier_id'] = supplier.id;
    metadata['supplier_name'] = supplier.name;
  }

  // Get user email
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (userData?.user) {
    email = userData.user.email;
  } else if (!supplier) {
    // If not a supplier and user not found, try treating entityId as user ID in public auth? 
    // For now assume valid user ID passed
  }

  // Determine price ID
  const priceId = STRIPE_PRICE_IDS[priceIdKey];
  if (!priceId) throw new Error('Invalid Price configuration');

  // Create or retrieve Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email,
      metadata: metadata,
    });
    customerId = customer.id;

    // Save Customer ID
    if (supplier) {
      await supabase
        .from('suppliers')
        .update({ stripe_customer_id: customerId })
        .eq('id', supplier.id);
    } else {
      // If it's a regular user (Architect), we might need to store it in a 'profiles' table 
      // or 'customers' table. For now, we'll try 'profiles' if it exists.
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
        .maybeSingle(); // Ignore error if table doesn't exist or column missing
    }
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
    metadata: metadata,
    subscription_data: {
      metadata: metadata,
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
    return_url: returnUrl || `${process.env['NEXT_PUBLIC_BASE_URL']}/supplier/subscription`,
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
