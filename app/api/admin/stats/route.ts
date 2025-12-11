import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// 🚨 FORCE DYNAMIC TO FIX BUILD ERROR
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Fetch total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (usersError) throw usersError;

    // Fetch total suppliers
    const { count: totalSuppliers, error: suppliersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'supplier');
    if (suppliersError) throw suppliersError;

    // Fetch total buyers
    const { count: totalBuyers, error: buyersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'buyer');
    if (buyersError) throw buyersError;

    // Fetch total RFQs
    const { count: totalRFQs, error: rfqsError } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true });
    if (rfqsError) throw rfqsError;

    // Fetch pending RFQs
    const { count: pendingRFQs, error: pendingError } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (pendingError) throw pendingError;

    // Fetch recent activity (last 10 RFQs, joined with user and supplier)
    const { data: recentRFQs, error: recentRFQsError } = await supabase
      .from('rfqs')
      .select('id, created_at, status, buyer_id, supplier_id, product_id, message')
      .order('created_at', { ascending: false })
      .limit(10);
    if (recentRFQsError) throw recentRFQsError;

    // Optionally, fetch recent supplier signups (last 5)
    const { data: recentSuppliers, error: recentSuppliersError } = await supabase
      .from('suppliers')
      .select('id, company_name, created_at, verification_status')
      .order('created_at', { ascending: false })
      .limit(5);
    if (recentSuppliersError) throw recentSuppliersError;

    const recentActivity = {
      recentRFQs,
      recentSuppliers,
    };

    return NextResponse.json({
      totalUsers,
      totalSuppliers,
      totalBuyers,
      totalRFQs,
      pendingRFQs,
      recentActivity,
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
