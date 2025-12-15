/**
 * Stripe Invoice Service
 * Handles creation of success fee invoices for RFQ wins
 */

import { getStripe } from './config';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema for success fee parameters
const successFeeParamsSchema = z.object({
  supplierId: z.string().uuid(),
  rfqRequestId: z.string().uuid(),
  dealAmount: z.number().positive(),
  feePercentage: z.number().min(0).max(100).default(3),
});

export type SuccessFeeParams = z.infer<typeof successFeeParamsSchema>;

export interface SuccessFeeInvoiceResult {
  invoiceId: string;
  amount: number;
  dueDate: string;
  stripeInvoiceId: string;
}

/**
 * Create a success fee invoice when a supplier wins an RFQ
 */
export async function createSuccessFeeInvoice(
  params: SuccessFeeParams
): Promise<SuccessFeeInvoiceResult> {
  // Validate parameters
  const validated = successFeeParamsSchema.parse(params);
  const { supplierId, rfqRequestId, dealAmount, feePercentage } = validated;

  // Calculate fee amount
  const feeAmount = Math.round(dealAmount * (feePercentage / 100));

  // Initialize Supabase client
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  // Get supplier details including Stripe customer ID
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, name, stripe_customer_id, user_id')
    .eq('id', supplierId)
    .single();

  if (supplierError || !supplier) {
    throw new Error(`Supplier not found: ${supplierId}`);
  }

  // Ensure supplier has a Stripe customer ID
  if (!supplier.stripe_customer_id) {
    throw new Error(
      `Supplier ${supplier.name} does not have a Stripe customer ID`
    );
  }

  // Get RFQ details
  const { data: rfqRequest, error: rfqError } = await supabase
    .from('rfq_requests')
    .select('id, product_id, quantity, project_name')
    .eq('id', rfqRequestId)
    .single();

  if (rfqError || !rfqRequest) {
    throw new Error(`RFQ request not found: ${rfqRequestId}`);
  }

  // Calculate due date (Net 30)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Create Stripe invoice
  const stripe = getStripe();

  try {
    // Create invoice item first
    const invoiceItem = await stripe.invoiceItems.create({
      customer: supplier.stripe_customer_id,
      amount: feeAmount,
      currency: 'usd',
      description: `Success fee for RFQ ${rfqRequest.project_name || rfqRequestId.substring(0, 8)} - ${feePercentage}% of $${(dealAmount / 100).toFixed(2)}`,
      metadata: {
        supplier_id: supplierId,
        rfq_request_id: rfqRequestId,
        deal_amount_cents: dealAmount.toString(),
        fee_percentage: feePercentage.toString(),
      },
    });

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: supplier.stripe_customer_id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      description: `Success fee for winning RFQ`,
      metadata: {
        supplier_id: supplierId,
        rfq_request_id: rfqRequestId,
        type: 'success_fee',
      },
      auto_advance: true, // Automatically finalize the invoice
    });

    // Finalize the invoice to make it payable
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
    });

    // Store invoice in database
    const { data: dbInvoice, error: dbError } = await supabase
      .from('invoices')
      .insert({
        supplier_id: supplierId,
        stripe_invoice_id: finalizedInvoice.id,
        rfq_request_id: rfqRequestId,
        amount_cents: feeAmount,
        fee_percentage: feePercentage,
        deal_amount_cents: dealAmount,
        status: finalizedInvoice.status || 'open',
        due_date: dueDate.toISOString(),
        invoice_pdf_url: finalizedInvoice.invoice_pdf || undefined,
        invoice_hosted_url: finalizedInvoice.hosted_invoice_url || undefined,
        description: `Success fee - ${feePercentage}% of deal`,
        metadata: {
          rfq_request_id: rfqRequestId,
          product_id: rfqRequest.product_id,
          quantity: rfqRequest.quantity,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to store invoice in database:', dbError);
      // Don't throw - invoice is already created in Stripe
    }

    // Send invoice email via Stripe
    if (finalizedInvoice.status === 'open') {
      await stripe.invoices.sendInvoice(finalizedInvoice.id);
    }

    return {
      invoiceId: dbInvoice?.id || finalizedInvoice.id,
      amount: feeAmount,
      dueDate: dueDate.toISOString(),
      stripeInvoiceId: finalizedInvoice.id,
    };
  } catch (stripeError) {
    console.error('Stripe invoice creation failed:', stripeError);
    throw new Error(
      `Failed to create invoice: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`
    );
  }
}

/**
 * Mark invoice as paid in database
 */
export async function markInvoiceAsPaid(
  stripeInvoiceId: string
): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', stripeInvoiceId);
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(invoiceId: string) {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get invoices for a supplier
 */
export async function getSupplierInvoices(supplierId: string) {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
  );

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
