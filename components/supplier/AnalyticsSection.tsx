'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  MonthlyWinRate,
  ResponseTimeData,
  MonthlyRevenue,
  FunnelStage,
} from '@/lib/analytics/supplierMetrics';

interface AnalyticsSectionProps {
  winRateData: MonthlyWinRate[];
  responseTime: ResponseTimeData;
  revenueData: MonthlyRevenue[];
  funnelData: FunnelStage[];
  loading?: boolean;
}

export function AnalyticsSection({
  winRateData,
  responseTime,
  revenueData,
  funnelData,
  loading = false,
}: AnalyticsSectionProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-80">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-64 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Last 6 months</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full" />
              Quote Win Rate
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                      return [value, name];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500" />
                <span>Win Rate Trend</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Metrics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Average Response Time
            </h3>
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 mb-6">
                {/* Circular Progress */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke={
                      responseTime.status === 'good'
                        ? '#10b981'
                        : responseTime.status === 'warning'
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${Math.min((responseTime.averageHours / 48) * 502, 502)} 502`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={`text-4xl font-bold ${responseTime.color}`}>
                    {responseTime.averageHours}h
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Average</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-2">
                  {responseTime.status === 'good'
                    ? '✅ Excellent Response Time'
                    : responseTime.status === 'warning'
                    ? '⚠️ Could Be Faster'
                    : '🚨 Needs Improvement'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: &lt; 24 hours for best results
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Revenue Trends
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
              <span>Total accepted quotes revenue over time</span>
            </div>
          </CardContent>
        </Card>

        {/* Quote Acceptance Funnel */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              Quote Funnel
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{ fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      return [
                        `${value} (${props.payload.percentage.toFixed(1)}%)`,
                        'Count',
                      ];
                    }}
                  />
                  <Bar dataKey="count" fill="#a78bfa" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                    <span className="text-foreground font-medium w-12 text-right">
                      {stage.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
