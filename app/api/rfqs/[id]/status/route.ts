import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rfqId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get RFQ details
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, status, project_name, created_at, architect_id')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    // Check permissions: Only Architect (Creator) or Matched Suppliers should see detailed status?
    // For now, let's allow the architect and maybe admins.
    // If supplier, they might only see if they matched.

    // Simplification: Check if user is architect.
    let isArchitect = rfq.architect_id === user.id;
    let isSupplier = false;

    if (!isArchitect) {
        // Check if user is a matched supplier
        // We need to find the supplier_id for this user
         const { data: supplier } = await supabase
            .from('suppliers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (supplier) {
             const { data: match } = await supabase
                .from('rfq_matches')
                .select('id')
                .eq('rfq_id', rfqId)
                .eq('supplier_id', supplier.id)
                .single();
             if (match) isSupplier = true;
        }
    }

    if (!isArchitect && !isSupplier) {
         return NextResponse.json({ error: 'Unauthorized access to RFQ status' }, { status: 403 });
    }

    // Fetch response count
    const { count: quoteCount } = await supabase
      .from('rfq_responses')
      .select('id', { count: 'exact', head: true })
      .eq('rfq_id', rfqId);

    // If architect, maybe fetch latest quotes summary?
    // For "track progress", status + count is good for now.

    return NextResponse.json({
      rfq_id: rfq.id,
      status: rfq.status,
      project_name: rfq.project_name,
      created_at: rfq.created_at,
      quote_count: quoteCount || 0,
      user_role: isArchitect ? 'architect' : 'supplier'
    });

  } catch (error) {
    console.error('[RFQ Status] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
