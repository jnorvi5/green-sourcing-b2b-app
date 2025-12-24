/**
 * Supplier Analytics Metrics Calculation
 * Provides utility functions for calculating supplier dashboard metrics
 */

import type { SupplierQuote, IncomingRfq } from '@/types/supplier-dashboard';

export interface MonthlyWinRate {
  month: string;
  winRate: number;
  totalQuotes: number;
  acceptedQuotes: number;
}

export interface ResponseTimeData {
  averageHours: number;
  status: 'good' | 'warning' | 'critical';
  color: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  growthPercent: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

/**
 * Calculate win rate by month for the last 6 months
 */
export function calculateMonthlyWinRate(
  quotes: SupplierQuote[]
): MonthlyWinRate[] {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  // Filter quotes from last 6 months
  const recentQuotes = quotes.filter((quote) => {
    const quoteDate = new Date(quote.responded_at);
    return quoteDate >= sixMonthsAgo;
  });

  // Group by month
  const monthlyData = new Map<string, { total: number; accepted: number }>();

  recentQuotes.forEach((quote) => {
    const date = new Date(quote.responded_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { total: 0, accepted: 0 });
    }

    const data = monthlyData.get(monthKey)!;
    data.total++;
    if (quote.status === 'accepted') {
      data.accepted++;
    }
  });

  // Convert to array and calculate win rate
  const result: MonthlyWinRate[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const data = monthlyData.get(monthKey) || { total: 0, accepted: 0 };
    const winRate = data.total > 0 ? (data.accepted / data.total) * 100 : 0;

    result.push({
      month: monthName,
      winRate: Math.round(winRate),
      totalQuotes: data.total,
      acceptedQuotes: data.accepted,
    });
  }

  return result;
}

/**
 * Calculate average response time from RFQ creation to quote submission
 */
export function calculateAverageResponseTime(
  quotes: SupplierQuote[],
  rfqs: IncomingRfq[]
): ResponseTimeData {
  // Create a map of RFQ IDs to their creation dates
  const rfqCreationDates = new Map<string, string>();
  rfqs.forEach((rfq) => {
    rfqCreationDates.set(rfq.id, rfq.created_at);
  });

  // Calculate response times for quotes where we have the RFQ creation date
  const responseTimes: number[] = [];

  quotes.forEach((quote) => {
    const rfqCreatedAt = rfqCreationDates.get(quote.rfq_id);
    if (rfqCreatedAt) {
      const createdDate = new Date(rfqCreatedAt);
      const respondedDate = new Date(quote.responded_at);
      const hoursDiff = (respondedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      if (hoursDiff >= 0) {
        responseTimes.push(hoursDiff);
      }
    }
  });

  const averageHours =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

  // Determine status and color
  let status: 'good' | 'warning' | 'critical' = 'good';
  let color = 'text-emerald-500';

  if (averageHours > 24) {
    status = 'critical';
    color = 'text-red-500';
  } else if (averageHours > 12) {
    status = 'warning';
    color = 'text-yellow-500';
  }

  return {
    averageHours: Math.round(averageHours * 10) / 10, // Round to 1 decimal
    status,
    color,
  };
}

/**
 * Calculate monthly revenue trends for the last 6 months
 */
export function calculateMonthlyRevenue(
  quotes: SupplierQuote[]
): MonthlyRevenue[] {
  const now = new Date();
  const monthlyRevenue = new Map<string, number>();

  // Filter accepted quotes and group by month
  quotes
    .filter((quote) => quote.status === 'accepted')
    .forEach((quote) => {
      const date = new Date(quote.responded_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyRevenue.has(monthKey)) {
        monthlyRevenue.set(monthKey, 0);
      }

      monthlyRevenue.set(monthKey, monthlyRevenue.get(monthKey)! + quote.quote_amount);
    });

  // Generate last 6 months data
  const result: MonthlyRevenue[] = [];
  let previousRevenue = 0;

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const revenue = monthlyRevenue.get(monthKey) || 0;
    const growthPercent =
      previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

    result.push({
      month: monthName,
      revenue,
      growthPercent: Math.round(growthPercent * 10) / 10,
    });

    previousRevenue = revenue;
  }

  return result;
}

/**
 * Calculate quote acceptance funnel stages
 */
export function calculateQuoteFunnel(
  rfqs: IncomingRfq[],
  quotes: SupplierQuote[]
): FunnelStage[] {
  const totalRfqs = rfqs.length;
  const quotesSubmitted = quotes.length;
  const quotesAccepted = quotes.filter((q) => q.status === 'accepted').length;

  return [
    {
      stage: 'Total RFQs',
      count: totalRfqs,
      percentage: 100,
    },
    {
      stage: 'Quotes Submitted',
      count: quotesSubmitted,
      percentage: totalRfqs > 0 ? (quotesSubmitted / totalRfqs) * 100 : 0,
    },
    {
      stage: 'Quotes Accepted',
      count: quotesAccepted,
      percentage: totalRfqs > 0 ? (quotesAccepted / totalRfqs) * 100 : 0,
    },
  ];
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(quotes: SupplierQuote[]): number {
  const totalQuotes = quotes.length;
  if (totalQuotes === 0) return 0;

  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted').length;
  return Math.round((acceptedQuotes / totalQuotes) * 100);
}

/**
 * Calculate revenue for current month
 */
export function calculateMonthlyRevenueTotal(quotes: SupplierQuote[]): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return quotes
    .filter((q) => {
      if (q.status !== 'accepted') return false;
      const date = new Date(q.responded_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, q) => sum + q.quote_amount, 0);
}

/**
 * Count active (non-expired) opportunities
 */
export function countActiveOpportunities(rfqs: IncomingRfq[]): number {
  const now = new Date();
  return rfqs.filter((rfq) => {
    if (!rfq.delivery_deadline) return true; // No deadline means still active
    const deadline = new Date(rfq.delivery_deadline);
    return deadline > now;
  }).length;
}
