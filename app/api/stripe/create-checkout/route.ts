/**
 * POST /api/stripe/create-checkout
 * Create a Stripe Checkout session for subscription upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { CreateCheckoutRequest, CreateCheckoutResponse } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateCheckoutRequest;
    const { tier, success_url, cancel_url } = body;

    // Map 'professional' -> 'architect_pro_monthly'
    // Map 'supplier' -> 'supplier_monthly'
    // Map legacy 'standard' -> ...

    let priceIdKey: keyof typeof import('@/lib/stripe/config').STRIPE_PRICE_IDS | null = null;

    if (tier === 'professional') priceIdKey = 'architect_pro_monthly';
    else if (tier === 'supplier') priceIdKey = 'supplier_monthly';
    else if (tier === 'standard') priceIdKey = 'standard_monthly'; // Fallback

    if (!priceIdKey) {
      return NextResponse.json(
        { error: 'Invalid plan selected.' },
        { status: 400 }
      );
    }

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

    // Determine the entity ID (User ID or Supplier ID)
    // For Architects/Buyers, the subscription is often attached to the User or Organization.
    // For Suppliers, it might be the Supplier profile.
    let customerId = user.id; // Default to user ID

    // If it's a supplier plan, try to find the supplier profile
    if (tier === 'supplier') {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (supplier) customerId = supplier.id;
    }

    // Create Checkout Session
    // We pass the priceIdKey (identifier) and let the checkout helper resolve the actual Stripe Price ID
    const { url, sessionId } = await createCheckoutSession(customerId, priceIdKey, {
      successUrl: success_url,
      cancelUrl: cancel_url,
    });

    const response: CreateCheckoutResponse = {
      checkout_url: url,
      session_id: sessionId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
