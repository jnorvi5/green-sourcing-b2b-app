"use client";

/**
 * Admin Analytics Dashboard
 * Real-time business metrics for GreenChainz
 */

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { createClient } from "@supabase/supabase-js";

// Types
interface AnalyticsData {
  acquisition: {
    total_users: { role: string; count: number }[];
    daily_signups: { date: string; role: string; count: number }[];
    activation_rate: number;
  };
  engagement: {
    daily_rfqs: { date: string; count: number }[];
    response_rate: number;
    total_rfqs: number;
  };
  revenue: {
    mrr_breakdown: { tier: string; total_mrr: number }[];
    churn_rate: number;
  };
  integration: {
    epd_coverage: number;
    total_epds: number;
    autodesk_connections: number;
    autodesk_exports: number;
  };
  email: {
    delivery_rate: number;
    open_rate: number;
    total_sent: number;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const supabase = createClient(
        process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
        process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <div className="p-8 text-center">Loading analytics...</div>;
  if (error)
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!data) return null;

  // Process data for charts
  const signupData = data.acquisition.daily_signups.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString(),
  }));

  const rfqData = data.engagement.daily_rfqs.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString(),
  }));

  const mrrData = data.revenue.mrr_breakdown.map((d) => ({
    name: d.tier,
    value: d.total_mrr,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          GreenChainz Analytics
        </h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Total Users"
            value={data.acquisition.total_users.reduce(
              (acc, curr) => acc + Number(curr.count),
              0
            )}
            subtext={`${data.acquisition.activation_rate}% Activation Rate`}
          />
          <KpiCard
            title="Total RFQs"
            value={data.engagement.total_rfqs}
            subtext={`${data.engagement.response_rate}% Response Rate`}
          />
          <KpiCard
            title="EPD Coverage"
            value={`${data.integration.epd_coverage}%`}
            subtext={`${data.integration.total_epds} Total Records`}
          />
          <KpiCard
            title="Email Delivery"
            value={`${data.email.delivery_rate}%`}
            subtext={`${data.email.open_rate}% Open Rate`}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Daily Signups</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    name="Signups"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RFQ Volume */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">RFQ Volume</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rfqData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="RFQs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">MRR by Tier</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mrrData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mrrData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Churn Rate: {data.revenue.churn_rate}%
              </p>
            </div>
          </div>

          {/* Integration Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Integration Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  Autodesk Connections
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {data.integration.autodesk_connections}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">
                  Revit Exports
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {data.integration.autodesk_exports}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total EPDs</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.integration.total_epds}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">
                  Emails Sent
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {data.email.total_sent}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      <p className="mt-1 text-sm text-gray-600">{subtext}</p>
    </div>
  );
}
