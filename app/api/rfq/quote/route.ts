/**
 * API Route: POST /api/rfq/quote
 * 
 * Handles supplier quote submissions for RFQs.
 * Validates supplier access, inserts quote into rfq_responses table,
 * and updates RFQ status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QuoteApiRequestSchema } from '@/types/rfq';
import { newQuoteEmail } from '@/lib/email/rfqTemplates';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get supplier ID for the authenticated user
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found. Only suppliers can submit quotes.' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = QuoteApiRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { rfq_id, price, lead_time, notes, pdf_url } = validationResult.data;

    // Verify supplier is matched to this RFQ and fetch architect info
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select(`
        id, 
        matched_suppliers, 
        status, 
        project_name,
        architect_id,
        users!rfqs_architect_id_fkey(id, email, full_name)
      `)
      .eq('id', rfq_id)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    if (!rfq.matched_suppliers.includes(supplier.id)) {
      return NextResponse.json(
        { error: 'You are not authorized to quote on this RFQ' },
        { status: 403 }
      );
    }

    if (rfq.status === 'closed' || rfq.status === 'expired') {
      return NextResponse.json(
        { error: `This RFQ is ${rfq.status} and no longer accepting quotes` },
        { status: 400 }
      );
    }

    // Check if supplier already submitted a quote
    const { data: existingQuote } = await supabase
      .from('rfq_responses')
      .select('id')
      .eq('rfq_id', rfq_id)
      .eq('supplier_id', supplier.id)
      .single();

    // Parse lead_time to extract days (e.g., "2-3 weeks" -> roughly 14-21 days, use midpoint)
    const lead_time_days = parseLeadTimeToDays(lead_time);

    if (existingQuote) {
      // Update existing quote
      const updateData: {
        quote_amount: number;
        lead_time_days: number;
        message: string | null;
        responded_at: string;
        attachment_url?: string;
      } = {
        quote_amount: price,
        lead_time_days,
        message: notes || null,
        responded_at: new Date().toISOString(),
      };

      // Add attachment URL if provided
      if (pdf_url) {
        updateData.attachment_url = pdf_url;
      }

      const { data: updatedQuote, error: updateError } = await supabase
        .from('rfq_responses')
        .update(updateData)
        .eq('id', existingQuote.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating quote:', updateError);
        return NextResponse.json(
          { error: 'Failed to update quote', details: updateError.message },
          { status: 500 }
        );
      }

      // Update RFQ status to 'responded' if it was 'pending'
      if (rfq.status === 'pending') {
        await supabase
          .from('rfqs')
          .update({ status: 'responded', updated_at: new Date().toISOString() })
          .eq('id', rfq_id);
      }

      return NextResponse.json({
        success: true,
        message: 'Quote updated successfully',
        quote: updatedQuote,
      });
    } else {
      // Insert new quote
      const insertData: {
        rfq_id: string;
        supplier_id: string;
        quote_amount: number;
        lead_time_days: number;
        message: string | null;
        status: string;
        attachment_url?: string;
      } = {
        rfq_id,
        supplier_id: supplier.id,
        quote_amount: price,
        lead_time_days,
        message: notes || null,
        status: 'submitted',
      };

      // Add attachment URL if provided
      if (pdf_url) {
        insertData.attachment_url = pdf_url;
      }

      const { data: newQuote, error: insertError } = await supabase
        .from('rfq_responses')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting quote:', insertError);
        return NextResponse.json(
          { error: 'Failed to submit quote', details: insertError.message },
          { status: 500 }
        );
      }

      // Update RFQ status to 'responded'
      await supabase
        .from('rfqs')
        .update({ status: 'responded', updated_at: new Date().toISOString() })
        .eq('id', rfq_id);

      // Send notification email to architect
      await sendQuoteNotificationToArchitect(
        rfq,
        supplier.id,
        price,
        lead_time_days
      );

      return NextResponse.json({
        success: true,
        message: 'Quote submitted successfully',
        quote: newQuote,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Unexpected error in quote submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Parse lead time string to approximate days
 * Examples: "2-3 weeks" -> 17, "1 week" -> 7, "5 days" -> 5
 */
function parseLeadTimeToDays(leadTime: string): number {
  const lowerCase = leadTime.toLowerCase().trim();
  
  // Extract numbers from the string
  const numbers = lowerCase.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return 14; // Default to 2 weeks if no number found
  }

  const firstNum = parseInt(numbers[0], 10);
  const secondNum = numbers.length > 1 ? parseInt(numbers[1], 10) : firstNum;
  const avgNum = (firstNum + secondNum) / 2;

  // Detect unit
  if (lowerCase.includes('week')) {
    return Math.round(avgNum * 7);
  } else if (lowerCase.includes('month')) {
    return Math.round(avgNum * 30);
  } else if (lowerCase.includes('day')) {
    return Math.round(avgNum);
  }

  // Default: assume days
  return Math.round(avgNum);
}

/**
 * Send notification email to architect when a quote is received
 */
async function sendQuoteNotificationToArchitect(
  rfq: {
    id: string;
    project_name: string;
    architect_id: string;
    users?: { id: string; email: string; full_name: string | null } | null;
  },
  supplierId: string,
  quoteAmount: number,
  leadTimeDays: number
): Promise<void> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('[DEV] Would send quote notification email to architect');
      return;
    }

    const architectEmail = rfq.users?.email;
    const architectName = rfq.users?.full_name || 'Architect';

    if (!architectEmail) {
      console.error('[Quote] Architect email not found for RFQ:', rfq.id);
      return;
    }

    // Get supplier details
    const supabase = await createClient();
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('company_name')
      .eq('id', supplierId)
      .single();

    const supplierName = supplierData?.company_name || 'A supplier';
    const quoteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/admin/my-rfqs`;

    // Generate email HTML
    const emailHtml = newQuoteEmail(
      architectName,
      rfq.project_name,
      supplierName,
      quoteUrl,
      `$${quoteAmount.toFixed(2)} - ${leadTimeDays} days lead time`
    );

    // Send email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@greenchainz.com',
      to: architectEmail,
      subject: `New Quote Received for "${rfq.project_name}"`,
      html: emailHtml,
    });

    if (result.error) {
      console.error('[Quote] Email notification error:', result.error);
    } else {
      console.log('[Quote] Notification sent to architect:', architectEmail);
    }
  } catch (error) {
    console.error('[Quote] Failed to send architect notification:', error);
    // Don't throw - email failure shouldn't break quote submission
  }
}
