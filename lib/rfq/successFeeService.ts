/**
 * Success Fee Service
 * Handles success fee invoicing when suppliers win RFQs
 */

import { createClient } from '@supabase/supabase-js';
import { createSuccessFeeInvoice } from '@/lib/stripe/invoices';
import type { SuccessFeeParams } from '@/lib/stripe/invoices';

export interface RFQWinParams {
  rfqRequestId: string;
  supplierId: string;
  acceptedQuoteAmount: number; // Amount in cents
  feePercentage?: number; // Optional, defaults to 3%
}

/**
 * Process RFQ win and generate success fee invoice
 * Call this when RFQ status changes to 'won' or 'accepted'
 */
export async function processRFQWin(
  params: RFQWinParams
): Promise<{ invoiceId: string; amount: number }> {
  const { rfqRequestId, supplierId, acceptedQuoteAmount, feePercentage = 3 } = params;

  // Initialize Supabase client
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  try {
    // Verify RFQ exists and is in correct state
    const { data: rfqRequest, error: rfqError } = await supabase
      .from('rfq_requests')
      .select('id, supplier_id, buyer_id, status, product_id')
      .eq('id', rfqRequestId)
      .single();

    if (rfqError || !rfqRequest) {
      throw new Error(`RFQ request not found: ${rfqRequestId}`);
    }

    // Verify supplier matches
    if (rfqRequest.supplier_id !== supplierId) {
      throw new Error(
        `Supplier ID mismatch: expected ${rfqRequest.supplier_id}, got ${supplierId}`
      );
    }

    // Check if invoice already exists for this RFQ
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('rfq_request_id', rfqRequestId)
      .single();

    if (existingInvoice) {
      console.log(`Invoice already exists for RFQ ${rfqRequestId}`);
      return {
        invoiceId: existingInvoice.id,
        amount: Math.round(acceptedQuoteAmount * (feePercentage / 100)),
      };
    }

    // Create success fee invoice
    const invoiceParams: SuccessFeeParams = {
      supplierId,
      rfqRequestId,
      dealAmount: acceptedQuoteAmount,
      feePercentage,
    };

    const result = await createSuccessFeeInvoice(invoiceParams);

    // Update RFQ with invoice reference (optional metadata)
    await supabase
      .from('rfq_requests')
      .update({
        status: 'answered', // or whatever status indicates "won"
      })
      .eq('id', rfqRequestId);

    // Get supplier details for notification
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, name, user_id')
      .eq('id', supplierId)
      .single();

    if (supplier) {
      // Get user email for notification
      const { data: userData } = await supabase.auth.admin.getUserById(
        supplier.user_id
      );

      if (userData?.user?.email) {
        console.log(
          `Success fee invoice created for ${supplier.name} (${userData.user.email})`
        );
        // TODO: Send notification email via lib/email service
        // await sendSuccessFeeNotification({
        //   email: userData.user.email,
        //   supplierName: supplier.name,
        //   invoiceAmount: result.amount,
        //   dueDate: result.dueDate,
        //   rfqId: rfqRequestId,
        // });
      }
    }

    console.log(
      `✅ Success fee invoice created: ${result.stripeInvoiceId} - Amount: $${(result.amount / 100).toFixed(2)}`
    );

    return {
      invoiceId: result.invoiceId,
      amount: result.amount,
    };
  } catch (error) {
    console.error('Failed to process RFQ win:', error);
    throw error;
  }
}

/**
 * Get RFQ wins summary for a supplier
 */
export async function getSupplierRFQWins(supplierId: string) {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, rfq_requests(*)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return invoices;
}

/**
 * Calculate total success fees for a supplier
 */
export async function calculateTotalSuccessFees(supplierId: string): Promise<{
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
}> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('amount_cents, status')
    .eq('supplier_id', supplierId);

  if (error) throw error;

  const summary = (invoices || []).reduce(
    (acc, invoice) => {
      acc.total_invoiced += invoice.amount_cents;
      if (invoice.status === 'paid') {
        acc.total_paid += invoice.amount_cents;
      } else if (invoice.status === 'open') {
        acc.total_outstanding += invoice.amount_cents;
      }
      return acc;
    },
    { total_invoiced: 0, total_paid: 0, total_outstanding: 0 }
  );

  return summary;
}
