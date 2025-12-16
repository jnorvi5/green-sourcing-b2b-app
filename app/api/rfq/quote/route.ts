/**
 * Quote Submission API Route
 * POST /api/rfq/quote - Submit a new quote for an RFQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
// import { QuoteSubmissionSchema } from '@/types/rfq';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input using shared schema if possible, or define local one matching frontend
    // Frontend sends: { rfq_id, price, lead_time, notes, pdf_url }
    const submissionSchema = z.object({
      rfq_id: z.string().uuid(),
      price: z.number().positive(),
      lead_time: z.string().min(1),
      notes: z.string().optional(),
      pdf_url: z.string().optional(),
    });

    const validationResult = submissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { rfq_id, price, lead_time, notes, pdf_url } = validationResult.data;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get supplier profile
    const { data: supplierProfile, error: profileError } = await supabase
      .from('suppliers')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !supplierProfile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Check if quote already exists
    const { data: existingQuote } = await supabase
      .from('rfq_responses')
      .select('id')
      .eq('rfq_id', rfq_id)
      .eq('supplier_id', supplierProfile.id)
      .single();

    let result;
    
    if (existingQuote) {
      // Update existing quote
      const { data, error } = await supabase
        .from('rfq_responses')
        .update({
          quote_amount: price,
          lead_time_days: parseInt(lead_time) || 0, // Simple parsing, ideally refine
          message: notes,
          attachment_url: pdf_url,
          status: 'submitted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', existingQuote.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      // Create new quote
      const { data, error } = await supabase
        .from('rfq_responses')
        .insert({
          rfq_id,
          supplier_id: supplierProfile.id,
          quote_amount: price,
          lead_time_days: parseInt(lead_time) || 0,
          message: notes,
          attachment_url: pdf_url,
          status: 'submitted',
        })
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    }

    // Update RFQ status to 'responded' if it was 'pending'
    await supabase
      .from('rfqs')
      .update({ status: 'responded' })
      .eq('id', rfq_id)
      .eq('status', 'pending');

    return NextResponse.json({
      success: true,
      message: existingQuote ? 'Quote updated successfully' : 'Quote submitted successfully',
      quote: result
    });

  } catch (error) {
    console.error('[Quote] Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote' },
      { status: 500 }
    );
  }
}
