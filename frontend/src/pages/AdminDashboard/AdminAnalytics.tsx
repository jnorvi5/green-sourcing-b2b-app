/**
 * Admin Analytics Dashboard
 * 
 * Platform-wide metrics, user activity, transaction data,
 * and system health monitoring
 */
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface AdminStats {
  users: {
    total: number;
    buyers: number;
    suppliers: number;
    newThisMonth: number;
    activeToday: number;
    growth: number;
  };
  rfqs: {
    total: number;
    pending: number;
    quoted: number;
    won: number;
    avgResponseTime: string;
    thisMonth: number;
    growth: number;
  };
  products: {
    total: number;
    verified: number;
    pendingVerification: number;
    newThisMonth: number;
  };
  carbon: {
    totalTracked: number;
    avgReduction: number;
    epdVerifiedProducts: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    avgTransactionValue: number;
  };
  systemHealth: {
    apiLatency: number;
    uptime: number;
    errorRate: number;
    activeConnections: number;
  };
}

interface ActivityLog {
  id: string;
  type: 'user_signup' | 'rfq_created' | 'quote_sent' | 'product_added' | 'verification_complete';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Mock data
const MOCK_STATS: AdminStats = {
  users: {
    total: 2847,
    buyers: 1892,
    suppliers: 955,
    newThisMonth: 156,
    activeToday: 423,
    growth: 12.5,
  },
  rfqs: {
    total: 8934,
    pending: 342,
    quoted: 1205,
    won: 4521,
    avgResponseTime: '3.8 hours',
    thisMonth: 847,
    growth: 8.2,
  },
  products: {
    total: 12456,
    verified: 8234,
    pendingVerification: 432,
    newThisMonth: 234,
  },
  carbon: {
    totalTracked: 45600000, // kg CO2e
    avgReduction: 23.5,
    epdVerifiedProducts: 6234,
  },
  revenue: {
    thisMonth: 234500,
    lastMonth: 198700,
    growth: 18.0,
    avgTransactionValue: 45600,
  },
  systemHealth: {
    apiLatency: 124,
    uptime: 99.98,
    errorRate: 0.02,
    activeConnections: 1247,
  },
};

const MOCK_ACTIVITY: ActivityLog[] = [
  { id: '1', type: 'user_signup', message: 'New supplier registered: EcoSteel Solutions', timestamp: '2 minutes ago' },
  { id: '2', type: 'rfq_created', message: 'RFQ-2024-0847 created by GreenBuild Architecture', timestamp: '5 minutes ago' },
  { id: '3', type: 'quote_sent', message: 'Quote submitted for RFQ-2024-0842', timestamp: '12 minutes ago' },
  { id: '4', type: 'verification_complete', message: 'EPD verification completed for Low-Carbon Concrete Mix', timestamp: '18 minutes ago' },
  { id: '5', type: 'product_added', message: 'New product added: Recycled Aluminum Framing System', timestamp: '25 minutes ago' },
  { id: '6', type: 'user_signup', message: 'New buyer registered: Sustainable Homes LLC', timestamp: '32 minutes ago' },
  { id: '7', type: 'rfq_created', message: 'RFQ-2024-0846 created by ModernArch Group', timestamp: '45 minutes ago' },
  { id: '8', type: 'quote_sent', message: 'Quote submitted for RFQ-2024-0840', timestamp: '1 hour ago' },
];

const ACTIVITY_ICONS = {
  user_signup: UserGroupIcon,
  rfq_created: DocumentTextIcon,
  quote_sent: CurrencyDollarIcon,
  product_added: SparklesIcon,
  verification_complete: CheckCircleIcon,
};

const ACTIVITY_COLORS = {
  user_signup: 'text-blue-400 bg-blue-400/10',
  rfq_created: 'text-purple-400 bg-purple-400/10',
  quote_sent: 'text-emerald-400 bg-emerald-400/10',
  product_added: 'text-yellow-400 bg-yellow-400/10',
  verification_complete: 'text-green-400 bg-green-400/10',
};

export default function AdminAnalytics() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats(MOCK_STATS);
      setActivity(MOCK_ACTIVITY);
      setLoading(false);
    };
    fetchData();
  }, [timeRange]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-emerald-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Platform analytics and system metrics</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            {(['24h', '7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Users */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <UserGroupIcon className="w-8 h-8 text-blue-400" />
              <span className={`flex items-center gap-1 text-sm ${stats.users.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.users.growth >= 0 ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                {Math.abs(stats.users.growth)}%
              </span>
            </div>
            <div className="text-3xl font-bold">{stats.users.total.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Users</div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-sm">
              <span className="text-gray-400">{stats.users.buyers.toLocaleString()} Buyers</span>
              <span className="text-gray-400">{stats.users.suppliers.toLocaleString()} Suppliers</span>
            </div>
          </div>

          {/* RFQs */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <DocumentTextIcon className="w-8 h-8 text-purple-400" />
              <span className={`flex items-center gap-1 text-sm ${stats.rfqs.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.rfqs.growth >= 0 ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                {Math.abs(stats.rfqs.growth)}%
              </span>
            </div>
            <div className="text-3xl font-bold">{stats.rfqs.total.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total RFQs</div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-sm">
              <span className="text-yellow-400">{stats.rfqs.pending} Pending</span>
              <span className="text-green-400">{stats.rfqs.won.toLocaleString()} Won</span>
            </div>
          </div>

          {/* Products */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <BuildingOffice2Icon className="w-8 h-8 text-emerald-400" />
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <ExclamationTriangleIcon className="w-4 h-4" />
                {stats.products.pendingVerification} pending
              </span>
            </div>
            <div className="text-3xl font-bold">{stats.products.total.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Products</div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-sm">
              <span className="text-green-400">{stats.products.verified.toLocaleString()} Verified</span>
              <span className="text-gray-400">+{stats.products.newThisMonth} this month</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <CurrencyDollarIcon className="w-8 h-8 text-yellow-400" />
              <span className={`flex items-center gap-1 text-sm ${stats.revenue.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.revenue.growth >= 0 ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                {Math.abs(stats.revenue.growth)}%
              </span>
            </div>
            <div className="text-3xl font-bold">${(stats.revenue.thisMonth / 1000).toFixed(1)}k</div>
            <div className="text-sm text-gray-400">Revenue This Month</div>
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between text-sm">
              <span className="text-gray-400">Avg: ${(stats.revenue.avgTransactionValue / 1000).toFixed(1)}k</span>
              <span className="text-gray-400">Last: ${(stats.revenue.lastMonth / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Carbon Impact */}
            <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
                Environmental Impact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400">
                    {(stats.carbon.totalTracked / 1000000).toFixed(1)}k
                  </div>
                  <div className="text-sm text-emerald-300">tonnes CO2e tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400">
                    {stats.carbon.avgReduction}%
                  </div>
                  <div className="text-sm text-emerald-300">avg carbon reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400">
                    {stats.carbon.epdVerifiedProducts.toLocaleString()}
                  </div>
                  <div className="text-sm text-emerald-300">EPD verified products</div>
                </div>
              </div>
            </div>

            {/* User Growth Chart Placeholder */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5 text-blue-400" />
                User Growth
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <div className="text-center text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart visualization would go here</p>
                  <p className="text-sm">Integrate with Chart.js or Recharts</p>
                </div>
              </div>
            </div>

            {/* RFQ Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                RFQ Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.rfqs.pending}</div>
                  <div className="text-xs text-gray-400">Pending</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.rfqs.quoted}</div>
                  <div className="text-xs text-gray-400">Quoted</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.rfqs.won.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Won</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{stats.rfqs.avgResponseTime}</div>
                  <div className="text-xs text-gray-400">Avg Response</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* System Health */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                System Health
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-green-400 font-medium">{stats.systemHealth.uptime}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats.systemHealth.uptime}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Latency</span>
                  <span className={stats.systemHealth.apiLatency < 200 ? 'text-green-400' : 'text-yellow-400'}>
                    {stats.systemHealth.apiLatency}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Error Rate</span>
                  <span className={stats.systemHealth.errorRate < 0.1 ? 'text-green-400' : 'text-red-400'}>
                    {stats.systemHealth.errorRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active Connections</span>
                  <span className="text-blue-400">{stats.systemHealth.activeConnections.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                Recent Activity
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activity.map(item => {
                  const Icon = ACTIVITY_ICONS[item.type];
                  const colorClass = ACTIVITY_COLORS[item.type];
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{item.message}</p>
                        <p className="text-xs text-gray-500">{item.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors">
                  Export Report
                </button>
                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  Review Pending Verifications
                </button>
                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  Manage Users
                </button>
                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  System Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
