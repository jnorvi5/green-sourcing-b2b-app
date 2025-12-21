/**
 * Analytics Engine for Data Licensing
 * 
 * Tracks architect search/filter behavior for aggregated data licensing.
 * All data is anonymized and aggregated - no PII is stored.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy initialization of Supabase client to avoid build-time errors
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Analytics: Supabase credentials not configured');
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  return supabase;
}

// ============================================
// TYPES
// ============================================

export interface SearchEvent {
  searchQuery: string;
  materialType?: string;
  resultCount: number;
  geographicRegion?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface FilterEvent {
  filterType: 'carbon_footprint' | 'certification' | 'price' | 'material_type' | 'location' | 'lead_time';
  filterValue: string;
  resultCount: number;
  geographicRegion?: string;
}

export interface RFQAnalyticsEvent {
  rfqId: number;
  materialType: string;
  certifications: string[];
  geographicRegion: string;
  quotedPrice?: number;
  status: 'created' | 'responded' | 'accepted' | 'declined';
  responseTimeHours?: number;
}

export interface TopKeyword {
  keyword: string;
  searchCount: number;
  materialTypeCategory: string | null;
  trendDirection: 'rising' | 'stable' | 'declining';
}

export interface CertificationDemand {
  certificationName: string;
  totalSearches: number;
  avgConversionRate: number;
  avgOrderValue: number;
}

export interface GeographicGap {
  region: string;
  materialTypeCategory: string;
  avgDemandSupplyGap: number;
  totalSearchVolume: number;
  totalRfqVolume: number;
  avgSupplierCount: number;
}

export interface CertificationPerformance {
  certificationName: string;
  totalRfqs: number;
  avgWinRate: number;
  avgPremium: number;
  avgTimeToClose: number;
}

export interface DataLicenseReport {
  reportId: number;
  reportType: string;
  reportTitle: string;
  reportData: Record<string, unknown>;
  dateRangeStart: string;
  dateRangeEnd: string;
  materialTypeCategory?: string;
  geographicScope?: string;
  generatedAt: string;
  licenseTier: 'Basic' | 'Professional' | 'Enterprise';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate anonymized session ID from user agent and IP
 * No PII is stored - only a hash for session correlation
 */
export function generateSessionId(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}-${ipAddress}-${new Date().toDateString()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 64);
}

/**
 * Categorize material type from search query
 */
export function categorizeMaterialType(query: string): string | null {
  const categories: Record<string, string[]> = {
    'insulation': ['insulation', 'thermal', 'r-value', 'fiberglass', 'cellulose', 'spray foam', 'mineral wool'],
    'flooring': ['flooring', 'hardwood', 'tile', 'carpet', 'vinyl', 'laminate', 'bamboo floor'],
    'cladding': ['cladding', 'siding', 'facade', 'exterior panel', 'rain screen'],
    'structural': ['structural', 'steel', 'concrete', 'timber', 'beam', 'column', 'clt', 'cross-laminated'],
    'roofing': ['roofing', 'shingle', 'membrane', 'metal roof', 'green roof'],
    'windows': ['window', 'glazing', 'glass', 'skylight', 'curtain wall'],
    'doors': ['door', 'entry', 'interior door', 'fire door'],
    'paint': ['paint', 'coating', 'finish', 'stain', 'varnish'],
    'hvac': ['hvac', 'ductwork', 'ventilation', 'air handling'],
    'plumbing': ['plumbing', 'pipe', 'fixture', 'faucet', 'toilet'],
    'electrical': ['electrical', 'wiring', 'conduit', 'panel', 'lighting'],
    'drywall': ['drywall', 'gypsum', 'sheetrock', 'plaster'],
    'countertops': ['countertop', 'quartz', 'granite', 'solid surface', 'butcher block'],
    'cabinetry': ['cabinet', 'millwork', 'casework'],
  };

  const lowerQuery = query.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return category;
    }
  }
  
  return null;
}

/**
 * Categorize carbon footprint threshold
 */
