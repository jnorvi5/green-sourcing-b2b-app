/**
 * GET /api/admin/analytics
 * Aggregate analytics data for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check Admin Auth
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

    // 2. Fetch Data in Parallel
    const [
      { data: totalUsers },
      { data: dailySignups },
      { data: supplierActivation },
      { data: dailyRfqs },
      { data: rfqResponse },
      { data: epdStats },
      { data: autodeskStats },
      { data: emailStats },
      { data: mrrStats },
      { data: churnStats }
    ] = await Promise.all([
      supabase.from('analytics_total_users').select('*'),
      supabase.from('analytics_daily_signups').select('*').limit(30),
      supabase.from('analytics_supplier_activation').select('*').single(),
      supabase.from('analytics_daily_rfqs').select('*').limit(30),
      supabase.from('analytics_rfq_response_rate').select('*').single(),
      supabase.from('analytics_epd_stats').select('*').single(),
      supabase.from('analytics_autodesk_stats').select('*').single(),
      supabase.from('analytics_email_stats').select('*').single(),
      supabase.from('mrr_by_tier').select('*'), // From Stripe migration
      supabase.from('churn_last_30_days').select('*').single() // From Stripe migration
    ]);

    // 3. Format Response
    const response = {
      acquisition: {
        total_users: totalUsers,
        daily_signups: dailySignups,
        activation_rate: supplierActivation?.activation_rate_percent || 0
      },
      engagement: {
        daily_rfqs: dailyRfqs,
        response_rate: rfqResponse?.response_rate_percent || 0,
        total_rfqs: rfqResponse?.total_rfqs || 0
      },
      revenue: {
        mrr_breakdown: mrrStats,
        churn_rate: churnStats?.churn_rate_percent || 0
      },
      integration: {
        epd_coverage: epdStats?.epd_coverage_percent || 0,
        total_epds: epdStats?.total_epd_records || 0,
        autodesk_connections: autodeskStats?.total_connections || 0,
        autodesk_exports: autodeskStats?.total_exports || 0
      },
      email: {
        delivery_rate: emailStats?.delivery_rate || 0,
        open_rate: emailStats?.open_rate || 0,
        total_sent: emailStats?.total_sent || 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
