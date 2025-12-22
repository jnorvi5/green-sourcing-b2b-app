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

  const userId = session.metadata?.['userId'];
  const role = session.metadata?.['role']; // Should be 'architect' for new billing system
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !role) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine trial end date if applicable
  const trialEndsAt = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;

  // Update user's subscription tier
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: role, // 'architect' or 'enterprise'
    })
    .eq('id', userId);

  if (userError) {
    console.error('Failed to update user subscription tier:', userError);
    throw new Error('Failed to update user');
  }

  // Create subscription record
  const { error: subError } = await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscriptionId,
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_ends_at: trialEndsAt,
  });

  if (subError) {
    console.error('Failed to create subscription record:', subError);
  }

  // For architect tier, grant 10 audit credits
  if (role === 'architect') {
    const { error: creditsError } = await supabase.from('audit_credits').insert({
      user_id: userId,
      credits: 10,
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    if (creditsError) {
      console.error('Failed to create audit credits:', creditsError);
    } else {
      console.log(`✅ Granted 10 audit credits to user ${userId}`);
    }
  }

  console.log(`✅ Subscription created for user ${userId} - Role: ${role}`);
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

/**
 * Handle invoice.finalized event
 * When invoice is ready to be paid
 */
export async function handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  // Update invoice status in database
  await supabase
    .from('invoices')
    .update({
      status: 'open',
      invoice_pdf_url: invoice.invoice_pdf || undefined,
      invoice_hosted_url: invoice.hosted_invoice_url || undefined,
    })
    .eq('stripe_invoice_id', invoice.id);

  console.log(`📄 Invoice finalized: ${invoice.id}`);
}

/**
 * Handle invoice.payment_succeeded event
 * When invoice is paid (for success fees)
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  // Update invoice status to paid
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);

  console.log(`💰 Invoice payment succeeded: ${invoice.id} - Amount: $${(invoice.amount_paid || 0) / 100}`);
}

/**
 * Handle payment_method.attached event
 * When customer adds new payment method
 */
export async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const customerId = paymentMethod.customer as string;

  // Get supplier by customer ID
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!supplier) {
    console.log(`Payment method attached for unknown customer: ${customerId}`);
    return;
  }

  console.log(`💳 Payment method attached for supplier ${supplier.name} - Type: ${paymentMethod.type}`);
}

/**
 * Handle customer.subscription.trial_will_end event
 * 3 days before trial ends
 */
export async function handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const customerId = subscription.customer as string;

  // Get supplier
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, name, user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!supplier) {
    console.log(`Trial ending for unknown customer: ${customerId}`);
    return;
  }

  // Get user email
  await supabase.auth.admin.getUserById(supplier.user_id);

  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toLocaleDateString()
    : 'soon';

  console.log(`⏰ Trial will end for supplier ${supplier.name} on ${trialEndDate}`);
  
  // TODO: Send email notification via Zoho or email service
  // This would integrate with lib/email/templates.ts or lib/zoho-smtp.ts
}
