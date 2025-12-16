/**
 * POST /api/stripe/customer-portal
 * Generate Stripe Customer Portal session URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe/checkout';
import { z } from 'zod';

const requestSchema = z.object({
  return_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = requestSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { return_url } = validated.data;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier profile with Stripe customer ID
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, name, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Check if supplier has a Stripe customer ID
    if (!supplier.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    // Check if supplier has an active subscription
    if (!supplier.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    // Create Customer Portal session
    const portalUrl = await createCustomerPortalSession(
      supplier.stripe_customer_id,
      return_url
    );

    return NextResponse.json({
      url: portalUrl,
    });
  } catch (error) {
    console.error('Customer Portal error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create customer portal session',
      },
      { status: 500 }
    );
  }
}
