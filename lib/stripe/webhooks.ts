/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events with signature verification
 */

import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from './config';
import { createClient } from '@supabase/supabase-js';
import type { SubscriptionTier } from '@/types/stripe';

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const supplierId = session.metadata?.supplier_id;
  const tier = session.metadata?.tier as SubscriptionTier;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!supplierId || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update supplier with subscription info
  const { error: supplierError } = await supabase
    .from('suppliers')
    .update({
      tier: tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      upgraded_at: new Date().toISOString(),
    })
    .eq('id', supplierId);

  if (supplierError) {
    console.error('Failed to update supplier:', supplierError);
    throw new Error('Failed to update supplier');
  }

  // Create subscription record
  const { error: subError } = await supabase.from('subscriptions').insert({
    supplier_id: supplierId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    tier: tier,
    status: subscription.status,
    current_period_start: new Date((subscription.current_period_start as number) * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  if (subError) {
    console.error('Failed to create subscription record:', subError);
  }

  console.log(`✅ Subscription created for supplier ${supplierId} - Tier: ${tier}`);
}

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Get supplier by customer ID
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, tier')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!supplier) {
    console.error('Supplier not found for customer:', customerId);
    return;
  }

  // Get subscription to find subscription record
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  // Log payment
  const { error: paymentError } = await supabase.from('payments').insert({
    supplier_id: supplier.id,
    subscription_id: subscription?.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status || 'paid',
    tier: supplier.tier,
    description: `${supplier.tier.toUpperCase()} subscription payment`,
  });

  if (paymentError) {
    console.error('Failed to log payment:', paymentError);
  }

  // Update subscription period
  if (subscriptionId) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    await supabase
      .from('subscriptions')
      .update({
        current_period_start: new Date((stripeSubscription.current_period_start as number) * 1000).toISOString(),
        current_period_end: new Date((stripeSubscription.current_period_end as number) * 1000).toISOString(),
        status: stripeSubscription.status,
      })
      .eq('stripe_subscription_id', subscriptionId);
  }

  console.log(`✅ Payment logged for supplier ${supplier.id} - Amount: $${invoice.amount_paid / 100}`);
}

/**
 * Handle invoice.payment_failed event
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const customerId = invoice.customer as string;

  // Get supplier
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name, user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!supplier) {
    return;
  }

  // TODO: Send dunning email via Zoho
  console.warn(`⚠️ Payment failed for supplier ${supplier.id} - Attempt: ${invoice.attempt_count}`);

  // After 3 failed attempts, downgrade to free tier
  if (invoice.attempt_count && invoice.attempt_count >= 3) {
    await supabase
      .from('suppliers')
      .update({
        tier: 'free',
        subscription_status: 'past_due',
      })
      .eq('id', supplier.id);

    console.log(`⬇️ Supplier ${supplier.id} downgraded to FREE tier after 3 failed payments`);
  }
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const subscriptionId = subscription.id;

  // Get supplier by subscription ID
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!supplier) {
    console.error('Supplier not found for subscription:', subscriptionId);
    return;
  }

  // Downgrade to free tier
  await supabase
    .from('suppliers')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
    })
    .eq('id', supplier.id);

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`⬇️ Supplier ${supplier.id} downgraded to FREE tier - Subscription canceled`);
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const subscriptionId = subscription.id;

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date((subscription.current_period_start as number) * 1000).toISOString(),
      current_period_end: new Date((subscription.current_period_end as number) * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Update supplier status
  await supabase
    .from('suppliers')
    .update({
      subscription_status: subscription.status,
    })
    .eq('stripe_subscription_id', subscriptionId);

  console.log(`🔄 Subscription updated: ${subscriptionId} - Status: ${subscription.status}`);
}