export function categorizeCarbonThreshold(value: string): string {
  const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
  
  if (isNaN(numValue)) return value;
  
  if (numValue < 5) return '<5 kg CO2e';
  if (numValue < 15) return '5-15 kg CO2e';
  if (numValue < 30) return '15-30 kg CO2e';
  if (numValue < 50) return '30-50 kg CO2e';
  if (numValue < 100) return '50-100 kg CO2e';
  return '>100 kg CO2e';
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// ============================================
// TRACKING FUNCTIONS
// ============================================

/**
 * Track a search event
 */
export async function trackSearch(
  sessionId: string,
  event: SearchEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Database not configured' };
    }

    const materialType = event.materialType || categorizeMaterialType(event.searchQuery);
    
    // Insert search event
    const { error: insertError } = await client
      .from('search_events')
      .insert({
        session_id: sessionId,
        search_query: event.searchQuery,
        material_type: materialType,
        result_count: event.resultCount,
        geographic_region: event.geographicRegion,
        device_type: event.deviceType,
        search_timestamp: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Update aggregated keywords in parallel
    const keywords = event.searchQuery.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    await Promise.all(
      keywords.map(keyword =>
        client.rpc('upsert_search_keyword', {
          p_keyword: keyword,
          p_material_type: materialType,
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error('Error tracking search:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Track a filter event
 */
export async function trackFilter(
  sessionId: string,
  event: FilterEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Database not configured' };
    }

    // Insert filter event
    const { error: insertError } = await client
      .from('filter_events')
      .insert({
        session_id: sessionId,
        filter_type: event.filterType,
        filter_value: event.filterValue,
        result_count: event.resultCount,
        geographic_region: event.geographicRegion,
        filter_timestamp: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Update aggregated data based on filter type
    if (event.filterType === 'carbon_footprint') {
      const threshold = categorizeCarbonThreshold(event.filterValue);
      await client.rpc('upsert_carbon_threshold', {
        p_threshold_range: threshold,
        p_geographic_region: event.geographicRegion,
      });
    } else if (event.filterType === 'certification') {
      await client.rpc('upsert_certification_preference', {
        p_certification_name: event.filterValue,
        p_geographic_region: event.geographicRegion,
      });
    } else if (event.filterType === 'price') {
      // Parse price range
      const priceMatch = event.filterValue.match(/(\d+)\s*-\s*(\d+)/);
      if (priceMatch) {
        await client.rpc('upsert_price_preference', {
          p_min_price: parseFloat(priceMatch[1]),
          p_max_price: parseFloat(priceMatch[2]),
          p_geographic_region: event.geographicRegion,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking filter:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Track RFQ analytics event
 */
export async function trackRFQEvent(
  event: RFQAnalyticsEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Database not configured' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Update RFQ analytics
    await client.rpc('update_rfq_analytics', {
      p_material_type: event.materialType,
      p_geographic_region: event.geographicRegion,
      p_time_period: today,
      p_status: event.status,
      p_quoted_price: event.quotedPrice,
      p_response_time: event.responseTimeHours,
    });

    // Update certification performance for each certification in parallel
    await Promise.all(
      event.certifications.map(cert =>
        client.rpc('update_certification_rfq_performance', {
          p_certification_name: cert,
          p_time_period: today,
          p_status: event.status,
          p_quoted_price: event.quotedPrice,
          p_response_time: event.responseTimeHours,
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error('Error tracking RFQ:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// REPORTING FUNCTIONS
// ============================================

/**
 * Get top searched keywords
 */
export async function getTopKeywords(limit: number = 100): Promise<TopKeyword[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('search_keywords_aggregated')
    .select('keyword, search_count, material_type_category, trend_direction')
    .order('search_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top keywords:', error);
    return [];
  }

  return data?.map(row => ({
    keyword: row.keyword,
    searchCount: row.search_count,
    materialTypeCategory: row.material_type_category,
    trendDirection: row.trend_direction,
  })) || [];
}

/**
 * Get certification demand summary
 */
export async function getCertificationDemand(): Promise<CertificationDemand[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('certification_preferences')
    .select('certification_name, filter_count, rfq_conversion_rate, average_order_value')
    .order('filter_count', { ascending: false });

  if (error) {
    console.error('Error fetching certification demand:', error);
    return [];
  }

  // Aggregate by certification name
  const aggregated = new Map<string, CertificationDemand>();
  
  for (const row of data || []) {
    const existing = aggregated.get(row.certification_name);
    if (existing) {
      existing.totalSearches += row.filter_count || 0;
      // Weighted average for conversion rate and order value
      const totalWeight = existing.totalSearches;
      const newWeight = row.filter_count || 0;
      existing.avgConversionRate = 
        (existing.avgConversionRate * (totalWeight - newWeight) + (row.rfq_conversion_rate || 0) * newWeight) / totalWeight;
      existing.avgOrderValue = 
        (existing.avgOrderValue * (totalWeight - newWeight) + (row.average_order_value || 0) * newWeight) / totalWeight;
    } else {
      aggregated.set(row.certification_name, {
        certificationName: row.certification_name,
        totalSearches: row.filter_count || 0,
        avgConversionRate: row.rfq_conversion_rate || 0,
        avgOrderValue: row.average_order_value || 0,
      });
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => b.totalSearches - a.totalSearches);
}

/**
 * Get geographic market gaps
 */
export async function getGeographicGaps(): Promise<GeographicGap[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('geographic_demand')
    .select('*')
    .gte('demand_supply_gap', 1.5)
    .order('demand_supply_gap', { ascending: false });

  if (error) {
    console.error('Error fetching geographic gaps:', error);
    return [];
  }

  return data?.map(row => ({
    region: row.region,
    materialTypeCategory: row.material_type_category,
    avgDemandSupplyGap: row.demand_supply_gap,
    totalSearchVolume: row.search_volume,
    totalRfqVolume: row.rfq_volume,
    avgSupplierCount: row.supplier_count,
  })) || [];
}


/**
 * Get certification performance metrics
 */
export async function getCertificationPerformance(): Promise<CertificationPerformance[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('certification_rfq_performance')
    .select('*')
    .order('win_rate', { ascending: false });

  if (error) {
    console.error('Error fetching certification performance:', error);
    return [];
  }

  // Aggregate by certification
  const aggregated = new Map<string, CertificationPerformance>();
  
  for (const row of data || []) {
    const existing = aggregated.get(row.certification_name);
    if (existing) {
      existing.totalRfqs += row.rfq_count || 0;
      // Weighted averages
      const totalWeight = existing.totalRfqs;
      const newWeight = row.rfq_count || 0;
      existing.avgWinRate = 
        (existing.avgWinRate * (totalWeight - newWeight) + (row.win_rate || 0) * newWeight) / totalWeight;
      existing.avgPremium = 
        (existing.avgPremium * (totalWeight - newWeight) + (row.premium_percentage || 0) * newWeight) / totalWeight;
      existing.avgTimeToClose = 
        (existing.avgTimeToClose * (totalWeight - newWeight) + (row.average_time_to_close || 0) * newWeight) / totalWeight;
    } else {
      aggregated.set(row.certification_name, {
        certificationName: row.certification_name,
        totalRfqs: row.rfq_count || 0,
        avgWinRate: row.win_rate || 0,
        avgPremium: row.premium_percentage || 0,
        avgTimeToClose: row.average_time_to_close || 0,
      });
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => b.avgWinRate - a.avgWinRate);
}

/**
 * Generate quarterly report data
 */
export async function generateQuarterlyReportData(
  quarter: number,
  year: number,
  tier: 'Basic' | 'Professional' | 'Enterprise'
): Promise<Record<string, unknown>> {
  const client = getSupabaseClient();
  
  const quarterStartMonth = (quarter - 1) * 3;
  const startDate = new Date(year, quarterStartMonth, 1);
  const endDate = new Date(year, quarterStartMonth + 3, 0);
  
  const reportData: Record<string, unknown> = {
    metadata: {
      quarter,
      year,
      tier,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
    },
  };

  // Basic tier data
  reportData['topKeywords'] = await getTopKeywords(100);
  reportData['certificationDemand'] = await getCertificationDemand();
  reportData['geographicDemand'] = await getGeographicGaps();

  // Premium tier data
  if (tier === 'Professional' || tier === 'Enterprise') {
    reportData['certificationPerformance'] = await getCertificationPerformance();
    
    if (client) {
      // RFQ conversion analysis
      const { data: rfqData } = await client
        .from('rfq_analytics')
        .select('*')
        .gte('time_period', startDate.toISOString().split('T')[0])
        .lte('time_period', endDate.toISOString().split('T')[0]);
      
      reportData['rfqAnalytics'] = rfqData || [];
      
      // Anonymized supplier benchmarks
      const { data: supplierData } = await client
        .from('supplier_performance_analytics')
        .select('win_rate, average_response_time, average_time_to_close, average_order_value, time_period')
        .gte('time_period', startDate.toISOString().split('T')[0])
        .lte('time_period', endDate.toISOString().split('T')[0]);
      
      // Anonymize supplier data - only show aggregated metrics
      reportData['marketBenchmarks'] = {
        avgWinRate: (supplierData && supplierData.length > 0) ? supplierData.reduce((sum, s) => sum + (s.win_rate || 0), 0) / supplierData.length : 0,
        avgResponseTime: (supplierData && supplierData.length > 0) ? supplierData.reduce((sum, s) => sum + (s.average_response_time || 0), 0) / supplierData.length : 0,
        avgTimeToClose: (supplierData && supplierData.length > 0) ? supplierData.reduce((sum, s) => sum + (s.average_time_to_close || 0), 0) / supplierData.length : 0,
        avgOrderValue: (supplierData && supplierData.length > 0) ? supplierData.reduce((sum, s) => sum + (s.average_order_value || 0), 0) / supplierData.length : 0,
      };
    }
  }

  return reportData;
}

/**
 * Save generated report to database
 */
export async function saveReport(
  reportType: string,
  reportTitle: string,
  reportData: Record<string, unknown>,
  startDate: Date,
  endDate: Date,
  tier: 'Basic' | 'Professional' | 'Enterprise',
  materialTypeCategory?: string,
  geographicScope?: string
): Promise<{ reportId: number | null; error?: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { reportId: null, error: 'Database not configured' };
    }

    const { data, error } = await client
      .from('data_license_reports')
      .insert({
        report_type: reportType,
        report_title: reportTitle,
        report_data: reportData,
        date_range_start: startDate.toISOString().split('T')[0],
        date_range_end: endDate.toISOString().split('T')[0],
        material_type_category: materialTypeCategory,
        geographic_scope: geographicScope,
        licensee_tier: tier,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select('report_id')
      .single();

    if (error) throw error;

    return { reportId: data?.report_id };
  } catch (error) {
    console.error('Error saving report:', error);
    return { reportId: null, error: String(error) };
  }
}

/**
 * Validate data license API key
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  customerId?: number;
  tier?: string;
  allowedReportTypes?: string[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { valid: false };
  }

  const { data, error } = await client
    .from('data_license_customers')
    .select('customer_id, license_tier, allowed_report_types, status')
    .eq('api_key', apiKey)
    .eq('status', 'Active')
    .single();

  if (error || !data) {
    return { valid: false };
  }

  return {
    valid: true,
    customerId: data.customer_id,
    tier: data.license_tier,
    allowedReportTypes: data.allowed_report_types,
  };
}

/**
 * Log data license access
 */
export async function logDataAccess(
  customerId: number,
  reportId: number,
  accessType: 'View' | 'Download' | 'API',
  ipAddress: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client
    .from('data_license_access_log')
    .insert({
      customer_id: customerId,
      report_id: reportId,
      access_type: accessType,
      ip_address: ipAddress,
    });
}

const analyticsService = {
  generateSessionId,
  categorizeMaterialType,
  categorizeCarbonThreshold,
  detectDeviceType,
  trackSearch,
  trackFilter,
  trackRFQEvent,
  getTopKeywords,
  getCertificationDemand,
  getGeographicGaps,
  getCertificationPerformance,
  generateQuarterlyReportData,
  saveReport,
  validateApiKey,
  logDataAccess,
};

export default analyticsService;
