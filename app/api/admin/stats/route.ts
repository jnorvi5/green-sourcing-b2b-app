import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
