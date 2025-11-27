import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    ShoppingCart,
    DollarSign,
    Leaf,
    Bell,
    Activity,
    RefreshCw,
    BarChart3,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Calendar,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

interface KPIData {
    kpis: {
        gmv: number;
        totalOrders: number;
        avgOrderValue: number;
        totalBuyers: number;
        totalSuppliers: number;
        newBuyers: number;
        newSuppliers: number;
        dau: number;
        mau: number;
        totalProducts: number;
        avgCarbonScore: number;
        totalRFQs: number;
        rfqResponseRate: number;
        rfqWinRate: number;
        totalCarbonSaved: number;
    };
    alerts: Array<{
        _id: string;
        name: string;
        status: string;
        kpiName: string;
        condition: string;
        threshold: number;
        currentValue?: number;
        lastTriggered?: string;
    }>;
    snapshots: Array<{
        _id: string;
        periodDate: string;
        platform?: {
            gmv: number;
            orders: number;
            activeUsers: number;
            carbonSaved: number;
        };
    }>;
    trends: {
        gmvChange?: number;
        ordersChange?: number;
        activeUsersChange?: number;
    };
}

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
    target?: number;
    unit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    icon,
    color,
    target,
    unit = '',
}) => {
    const isPositive = change !== undefined && change >= 0;
    const progressPercent = target ? Math.min((Number(value) / target) * 100, 100) : 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
                {change !== undefined && (
                    <div
                        className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="w-4 h-4" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
                </p>
            </div>
            {target && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Target: {target.toLocaleString()}</span>
                        <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full ${progressPercent >= 100
                                    ? 'bg-green-500'
                                    : progressPercent >= 70
                                        ? 'bg-blue-500'
                                        : 'bg-amber-500'
                                }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const KPIDashboard: React.FC = () => {
    const [data, setData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const response = await fetch(`/api/kpi?type=dashboard&period=${period}`);
            if (!response.ok) throw new Error('Failed to fetch KPI data');
            const result = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [period]);

    const triggerSnapshot = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('/api/kpi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'snapshot', snapshotType: 'admin' }),
            });
            if (response.ok) {
                await fetchData();
            }
        } catch (err) {
            console.error('Failed to create snapshot:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <DashboardSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                        <span className="text-gray-600">Loading KPI data...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <DashboardSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <p className="text-gray-600">{error}</p>
                        <button
                            onClick={fetchData}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const kpis = data?.kpis || {
        gmv: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        totalBuyers: 0,
        totalSuppliers: 0,
        newBuyers: 0,
        newSuppliers: 0,
        dau: 0,
        mau: 0,
        totalProducts: 0,
        avgCarbonScore: 0,
        totalRFQs: 0,
        rfqResponseRate: 0,
        rfqWinRate: 0,
        totalCarbonSaved: 0,
    };

    const trends = data?.trends || {};
    const alerts = data?.alerts || [];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />

            <main className="flex-1 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
                        <p className="text-gray-500 mt-1">Real-time business metrics and performance tracking</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Period Selector */}
                        <div className="relative">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as typeof period)}
                                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={triggerSnapshot}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Primary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Gross Merchandise Value"
                        value={`$${(kpis.gmv / 1000).toFixed(1)}K`}
                        change={trends.gmvChange}
                        icon={<DollarSign className="w-5 h-5 text-green-600" />}
                        color="bg-green-50"
                        target={1000000}
                    />
                    <MetricCard
                        title="Total Orders"
                        value={kpis.totalOrders}
                        change={trends.ordersChange}
                        icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
                        color="bg-blue-50"
                        target={500}
                    />
                    <MetricCard
                        title="Daily Active Users"
                        value={kpis.dau}
                        change={trends.activeUsersChange}
                        icon={<Users className="w-5 h-5 text-purple-600" />}
                        color="bg-purple-50"
                        target={200}
                    />
                    <MetricCard
                        title="Carbon Saved"
                        value={kpis.totalCarbonSaved.toFixed(1)}
                        icon={<Leaf className="w-5 h-5 text-emerald-600" />}
                        color="bg-emerald-50"
                        unit="tCO2e"
                        target={100}
                    />
                </div>

                {/* Secondary KPIs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Platform Metrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Platform Metrics</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total Buyers</span>
                                <span className="font-semibold">{kpis.totalBuyers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total Suppliers</span>
                                <span className="font-semibold">{kpis.totalSuppliers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">New Buyers (MTD)</span>
                                <span className="font-semibold text-green-600">+{kpis.newBuyers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">New Suppliers (MTD)</span>
                                <span className="font-semibold text-green-600">+{kpis.newSuppliers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">MAU</span>
                                <span className="font-semibold">{kpis.mau}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total Products</span>
                                <span className="font-semibold">{kpis.totalProducts}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Metrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            <h2 className="font-semibold text-gray-900">Order Metrics</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Avg Order Value</span>
                                <span className="font-semibold">${kpis.avgOrderValue.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Total RFQs</span>
                                <span className="font-semibold">{kpis.totalRFQs}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">RFQ Response Rate</span>
                                <span className="font-semibold">{kpis.rfqResponseRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">RFQ Win Rate</span>
                                <span className="font-semibold">{kpis.rfqWinRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Sustainability Metrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Leaf className="w-5 h-5 text-emerald-600" />
                            <h2 className="font-semibold text-gray-900">Sustainability</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Avg Carbon Score</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{kpis.avgCarbonScore.toFixed(1)}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full"
                                            style={{ width: `${kpis.avgCarbonScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Carbon Saved (tCO2e)</span>
                                <span className="font-semibold text-emerald-600">{kpis.totalCarbonSaved.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Sustainable Orders</span>
                                <span className="font-semibold">75%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Certified Suppliers</span>
                                <span className="font-semibold">60%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-600" />
                            <h2 className="font-semibold text-gray-900">Active Alerts</h2>
                        </div>
                        <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                            Manage Alerts
                        </button>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p>All systems normal. No active alerts.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert._id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${alert.status === 'triggered'
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {alert.status === 'triggered' ? (
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <Target className="w-5 h-5 text-gray-400" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">{alert.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {alert.kpiName} {alert.condition} {alert.threshold}
                                                {alert.currentValue !== undefined && (
                                                    <span className="ml-2 text-gray-400">
                                                        (current: {alert.currentValue})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {alert.lastTriggered && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {new Date(alert.lastTriggered).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Historical Trends */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h2 className="font-semibold text-gray-900">Historical Snapshots</h2>
                        </div>
                    </div>

                    {data?.snapshots && data.snapshots.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">GMV</th>
                                        <th className="pb-3 font-medium">Orders</th>
                                        <th className="pb-3 font-medium">Active Users</th>
                                        <th className="pb-3 font-medium">Carbon Saved</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data.snapshots.map((snapshot) => (
                                        <tr key={snapshot._id} className="border-b last:border-0">
                                            <td className="py-3 text-gray-900">
                                                {new Date(snapshot.periodDate).toLocaleDateString()}
                                            </td>
                                            <td className="py-3">
                                                ${((snapshot.platform?.gmv || 0) / 1000).toFixed(1)}K
                                            </td>
                                            <td className="py-3">{snapshot.platform?.orders || 0}</td>
                                            <td className="py-3">{snapshot.platform?.activeUsers || 0}</td>
                                            <td className="py-3 text-emerald-600">
                                                {(snapshot.platform?.carbonSaved || 0).toFixed(2)} tCO2e
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p>No historical data yet. Snapshots will appear after daily jobs run.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default KPIDashboard;
