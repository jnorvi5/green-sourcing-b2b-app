import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Package,
    ShoppingCart,
    Leaf,
    Calendar,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Globe,
    Target,
    Award,
} from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';

interface MetricCard {
    label: string;
    value: string;
    change: number;
    changeLabel: string;
    icon: React.ElementType;
    color: string;
}

interface TopItem {
    name: string;
    value: string;
    metric: string;
    change?: number;
}

const PlatformAnalytics: React.FC = () => {
    const [dateRange, setDateRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<MetricCard[]>([]);
    const [topSuppliers, setTopSuppliers] = useState<TopItem[]>([]);
    const [topProducts, setTopProducts] = useState<TopItem[]>([]);
    const [topBuyers, setTopBuyers] = useState<TopItem[]>([]);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setMetrics([
                {
                    label: 'Gross Merchandise Value',
                    value: '$2.4M',
                    change: 18.5,
                    changeLabel: 'vs last period',
                    icon: DollarSign,
                    color: 'green',
                },
                {
                    label: 'Total Orders',
                    value: '1,847',
                    change: 12.3,
                    changeLabel: 'vs last period',
                    icon: ShoppingCart,
                    color: 'blue',
                },
                {
                    label: 'Active Users',
                    value: '12,458',
                    change: 8.7,
                    changeLabel: 'vs last period',
                    icon: Users,
                    color: 'purple',
                },
                {
                    label: 'Carbon Saved',
                    value: '847 tons',
                    change: 24.2,
                    changeLabel: 'vs last period',
                    icon: Leaf,
                    color: 'emerald',
                },
                {
                    label: 'Total Products',
                    value: '3,492',
                    change: 5.4,
                    changeLabel: 'new this period',
                    icon: Package,
                    color: 'cyan',
                },
                {
                    label: 'Conversion Rate',
                    value: '4.8%',
                    change: 0.6,
                    changeLabel: 'vs last period',
                    icon: Target,
                    color: 'amber',
                },
                {
                    label: 'Avg Order Value',
                    value: '$1,298',
                    change: 5.2,
                    changeLabel: 'vs last period',
                    icon: BarChart3,
                    color: 'indigo',
                },
                {
                    label: 'Supplier Rating',
                    value: '4.7★',
                    change: 0.2,
                    changeLabel: 'vs last period',
                    icon: Award,
                    color: 'rose',
                },
            ]);

            setTopSuppliers([
                { name: 'EcoMaterials Inc', value: '$342,500', metric: 'Revenue', change: 15.2 },
                { name: 'GreenBuilders Ltd', value: '$289,300', metric: 'Revenue', change: 22.1 },
                { name: 'SustainableSteel Co', value: '$256,800', metric: 'Revenue', change: 8.4 },
                { name: 'BambooWorld', value: '$198,400', metric: 'Revenue', change: 31.5 },
                { name: 'RecycledConcrete Pro', value: '$167,200', metric: 'Revenue', change: -2.3 },
            ]);

            setTopProducts([
                { name: 'Recycled Steel Beams', value: '847 units', metric: 'Orders', change: 28.5 },
                { name: 'Low-Carbon Concrete Mix', value: '623 units', metric: 'Orders', change: 18.2 },
                { name: 'Bamboo Flooring Premium', value: '512 units', metric: 'Orders', change: 45.3 },
                { name: 'Solar Panel Mounting Kit', value: '489 units', metric: 'Orders', change: 12.8 },
                { name: 'FSC Certified Lumber', value: '445 units', metric: 'Orders', change: 5.1 },
            ]);

            setTopBuyers([
                { name: 'Green Construction Co', value: '$428,000', metric: 'Spend', change: 22.4 },
                { name: 'Sustainable Builders Inc', value: '$312,500', metric: 'Spend', change: 15.8 },
                { name: 'EcoHomes Development', value: '$287,300', metric: 'Spend', change: 8.9 },
                { name: 'Urban Renewal Projects', value: '$234,600', metric: 'Spend', change: 42.1 },
                { name: 'Pacific Green Builders', value: '$198,200', metric: 'Spend', change: 11.3 },
            ]);

            setLoading(false);
        }, 1000);
    }, [dateRange]);

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            green: { bg: 'bg-green-50', text: 'text-green-600' },
            blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
            cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
            amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
            rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
        };
        return colors[color] || colors.green;
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />

            <main className="flex-1 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
                        <p className="text-gray-500 mt-1">Monitor key performance indicators across the platform</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="365d">Last year</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
                    </div>
                ) : (
                    <>
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {metrics.map((metric) => {
                                const colors = getColorClasses(metric.color);
                                return (
                                    <div
                                        key={metric.label}
                                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-2.5 rounded-lg ${colors.bg}`}>
                                                <metric.icon className={`w-5 h-5 ${colors.text}`} />
                                            </div>
                                            <div className={`flex items-center gap-1 text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {metric.change >= 0 ? (
                                                    <ArrowUpRight className="w-4 h-4" />
                                                ) : (
                                                    <ArrowDownRight className="w-4 h-4" />
                                                )}
                                                {Math.abs(metric.change)}%
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500">{metric.label}</p>
                                        <p className="text-2xl font-bold mt-1">{metric.value}</p>
                                        <p className="text-xs text-gray-400 mt-1">{metric.changeLabel}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Revenue Chart Placeholder */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-semibold">Revenue Over Time</h3>
                                    <select className="text-sm border border-gray-200 rounded px-2 py-1">
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                                <div className="h-64 bg-gradient-to-b from-green-50 to-white rounded-lg flex items-end justify-around px-4 pb-4">
                                    {[65, 78, 52, 89, 67, 94, 82, 71, 88, 76, 92, 85].map((height, i) => (
                                        <div
                                            key={i}
                                            className="w-6 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                                            style={{ height: `${height}%` }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
                                    <span>Jan</span>
                                    <span>Feb</span>
                                    <span>Mar</span>
                                    <span>Apr</span>
                                    <span>May</span>
                                    <span>Jun</span>
                                    <span>Jul</span>
                                    <span>Aug</span>
                                    <span>Sep</span>
                                    <span>Oct</span>
                                    <span>Nov</span>
                                    <span>Dec</span>
                                </div>
                            </div>

                            {/* Orders by Category */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold mb-6">Orders by Category</h3>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Building Materials', value: 45, color: 'bg-green-500' },
                                        { name: 'Renewable Energy', value: 25, color: 'bg-blue-500' },
                                        { name: 'Interior Finishes', value: 15, color: 'bg-purple-500' },
                                        { name: 'HVAC & MEP', value: 10, color: 'bg-amber-500' },
                                        { name: 'Other', value: 5, color: 'bg-gray-400' },
                                    ].map((category) => (
                                        <div key={category.name}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{category.name}</span>
                                                <span className="font-medium">{category.value}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${category.color} rounded-full`}
                                                    style={{ width: `${category.value}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Top Suppliers */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold mb-4">Top Suppliers</h3>
                                <div className="space-y-4">
                                    {topSuppliers.map((supplier, i) => (
                                        <div key={supplier.name} className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{supplier.name}</p>
                                                <p className="text-sm text-gray-500">{supplier.value}</p>
                                            </div>
                                            <span className={`text-xs ${supplier.change && supplier.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {supplier.change && supplier.change >= 0 ? '+' : ''}{supplier.change}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold mb-4">Top Products</h3>
                                <div className="space-y-4">
                                    {topProducts.map((product, i) => (
                                        <div key={product.name} className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-sm text-gray-500">{product.value}</p>
                                            </div>
                                            <span className={`text-xs ${product.change && product.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {product.change && product.change >= 0 ? '+' : ''}{product.change}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Buyers */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold mb-4">Top Buyers</h3>
                                <div className="space-y-4">
                                    {topBuyers.map((buyer, i) => (
                                        <div key={buyer.name} className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs font-medium">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{buyer.name}</p>
                                                <p className="text-sm text-gray-500">{buyer.value}</p>
                                            </div>
                                            <span className={`text-xs ${buyer.change && buyer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {buyer.change && buyer.change >= 0 ? '+' : ''}{buyer.change}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Geographic Distribution */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold">Geographic Distribution</h3>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                        Buyers
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                        Suppliers
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[
                                    { region: 'West Coast', buyers: 4521, suppliers: 289, growth: 18.5 },
                                    { region: 'Northeast', buyers: 3847, suppliers: 245, growth: 12.3 },
                                    { region: 'Southeast', buyers: 2156, suppliers: 178, growth: 24.7 },
                                    { region: 'Midwest', buyers: 1934, suppliers: 134, growth: 8.9 },
                                ].map((region) => (
                                    <div key={region.region} className="p-4 bg-gray-50 rounded-lg">
                                        <p className="font-medium">{region.region}</p>
                                        <div className="mt-2 space-y-1 text-sm">
                                            <p className="text-gray-600">{region.buyers.toLocaleString()} buyers</p>
                                            <p className="text-gray-600">{region.suppliers} suppliers</p>
                                            <p className="text-green-600">+{region.growth}% growth</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default PlatformAnalytics;
