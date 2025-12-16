/**
 * GET /api/stripe/billing-history
 * Fetch billing history including invoices and payments
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/config';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

interface InvoiceWithDetails {
  id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  created_at: string;
  paid_at?: string;
}

export async function GET() {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier profile
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Fetch payments from Supabase
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('paid_at', { ascending: false })
      .limit(50);

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError);
    }

    // Fetch invoices from Stripe if customer exists
    let stripeInvoices: Stripe.Invoice[] = [];
    if (supplier.stripe_customer_id) {
      try {
        const stripe = getStripe();
        const invoicesList = await stripe.invoices.list({
          customer: supplier.stripe_customer_id,
          limit: 50,
        });
        stripeInvoices = invoicesList.data;
      } catch (stripeError) {
        console.error('Failed to fetch Stripe invoices:', stripeError);
      }
    }

    // Combine and format invoice data
    const invoices: InvoiceWithDetails[] = stripeInvoices.map((invoice) => ({
      id: invoice.id,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_paid || invoice.amount_due || 0,
      currency: invoice.currency,
      status: invoice.status || 'unknown',
      description:
        invoice.lines.data[0]?.description || 'Subscription payment',
      invoice_pdf: invoice.invoice_pdf || undefined,
      hosted_invoice_url: invoice.hosted_invoice_url || undefined,
      created_at: new Date(invoice.created * 1000).toISOString(),
      paid_at: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : undefined,
    }));

    // Fetch success fee invoices from database
    const { data: successFeeInvoices, error: successFeeError } = await supabase
      .from('invoices')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('created_at', { ascending: false });

    if (successFeeError) {
      console.error('Failed to fetch success fee invoices:', successFeeError);
    }

    return NextResponse.json({
      invoices,
      payments: payments || [],
      success_fee_invoices: successFeeInvoices || [],
    });
  } catch (error) {
    console.error('Billing history error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch billing history',
      },
      { status: 500 }
    );
  }
}
