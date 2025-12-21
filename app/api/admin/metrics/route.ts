import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

    // Use service role to access all data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check Admin Auth (Client side token verification)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch Metrics
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // Parallelize queries
    const [
      verifiedSuppliers,
      activeRfqs,
      rfqResponses,
      profiles,
      rfqs,
      activityLog
    ] = await Promise.all([
      // Total Audits (Verified Suppliers)
      supabase.from('suppliers').select('id, created_at, tier').eq('tier', 'verified'),

      // Active RFQs
      supabase.from('rfqs').select('id, status').in('status', ['pending', 'responded']),

      // For GMV and Acceptance Rate
      supabase.from('rfq_responses').select('quote_amount, status'),

      // User Signups
      supabase.from('profiles').select('id, role, created_at'),

      // RFQs for Category Breakdown
      supabase.from('rfqs').select('id, material_specs, created_at'),

      // Recent Activity
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    // Process Data

    // 1. Total Audits (Verified Suppliers)
    const totalAudits = verifiedSuppliers.data?.length || 0;
    const auditsThisMonth = verifiedSuppliers.data?.filter(s => s.created_at >= firstDayOfMonth).length || 0;
    const auditsLastMonth = verifiedSuppliers.data?.filter(s => s.created_at >= firstDayOfLastMonth && s.created_at <= lastDayOfLastMonth).length || 0;

    // 2. Active RFQs
    const totalActiveRfqs = activeRfqs.data?.length || 0;

    // 3. Total GMV (Sum of accepted quotes)
    const totalGmv = rfqResponses.data
      ?.filter(r => r.status === 'accepted')
      .reduce((sum, r) => sum + (r.quote_amount || 0), 0) || 0;

    // 4. User Signups
    const architectsCount = profiles.data?.filter(p => p.role === 'architect').length || 0;
    const suppliersCount = profiles.data?.filter(p => p.role === 'supplier').length || 0;

    // 5. Charts Data

    // Audits per day (last 30 days)
    const auditsPerDayMap = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    verifiedSuppliers.data?.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString();
      if (new Date(s.created_at) >= thirtyDaysAgo) {
        auditsPerDayMap.set(date, (auditsPerDayMap.get(date) || 0) + 1);
      }
    });

    const auditsPerDay = Array.from(auditsPerDayMap.entries()).map(([date, count]) => ({ date, count }));

    // RFQs by Category
    const rfqsByCategoryMap = new Map<string, number>();
    rfqs.data?.forEach(r => {
      const specs = r.material_specs as { material_type?: string };
      const category = specs?.material_type || 'Unspecified';
      rfqsByCategoryMap.set(category, (rfqsByCategoryMap.get(category) || 0) + 1);
    });

    const rfqsByCategory = Array.from(rfqsByCategoryMap.entries()).map(([name, value]) => ({ name, value }));

    // Quote Acceptance Rate
    const totalQuotes = rfqResponses.data?.length || 0;
    const acceptedQuotes = rfqResponses.data?.filter(r => r.status === 'accepted').length || 0;
    const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    // Pipeline Status (Unverified Suppliers)
    // Note: This logic assumes 'suppliers' table has all verified/processed ones.
    // A better check would be unverified in suppliers table.

    const unverifiedSuppliers = await supabase.from('suppliers').select('id', { count: 'exact', head: true }).neq('tier', 'verified');
    const pipelineCount = unverifiedSuppliers.count || 0;

    return NextResponse.json({
      cards: {
        totalAudits,
        auditsThisMonth,
        auditsLastMonth,
        activeRfqs: totalActiveRfqs,
        totalGmv,
        userSignups: {
          architects: architectsCount,
          suppliers: suppliersCount
        }
      },
      charts: {
        auditsPerDay,
        rfqsByCategory,
        acceptanceRate
      },
      recentActivity: activityLog.data || [],
      pipeline: {
        pendingVerification: pipelineCount
      }
    });

  } catch (error) {
    console.error('Metrics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
