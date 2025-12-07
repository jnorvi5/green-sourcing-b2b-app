/**
 * RFQ Detail Page - Supplier Quote Submission
 * 
 * Dynamic route: /rfq/[id]
 * 
 * Displays RFQ details and allows matched suppliers to submit/edit quotes.
 * - Fetches RFQ with architect profile
 * - Verifies supplier is in matched_suppliers array
 * - Shows existing quote if submitted
 * - Displays quote submission form otherwise
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RFQWithArchitect, RFQResponse } from '@/types/rfq';
import RFQDetailClient from './RFQDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RFQDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login?redirect=/rfq/' + id);
  }

  // Get supplier profile
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single();

  if (supplierError || !supplier) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            Only suppliers can view and respond to RFQs. Please complete your supplier profile first.
          </p>
          <a
            href="/supplier/dashboard"
            className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Supplier Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Fetch RFQ with architect information
  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .select(`
      id,
      architect_id,
      product_id,
      project_name,
      project_location,
      material_specs,
      budget_range,
      delivery_deadline,
      required_certifications,
      message,
      status,
      matched_suppliers,
      created_at,
      updated_at,
      architect:users!rfqs_architect_id_fkey(
        id,
        email,
        full_name,
        company_name
      )
    `)
    .eq('id', id)
    .single();

  if (rfqError || !rfq) {
    notFound();
  }

  // Verify supplier is matched to this RFQ
  if (!rfq.matched_suppliers.includes(supplier.id)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-yellow-500 mb-4">Not Matched</h1>
          <p className="text-gray-300 mb-6">
            You are not matched to this RFQ. Only matched suppliers can view and respond to RFQs.
          </p>
          <a
            href="/supplier/dashboard"
            className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check if supplier has already submitted a quote
  const { data: existingQuote, error: quoteError } = await supabase
    .from('rfq_responses')
    .select('*')
    .eq('rfq_id', id)
    .eq('supplier_id', supplier.id)
    .single();

  // Transform the data to match our type (handle nested architect object)
  const rfqWithArchitect: RFQWithArchitect = {
    ...rfq,
    architect: Array.isArray(rfq.architect) ? rfq.architect[0] : rfq.architect,
  };

  return (
    <RFQDetailClient
      rfq={rfqWithArchitect}
      existingQuote={existingQuote || null}
      supplierName={supplier.company_name || 'Your Company'}
    />
  );
}
