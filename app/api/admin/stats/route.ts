import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering to fix build error
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch stats in parallel
    const [
      { count: totalUsers },
      { count: totalSuppliers },
      { count: totalBuyers },
      { count: totalRFQs },
      { count: pendingRFQs },
      { data: recentActivity }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('suppliers').select('*', { count: 'exact', head: true }),
      supabase.from('buyers').select('*', { count: 'exact', head: true }),
      supabase.from('rfqs').select('*', { count: 'exact', head: true }),
      supabase.from('rfqs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalSuppliers: totalSuppliers || 0,
      totalBuyers: totalBuyers || 0,
      totalRFQs: totalRFQs || 0,
      pendingRFQs: pendingRFQs || 0,
      recentActivity: recentActivity || []
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
