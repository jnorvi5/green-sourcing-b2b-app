/**
 * Subscription Management API Routes
 * GET /api/stripe/subscription - Get current subscription
 * POST /api/stripe/cancel-subscription - Cancel subscription
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelSubscription, reactivateSubscription } from '@/lib/stripe/checkout';
import { TIER_LIMITS, type SubscriptionTier } from '@/types/stripe';
import type { SubscriptionStatusResponse, CancelSubscriptionResponse } from '@/types/stripe';

/**
 * GET /api/stripe/subscription
 * Get current subscription status and usage
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier with subscription
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Get subscription details if exists
    let subscriptionDetails = null;
    if (supplier.stripe_subscription_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', supplier.stripe_subscription_id)
        .single();

      subscriptionDetails = subscription;
    }

    // Get usage stats
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id);

    // Get RFQs this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: rfqsCount } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplier.id)
      .gte('created_at', startOfMonth.toISOString());

    const response: SubscriptionStatusResponse = {
      has_subscription: supplier.tier !== 'free',
      tier: supplier.tier,
      status: supplier.subscription_status,
      current_period_end: subscriptionDetails?.current_period_end,
      cancel_at_period_end: subscriptionDetails?.cancel_at_period_end || false,
      limits: TIER_LIMITS[supplier.tier as SubscriptionTier],
      usage: {
        products_used: productsCount || 0,
        rfqs_used_this_month: rfqsCount || 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/cancel-subscription
 * Cancel subscription (at period end)
 */
export async function POST() {
  try {
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier || !supplier.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel subscription at period end
    const { cancel_at_period_end, period_end } = await cancelSubscription(
      supplier.stripe_subscription_id
    );

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('stripe_subscription_id', supplier.stripe_subscription_id);

    const response: CancelSubscriptionResponse = {
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancel_at_period_end,
      period_end: new Date(period_end * 1000).toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stripe/cancel-subscription
 * Reactivate a canceled subscription
 */
export async function DELETE() {
  try {
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier || !supplier.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Reactivate subscription
    await reactivateSubscription(supplier.stripe_subscription_id);

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('stripe_subscription_id', supplier.stripe_subscription_id);

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
