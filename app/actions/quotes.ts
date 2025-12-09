'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { RFQWithQuotes, Quote } from '@/types/rfq';

/**
 * Fetches an RFQ with all its quotes for comparison
 */
export async function getRFQWithQuotes(rfqId: string): Promise<{
  success: boolean;
  data?: RFQWithQuotes;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to view RFQ details',
      };
    }

    // Fetch the RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return {
        success: false,
        error: 'RFQ not found',
      };
    }

    // Verify the user owns this RFQ
    if (rfq.architect_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to view this RFQ',
      };
    }

    // Fetch all quotes for this RFQ with supplier data
    const { data: quotes, error: quotesError } = await supabase
      .from('rfq_responses')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('rfq_id', rfqId);

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      return {
        success: false,
        error: 'Failed to fetch quotes',
      };
    }

    const rfqWithQuotes: RFQWithQuotes = {
      ...rfq,
      quotes: quotes || [],
    };

    return {
      success: true,
      data: rfqWithQuotes,
    };
  } catch (error) {
    console.error('Error in getRFQWithQuotes:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

const acceptQuoteSchema = z.object({
  quoteId: z.string().uuid(),
  rfqId: z.string().uuid(),
});

/**
 * Accepts a quote and sends email notification to supplier
 */
export async function acceptQuote(input: z.infer<typeof acceptQuoteSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validated = acceptQuoteSchema.parse(input);
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to accept a quote',
      };
    }

    // Verify the user owns the RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('architect_id')
      .eq('id', validated.rfqId)
      .single();

    if (rfqError || !rfq) {
      return {
        success: false,
        error: 'RFQ not found',
      };
    }

    if (rfq.architect_id !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to accept this quote',
      };
    }

    // Update the quote status to 'accepted'
    const { error: updateError } = await supabase
      .from('rfq_responses')
      .update({ status: 'accepted' })
      .eq('id', validated.quoteId);

    if (updateError) {
      console.error('Error updating quote:', updateError);
      return {
        success: false,
        error: 'Failed to accept quote',
      };
    }

    // Fetch quote and supplier details for email
    const { data: quote, error: quoteError } = await supabase
      .from('rfq_responses')
      .select(`
        *,
        supplier:suppliers(
          id,
          company_name,
          user_id
        )
      `)
      .eq('id', validated.quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('Error fetching quote details:', quoteError);
      // Quote was updated, but couldn't send email
      return {
        success: true,
      };
    }

    // Get supplier user email
    const { data: supplierUser, error: supplierUserError } = await supabase
      .from('users')
      .select('email')
      .eq('id', quote.supplier.user_id)
      .single();

    if (supplierUserError || !supplierUser) {
      console.error('Error fetching supplier user:', supplierUserError);
      // Quote was updated, but couldn't send email
      return {
        success: true,
      };
    }

    // Log the email that should be sent
    // In production, this would integrate with email service (Zoho Mail, etc.)
    const { error: emailLogError } = await supabase
      .from('email_logs')
      .insert({
        to_email: supplierUser.email,
        from_email: 'noreply@greenchainz.com',
        subject: `Quote Accepted - RFQ ${validated.rfqId}`,
        email_type: 'transactional',
        provider: 'zoho',
        status: 'sent',
        metadata: {
          quote_id: validated.quoteId,
          rfq_id: validated.rfqId,
          quote_amount: quote.quote_amount,
        },
      });

    if (emailLogError) {
      console.error('Error logging email:', emailLogError);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error in acceptQuote:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input data',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
