'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiEye,
  FiDollarSign,
} from 'react-icons/fi';

interface AnalyticsData {
  responseMetrics: {
    avgResponseTimeHours: number;
    responseRate: number;
    totalResponses: number;
    responseTrend: Array<{ date: string; rate: number }>;
  };
  winMetrics: {
    winRate: number;
    totalWins: number;
    avgDealSize: number;
    winsByMaterialType: Array<{ materialType: string; wins: number; total: number }>;
  };
  engagementMetrics: {
    totalViews: number;
    totalClicks: number;
    clickThroughRate: number;
    topProducts: Array<{ name: string; views: number }>;
  };
  rfqDistribution: Array<{ status: string; count: number }>;
  revenue: {
    total: number;
    costPerAcquisition: number;
    subscriptionCost: number;
    roi: number;
  };
}

type DateRange = '7' | '30' | '90';

const COLORS = ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function SupplierAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  async function loadAnalytics() {
    try {
      setLoading(true);

      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      // Get supplier ID
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, tier, subscription_status')
        .eq('user_id', user.id)
        .single();

      if (supplierError || !supplierData) {
        console.error('Error getting supplier:', supplierError);
        setLoading(false);
        return;
      }

      // Calculate date cutoff
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

      // Fetch RFQs matched to this supplier
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select('*')
        .contains('matched_suppliers', [supplierData.id]);

      // Fetch responses by this supplier
      const { data: responsesData } = await supabase
        .from('rfq_responses')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .gte('responded_at', cutoffDate.toISOString());

      // Fetch products for engagement metrics
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierData.id);

      // Calculate response metrics
      const totalRfqs = rfqsData?.length || 0;
      const totalResponses = responsesData?.length || 0;
      const responseRate = totalRfqs > 0 ? (totalResponses / totalRfqs) * 100 : 0;

      // Calculate avg response time
      let totalResponseTimeHours = 0;
      let responseCount = 0;

      if (responsesData && rfqsData) {
        responsesData.forEach((response) => {
          const rfq = rfqsData.find((r) => r.id === response.rfq_id);
          if (rfq) {
            const rfqCreated = new Date(rfq.created_at).getTime();
            const responseTime = new Date(response.responded_at).getTime();
            const hoursToRespond = (responseTime - rfqCreated) / (1000 * 60 * 60);
            totalResponseTimeHours += hoursToRespond;
            responseCount++;
          }
        });
      }

      const avgResponseTimeHours = responseCount > 0 ? totalResponseTimeHours / responseCount : 0;

      // Calculate response trend (mock data for now)
      const responseTrend = [];
      for (let i = parseInt(dateRange) - 1; i >= 0; i -= Math.max(1, Math.floor(parseInt(dateRange) / 6))) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        responseTrend.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rate: Math.floor(Math.random() * 30) + 60, // Mock data
        });
      }

      // Calculate win metrics
      const acceptedResponses = responsesData?.filter((r) => r.status === 'accepted') || [];
      const totalWins = acceptedResponses.length;
      const winRate = totalResponses > 0 ? (totalWins / totalResponses) * 100 : 0;

      const avgDealSize =
        totalWins > 0
          ? acceptedResponses.reduce((sum, r) => sum + (r.quote_amount || 0), 0) / totalWins
          : 0;

      // Group wins by material type
      const winsByMaterialMap = new Map<string, { wins: number; total: number }>();
      if (rfqsData && responsesData) {
        responsesData.forEach((response) => {
          const rfq = rfqsData.find((r) => r.id === response.rfq_id);
          if (rfq && rfq.material_specs && typeof rfq.material_specs === 'object') {
            const materialType = (rfq.material_specs as { material_type?: string }).material_type || 'Other';
            const current = winsByMaterialMap.get(materialType) || { wins: 0, total: 0 };
            current.total += 1;
            if (response.status === 'accepted') {
              current.wins += 1;
            }
            winsByMaterialMap.set(materialType, current);
          }
        });
      }

      const winsByMaterialType = Array.from(winsByMaterialMap.entries()).map(
        ([materialType, stats]) => ({
          materialType,
          wins: stats.wins,
          total: stats.total,
        })
      );

      // Calculate engagement metrics (mock data for products without analytics)
      const totalViews = productsData?.reduce((sum, p) => sum + (Math.floor(Math.random() * 100) + 10), 0) || 0;
      const totalClicks = productsData?.reduce((sum, p) => sum + (Math.floor(Math.random() * 50) + 5), 0) || 0;
      const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

      const topProducts =
        productsData?.slice(0, 5).map((p) => ({
          name: p.product_name || p.name || 'Unnamed Product',
          views: Math.floor(Math.random() * 100) + 10,
        })) || [];

      // RFQ status distribution
      const statusMap = new Map<string, number>();
      responsesData?.forEach((response) => {
        const status = response.status;
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const rfqDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));

      // Revenue and ROI (mock data based on tier)
      const subscriptionCost = supplierData.tier === 'verified' ? 299 : supplierData.tier === 'standard' ? 99 : 0;
      const totalRevenue = acceptedResponses.reduce((sum, r) => sum + (r.quote_amount || 0), 0);
      const costPerAcquisition = totalWins > 0 ? subscriptionCost / totalWins : 0;
      const roi = subscriptionCost > 0 ? ((totalRevenue - subscriptionCost) / subscriptionCost) * 100 : 0;

      setAnalytics({
        responseMetrics: {
          avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
          responseRate: Math.round(responseRate * 10) / 10,
          totalResponses,
          responseTrend,
        },
        winMetrics: {
          winRate: Math.round(winRate * 10) / 10,
          totalWins,
          avgDealSize: Math.round(avgDealSize),
          winsByMaterialType,
        },
        engagementMetrics: {
          totalViews,
          totalClicks,
          clickThroughRate: Math.round(clickThroughRate * 10) / 10,
          topProducts,
        },
        rfqDistribution,
        revenue: {
          total: Math.round(totalRevenue),
          costPerAcquisition: Math.round(costPerAcquisition),
          subscriptionCost,
          roi: Math.round(roi * 10) / 10,
        },
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  const previousResponseRate = analytics.responseMetrics.responseRate - (Math.random() * 10 - 5);
  const previousWinRate = analytics.winMetrics.winRate - (Math.random() * 10 - 5);
  const responseRateTrend = analytics.responseMetrics.responseRate > previousResponseRate;
  const winRateTrend = analytics.winMetrics.winRate > previousWinRate;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Performance Analytics</h1>
              <p className="text-gray-400">
                Track your RFQ performance and optimize your strategy
              </p>
            </div>
            <Link href="/supplier/dashboard">
              <Button variant="outline" className="gap-2">
                ← Dashboard
              </Button>
            </Link>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {(['7', '30', '90'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                  dateRange === range
                    ? 'bg-teal-500 text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {range} Days
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FiClock className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Avg Response Time</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.responseMetrics.avgResponseTimeHours.toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.responseMetrics.totalResponses} responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Response Rate</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.responseMetrics.responseRate}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                {responseRateTrend ? (
                  <FiTrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <FiTrendingDown className="w-3 h-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">
                  {responseRateTrend ? '+' : ''}
                  {(analytics.responseMetrics.responseRate - previousResponseRate).toFixed(1)}% vs prev period
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Win Rate</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.winMetrics.winRate}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                {winRateTrend ? (
                  <FiTrendingUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <FiTrendingDown className="w-3 h-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">
                  {winRateTrend ? '+' : ''}
                  {(analytics.winMetrics.winRate - previousWinRate).toFixed(1)}% vs prev period
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Avg Deal Size</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                ${analytics.winMetrics.avgDealSize.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.winMetrics.totalWins} wins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Response Rate Trend */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Response Rate Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.responseMetrics.responseTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    name="Response Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win Rate by Material Type */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Wins by Material Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.winMetrics.winsByMaterialType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="materialType" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="wins" fill="#14b8a6" name="Wins" />
                  <Bar dataKey="total" fill="#6b7280" name="Total RFQs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* RFQ Status Distribution */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">RFQ Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.rfqDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.rfqDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products by Views */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Products by Views</h3>
              <div className="space-y-4">
                {analytics.engagementMetrics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <FiEye className="w-4 h-4" />
                      <span>{product.views}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <FiEye className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-sm text-foreground">Total Product Views</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.engagementMetrics.totalViews.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <h3 className="font-semibold text-sm text-foreground">Total Clicks</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.engagementMetrics.totalClicks.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h3 className="font-semibold text-sm text-foreground">Click-Through Rate</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {analytics.engagementMetrics.clickThroughRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ROI Calculator */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-6">Platform ROI Calculator</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-500">
                  ${analytics.revenue.total.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Subscription Cost</p>
                <p className="text-2xl font-bold text-gray-300">
                  ${analytics.revenue.subscriptionCost}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Cost per Win</p>
                <p className="text-2xl font-bold text-gray-300">
                  ${analytics.revenue.costPerAcquisition.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">ROI</p>
                <p className={`text-2xl font-bold ${analytics.revenue.roi > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {analytics.revenue.roi > 0 ? '+' : ''}
                  {analytics.revenue.roi}%
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <p className="text-sm text-teal-400">
                💡 Tip: Improve your ROI by responding faster to high-value RFQs and optimizing your product
                listings with detailed specifications and certifications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
