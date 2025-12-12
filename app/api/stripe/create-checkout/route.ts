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

    if (!tier || !['standard', 'verified'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "standard" or "verified".' },
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

    // Get supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 });
    }

    // Create Checkout Session
    const { url, sessionId } = await createCheckoutSession(supplier.id, tier, {
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
