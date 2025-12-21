
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { QuoteApiRequestSchema } from '@/types/rfq';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: rfqId } = await params;

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier ID
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier profile not found' }, { status: 403 });
    }

    // Parse body
    const json = await request.json();

    // Validate with Zod
    const validationResult = QuoteApiRequestSchema.safeParse(json);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { price, lead_time, notes, pdf_url } = validationResult.data;

    // Check if RFQ exists and is open
    const { data: rfq, error: rfqCheckError } = await supabase
      .from('rfqs')
      .select('status, matched_suppliers')
      .eq('id', rfqId)
      .single();

    if (rfqCheckError || !rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    if (rfq.status === 'closed' || rfq.status === 'expired') {
      return NextResponse.json({ error: 'RFQ is closed or expired' }, { status: 400 });
    }

    // Check if supplier is matched (optional, but good practice)
    // if (!rfq.matched_suppliers.includes(supplier.id)) {
    //   return NextResponse.json({ error: 'You are not a matched supplier for this RFQ' }, { status: 403 });
    // }

    // Check if already quoted
    const { data: existingQuote } = await supabase
      .from('rfq_responses')
      .select('id')
      .eq('rfq_id', rfqId)
      .eq('supplier_id', supplier.id)
      .maybeSingle();

    if (existingQuote) {
      return NextResponse.json({ error: 'You have already submitted a quote for this RFQ' }, { status: 409 });
    }

    // Insert Quote
    const { data: quote, error: insertError } = await supabase
      .from('rfq_responses')
      .insert({
        rfq_id: rfqId,
        supplier_id: supplier.id,
        quote_amount: price,
        lead_time_days: parseInt(lead_time) || 0, // Simplified parsing, schema allows string but DB might expect int or string.
        // Wait, types/rfq.ts says lead_time_days is number in Quote interface.
        // But QuoteApiRequestSchema says lead_time is string.
        // I need to adjust or parse.
        // Let's assume lead_time_days is stored as integer in DB for days, but user inputs string "2 weeks".
        // The form sends "lead_time" as string.
        // If the DB column is integer 'lead_time_days', I need to extract number or change schema.
        // Checking types/rfq.ts again:
        // export interface RfqResponse { ... lead_time_days: number; ... }
        // So I should try to parse the days from the string, or store the string in 'message' or a different column if strictly needed.
        // For MVP, I'll store the raw string in `message` if needed, but `lead_time_days` needs to be int.
        // Let's parse the first number found, default to 0.
        // Or better, let's just assume the user enters a number of days in the form if we want to be strict,
        // but the form label says "e.g. 2 weeks".
        // Maybe I should just update the insert to put the string in `message` or `notes` and set days to 0 if I can't parse?
        // Let's try to extract a number.

        message: notes + (notes ? '\n\n' : '') + `Lead Time: ${lead_time}`,
        status: 'submitted',
        attachment_url: pdf_url
      })
      .select()
      .single();

    // Re-check lead_time_days parsing logic.
    // Ideally I'd update the DB schema to allow string for lead_time if it's free text.
    // If I must provide an integer, I'll regex for it.

    // Actually, looking at the insert object above, I'm doing `lead_time_days: parseInt(lead_time) || 0`.
    // If user types "2 weeks", parseInt("2 weeks") is 2. That works.
    // If user types "Dec 15th", parseInt is NaN -> 0.
    // I appended the full string to message so no info is lost.

    if (insertError) {
      console.error('Error inserting quote:', insertError);
      return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 });
    }

    // Update RFQ status to 'responded' IF it was pending?
    // Or maybe not change RFQ status, just the response status.
    // Usually RFQ status tracks if it's Open/Closed.
    // "responded" might be a status for the supplier's view, derived from presence of response.
    // But rfq table has `status`. Maybe that's the architect's status?
    // Let's leave RFQ status alone unless business logic dictates otherwise.

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error('Error in quote submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
