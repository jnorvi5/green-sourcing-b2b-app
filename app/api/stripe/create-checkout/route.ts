/**
 * POST /api/stripe/create-checkout
 * Create Stripe Checkout session for subscription upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import type { CreateCheckoutRequest, CreateCheckoutResponse } from '@/types/stripe';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
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

    // Get supplier for this user
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, tier')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 });
    }

    // Parse request body
    const body: CreateCheckoutRequest = await request.json();

    if (!body.tier || (body.tier !== 'standard' && body.tier !== 'verified')) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "standard" or "verified"' },
        { status: 400 }
      );
    }

    // Check if already on this tier or higher
    if (supplier.tier === body.tier) {
      return NextResponse.json(
        { error: 'Already subscribed to this tier' },
        { status: 400 }
      );
    }

    if (supplier.tier === 'verified' && body.tier === 'standard') {
      return NextResponse.json(
        { error: 'Cannot downgrade from verified to standard. Please cancel your current subscription first.' },
        { status: 400 }
      );
    }

    // Create checkout session
    const { url, sessionId } = await createCheckoutSession(supplier.id, body.tier, {
      successUrl: body.success_url,
      cancelUrl: body.cancel_url,
    });

    const response: CreateCheckoutResponse = {
      checkout_url: url,
      session_id: sessionId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
