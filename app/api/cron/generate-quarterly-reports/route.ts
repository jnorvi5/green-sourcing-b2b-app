/**
 * Quarterly Report Generation Cron Job
 * POST /api/cron/generate-quarterly-reports
 * 
 * Runs on Jan 1, Apr 1, Jul 1, Oct 1 to generate quarterly reports.
 * Called by Vercel Cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateQuarterlyReportData, saveReport } from '@/lib/analyticsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for report generation

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

/**
 * Get previous quarter and year
 */
function getPreviousQuarter(): { quarter: number; year: number } {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Determine current quarter
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  
  // Previous quarter
  if (currentQuarter === 1) {
    return { quarter: 4, year: currentYear - 1 };
  }
  return { quarter: currentQuarter - 1, year: currentYear };
}

/**
 * Get quarter date range
 */
function getQuarterDateRange(quarter: number, year: number): { start: Date; end: Date } {
  const quarterStartMonth = (quarter - 1) * 3;
  const start = new Date(year, quarterStartMonth, 1);
  const end = new Date(year, quarterStartMonth + 3, 0); // Last day of quarter
  return { start, end };
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env['CRON_SECRET'];

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quarter, year } = getPreviousQuarter();
    const { start: startDate, end: endDate } = getQuarterDateRange(quarter, year);
    
    console.log(`Generating quarterly reports for Q${quarter} ${year}`);

    const results: { tier: string; success: boolean; reportId?: number; error?: string }[] = [];

    // Generate reports for each tier
    const tiers: ('Basic' | 'Professional' | 'Enterprise')[] = ['Basic', 'Professional', 'Enterprise'];
    
    for (const tier of tiers) {
      try {
        console.log(`Generating ${tier} report...`);
        
        // Generate report data
        const reportData = await generateQuarterlyReportData(quarter, year, tier);
        
        // Determine report title
        const reportTitle = `Q${quarter} ${year} ${tier} Market Intelligence Report`;
        
        // Save report
        const saveResult = await saveReport(
          'MarketTrends',
          reportTitle,
          reportData,
          startDate,
          endDate,
          tier,
          undefined, // materialTypeCategory - all materials
          'National' // geographicScope
        );

        if (saveResult.reportId) {
          results.push({ tier, success: true, reportId: saveResult.reportId });
          console.log(`${tier} report saved with ID: ${saveResult.reportId}`);
        } else {
          results.push({ tier, success: false, error: saveResult.error });
          console.error(`Failed to save ${tier} report:`, saveResult.error);
        }
      } catch (error) {
        results.push({ tier, success: false, error: String(error) });
        console.error(`Error generating ${tier} report:`, error);
      }
    }

    // Notify licensed customers about new reports
    const client = getSupabaseClient();
    if (client) {
      const { data: customers } = await client
        .from('data_license_customers')
        .select('customer_id, contact_email, contact_name, license_tier')
        .eq('status', 'Active');

      if (customers && customers.length > 0) {
        console.log(`Notifying ${customers.length} licensed customers...`);
        
        // In production, send emails via Zoho SMTP
        // For now, just log
        for (const customer of customers) {
          console.log(`Would notify ${customer.contact_email} about Q${quarter} ${year} ${customer.license_tier} report`);
        }
      }
    }

    // Generate material-specific reports for Enterprise customers
    const materialCategories = [
      'insulation', 'flooring', 'cladding', 'structural', 
      'roofing', 'windows', 'drywall'
    ];

    for (const category of materialCategories) {
      try {
        const reportData = await generateQuarterlyReportData(quarter, year, 'Enterprise');
        
        await saveReport(
          'MaterialDemand',
          `Q${quarter} ${year} ${category.charAt(0).toUpperCase() + category.slice(1)} Market Analysis`,
          reportData,
          startDate,
          endDate,
          'Enterprise',
          category,
          'National'
        );
        
        console.log(`Generated material-specific report for: ${category}`);
      } catch (error) {
        console.error(`Error generating ${category} report:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      quarter,
      year,
      results,
      message: `Generated ${results.filter(r => r.success).length}/${tiers.length} quarterly reports`,
    });
  } catch (error) {
    console.error('Quarterly report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate quarterly reports', details: String(error) },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for testing
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env['NODE_ENV'] === 'production') {
    return NextResponse.json({ error: 'Use POST endpoint for cron trigger' }, { status: 405 });
  }
  
  return POST(request);
}
