import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Validation schema for Quote submission
const createQuoteSchema = z.object({
  price: z.number().positive('Price must be positive'),
  lead_time: z.number().int().positive('Lead time must be a positive integer (days)'),
  message: z.string().optional(),
  attachment_urls: z.array(z.string().url()).optional(),
  valid_until: z.string().datetime().optional(), // Quote validity
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rfqId } = await params;
    const body = await request.json();

    const validationResult = createQuoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const quoteData = validationResult.data;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is a supplier
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'supplier') {
      return NextResponse.json({ error: 'Only suppliers can submit quotes' }, { status: 403 });
    }

    // Check if RFQ exists and is open
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('status')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    if (rfq.status !== 'pending' && rfq.status !== 'responded') {
        // "responded" means at least one quote exists, but it's still open for more?
        // Usually 'closed' or 'accepted' prevents new quotes.
      return NextResponse.json({ error: `RFQ is ${rfq.status} and cannot accept new quotes` }, { status: 400 });
    }

    // Insert Quote
    // Assuming table is 'rfq_responses' or 'quotes'.
    // Based on types/rfq.ts, it seems 'rfq_responses' is likely or 'quotes'.
    // Existing schema.sql said 'RFQ_Responses'.
    // I'll try 'rfq_responses' (snake_case) which is standard Supabase.

    // I also need the supplier_id. The user.id is the auth user.
    // The table likely links to 'suppliers' table which links to 'users' table.
    // Or it might link directly to 'profiles' (user_id).
    // Let's assume 'rfq_responses' has 'supplier_id' which is the UUID of the user (or profile).
    // Wait, 'products' query in previous file showed:
    // suppliers (id, user_id)
    // So I need the supplier_id from the 'suppliers' table corresponding to this user.

    const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (supplierError || !supplierData) {
        return NextResponse.json({ error: 'Supplier profile not found' }, { status: 404 });
    }

    const { data: quote, error: quoteError } = await supabase
      .from('rfq_responses')
      .insert({
        rfq_id: rfqId,
        supplier_id: supplierData.id,
        quote_amount: quoteData.price,
        lead_time_days: quoteData.lead_time,
        message: quoteData.message,
        attachment_url: quoteData.attachment_urls?.[0] || null, // Assuming single URL or need to adjust schema
        status: 'submitted', // or 'pending'
      })
      .select('id, status')
      .single();

    if (quoteError) {
      console.error('[Quote] Insert error:', quoteError.message);
      return NextResponse.json({ error: 'Failed to submit quote', details: quoteError.message }, { status: 500 });
    }

    // Update RFQ status to 'responded' if it was 'pending'
    if (rfq.status === 'pending') {
      await supabase
        .from('rfqs')
        .update({ status: 'responded' })
        .eq('id', rfqId);
    }

    return NextResponse.json({
        success: true,
        quote_id: quote.id,
        message: 'Quote submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[Quote] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
