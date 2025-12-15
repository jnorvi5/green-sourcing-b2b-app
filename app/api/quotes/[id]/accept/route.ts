import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RfqRelation = {
  id: string;
  architect_id: string;
  status: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the quote to find the RFQ and verify ownership
    const { data: quote, error: quoteError } = await supabase
      .from('rfq_responses')
      .select(`
        id,
        rfq_id,
        status,
        rfqs!inner (
            id,
            architect_id,
            status
        )
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify the user is the architect who created the RFQ
    // Force type assertion to handle the join result correctly
    const rfq = quote.rfqs as unknown as RfqRelation;

    if (rfq.architect_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: Only the RFQ creator can accept this quote' }, { status: 403 });
    }

    if (rfq.status === 'closed' || rfq.status === 'accepted') {
        return NextResponse.json({ error: 'RFQ is already closed or accepted' }, { status: 400 });
    }

    // Update Quote status to 'accepted'
    const { error: updateQuoteError } = await supabase
      .from('rfq_responses')
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    if (updateQuoteError) {
      return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 });
    }

    // Update RFQ status to 'closed' (or 'accepted')
    const { error: updateRfqError } = await supabase
      .from('rfqs')
      .update({ status: 'closed' }) // or 'accepted'
      .eq('id', rfq.id);

    if (updateRfqError) {
       // Log error but proceed?
       console.error("Failed to close RFQ after accepting quote", updateRfqError);
    }

    // Reject other quotes? (Optional business logic)
    // await supabase.from('rfq_responses').update({ status: 'rejected' }).eq('rfq_id', rfq.id).neq('id', quoteId);

    return NextResponse.json({
        success: true,
        message: 'Quote accepted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('[Quote Accept] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
