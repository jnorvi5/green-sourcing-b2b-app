/**
 * Analytics Reports API
 * GET /api/analytics/reports
 * 
 * Returns aggregated analytics reports for licensed customers.
 * Requires valid API key for access.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateApiKey,
  logDataAccess,
  getTopKeywords,
  getCertificationDemand,
  getGeographicGaps,
  getCertificationPerformance,
  generateQuarterlyReportData,
} from '@/lib/analyticsService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy initialization to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  
  if (!url || !key) return null;
  
  supabase = createClient(url, key);
  return supabase;
}

export async function GET(request: NextRequest) {
  try {
    // Check for API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '') || 
                   request.nextUrl.searchParams.get('api_key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Include in Authorization header or api_key query param.' },
        { status: 401 }
      );
    }

    // Validate API key
    const validation = await validateApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired API key' },
        { status: 403 }
      );
    }

    const { customerId, tier, allowedReportTypes } = validation;

    // Get query parameters
    const reportType = request.nextUrl.searchParams.get('type') || 'all';
    const quarter = parseInt(request.nextUrl.searchParams.get('quarter') || '0');
    const year = parseInt(request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString());

    // Check if report type is allowed for this tier
    if (allowedReportTypes && !allowedReportTypes.includes(reportType) && reportType !== 'all') {
      return NextResponse.json(
        { error: `Report type '${reportType}' not available for your license tier` },
        { status: 403 }
      );
    }

    let reportData: Record<string, unknown> = {};
    const licenseTier = tier as 'Basic' | 'Professional' | 'Enterprise';

    // If specific quarter requested, generate quarterly report
    if (quarter >= 1 && quarter <= 4) {
      reportData = await generateQuarterlyReportData(quarter, year, licenseTier);
    } else {
      // Return current data based on report type
      switch (reportType) {
        case 'keywords':
          reportData['topKeywords'] = await getTopKeywords(100);
          break;
        
        case 'certifications':
          reportData['certificationDemand'] = await getCertificationDemand();
          if (licenseTier === 'Professional' || licenseTier === 'Enterprise') {
            reportData['certificationPerformance'] = await getCertificationPerformance();
          }
          break;
        
        case 'geographic':
          reportData['geographicGaps'] = await getGeographicGaps();
          break;
        
        case 'all':
        default:
          // Return all available data for tier
          reportData['topKeywords'] = await getTopKeywords(100);
          reportData['certificationDemand'] = await getCertificationDemand();
          reportData['geographicGaps'] = await getGeographicGaps();
          
          if (licenseTier === 'Professional' || licenseTier === 'Enterprise') {
            reportData['certificationPerformance'] = await getCertificationPerformance();
            
            // Get RFQ analytics for last 90 days
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            
            const client = getSupabaseClient();
            if (client) {
              const { data: rfqData } = await client
                .from('rfq_analytics')
                .select('*')
                .gte('time_period', ninetyDaysAgo.toISOString().split('T')[0]);
              
              reportData['rfqAnalytics'] = rfqData || [];
            }
          }
          break;
      }
    }

    // Add metadata
    reportData['metadata'] = {
      generatedAt: new Date().toISOString(),
      tier: licenseTier,
      reportType,
      ...(quarter >= 1 && quarter <= 4 ? { quarter, year } : {}),
    };

    // Log access (reportId -1 indicates general API access, not a specific report)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0]?.trim() || 'unknown' : 'unknown';
    
    if (customerId) {
      // Use -1 to indicate this is a general API access, not a specific report download
      await logDataAccess(customerId, -1, 'API', ipAddress);
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Analytics reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get list of available reports
 */
export async function OPTIONS(_request: NextRequest) {
  return NextResponse.json({
    availableReports: [
      { type: 'keywords', description: 'Top 100 searched keywords with trends', tier: 'Basic' },
      { type: 'certifications', description: 'Certification demand and performance analysis', tier: 'Basic' },
      { type: 'geographic', description: 'Geographic demand heatmap and market gaps', tier: 'Basic' },
      { type: 'rfq', description: 'RFQ conversion and competitive analysis', tier: 'Professional' },
      { type: 'all', description: 'All available reports for your tier', tier: 'Basic' },
    ],
    queryParameters: {
      type: 'Report type (keywords, certifications, geographic, rfq, all)',
      quarter: 'Quarter number (1-4) for quarterly report',
      year: 'Year for quarterly report (default: current year)',
    },
    authentication: 'Include API key in Authorization header as Bearer token or api_key query parameter',
  });
}
