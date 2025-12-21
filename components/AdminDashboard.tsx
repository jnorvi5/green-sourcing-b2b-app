'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface MetricsData {
  cards: {
    totalAudits: number;
    auditsThisMonth: number;
    auditsLastMonth: number;
    activeRfqs: number;
    totalGmv: number;
    userSignups: {
      architects: number;
      suppliers: number;
    };
  };
  charts: {
    auditsPerDay: { date: string; count: number }[];
    rfqsByCategory: { name: string; value: number }[];
    acceptanceRate: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentActivity: any[];
  pipeline: {
    pendingVerification: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/metrics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data) return;

    // Flatten data for CSV
    const csvRows = [];

    // Headers
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Audits', data.cards.totalAudits]);
    csvRows.push(['Active RFQs', data.cards.activeRfqs]);
    csvRows.push(['Total GMV', data.cards.totalGmv]);
    csvRows.push(['Architects', data.cards.userSignups.architects]);
    csvRows.push(['Suppliers', data.cards.userSignups.suppliers]);
    csvRows.push(['Pending Verifications', data.pipeline.pendingVerification]);
    csvRows.push(['Acceptance Rate', `${data.charts.acceptanceRate.toFixed(2)}%`]);

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admin_dashboard_metrics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center text-white">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return null;

  // Calculate audit growth
  const auditGrowth = data.cards.auditsLastMonth > 0
    ? ((data.cards.auditsThisMonth - data.cards.auditsLastMonth) / data.cards.auditsLastMonth) * 100
    : 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={downloadCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Audits"
          value={data.cards.totalAudits}
          trend={`${auditGrowth >= 0 ? '+' : ''}${auditGrowth.toFixed(1)}% vs last month`}
          trendColor={auditGrowth >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <MetricCard
          title="Active RFQs"
          value={data.cards.activeRfqs}
          subtext="Currently processing"
        />
        <MetricCard
          title="Total GMV"
          value={`$${data.cards.totalGmv.toLocaleString()}`}
          subtext="Gross Merchandise Value"
        />
        <MetricCard
          title="User Signups"
          value={data.cards.userSignups.architects + data.cards.userSignups.suppliers}
          subtext={`${data.cards.userSignups.architects} Architects, ${data.cards.userSignups.suppliers} Suppliers`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audits Per Day */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Audits Per Day (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.auditsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RFQs by Category */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">RFQs by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.rfqsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.charts.rfqsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Acceptance Rate */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quote Acceptance Rate</h3>
          <div className="flex items-center justify-center h-48">
             <div className="text-center">
                <div className="text-5xl font-bold text-blue-500 mb-2">
                  {data.charts.acceptanceRate.toFixed(1)}%
                </div>
                <p className="text-gray-400">of quotes accepted</p>
             </div>
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Supplier Pipeline</h3>
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg mb-2">
             <span className="text-gray-300">Pending Verification</span>
             <span className="text-2xl font-bold text-yellow-500">{data.pipeline.pendingVerification}</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Suppliers waiting for audit.</p>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 overflow-hidden">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity, i) => (
                <div key={activity.id || i} className="text-sm border-b border-gray-700 pb-2 last:border-0">
                  <p className="text-white font-medium">{activity.action_type || 'Action'}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendColor?: string;
}

function MetricCard({ title, value, subtext, trend, trendColor }: MetricCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      {(subtext || trend) && (
        <div className="mt-2 flex items-center justify-between">
          {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
          {trend && <p className={`text-sm font-medium ${trendColor}`}>{trend}</p>}
        </div>
      )}
    </div>
  );
}
