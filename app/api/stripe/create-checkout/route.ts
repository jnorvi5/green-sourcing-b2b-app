/**
 * POST /api/stripe/create-checkout
 * Create a Stripe Checkout session for subscription upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from "@/lib/supabase/server";

// Initialize Stripe with specific API version
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const body = await request.json();
    const { priceId, tier } = body;
    // userId is taken from the session for security, ignoring what is in the body if any.
    const userId = session.user.id;

    // Validate required parameters
    if (!priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters: priceId' },
        { status: 400 }
      );
    }

    // Determine subscription tier from request or default to architect
    const subscriptionTier = tier || 'architect';

    // Get base URL for success/cancel URLs
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'] || process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3001';

    // Create Stripe checkout session
    const sessionStripe = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId: userId,
        role: subscriptionTier,
      },
      allow_promotion_codes: true,
    });

    if (!sessionStripe.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkout_url: sessionStripe.url,
      session_id: sessionStripe.id,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
