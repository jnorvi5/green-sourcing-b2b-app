/**
 * Supplier Analytics Dashboard
 * 
 * Shows sales metrics, RFQ stats, product performance,
 * and carbon impact for suppliers
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    EyeIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    SparklesIcon,
    UserGroupIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
    summary: {
        totalViews: number;
        totalRfqs: number;
        conversionRate: number;
        avgResponseTime: string;
        carbonImpact: number;
    };
    viewsTrend: { date: string; views: number }[];
    rfqsTrend: { date: string; rfqs: number }[];
    topProducts: {
        id: string;
        name: string;
        views: number;
        rfqs: number;
        conversionRate: number;
    }[];
    buyerTypes: { type: string; count: number; percentage: number }[];
    regions: { region: string; count: number; percentage: number }[];
}

// Mock data
const MOCK_DATA: AnalyticsData = {
    summary: {
        totalViews: 2847,
        totalRfqs: 142,
        conversionRate: 4.99,
        avgResponseTime: '4.2 hours',
        carbonImpact: 12500,
    },
    viewsTrend: [
        { date: 'Mon', views: 320 },
        { date: 'Tue', views: 450 },
        { date: 'Wed', views: 380 },
        { date: 'Thu', views: 520 },
        { date: 'Fri', views: 480 },
        { date: 'Sat', views: 290 },
        { date: 'Sun', views: 407 },
    ],
    rfqsTrend: [
        { date: 'Mon', rfqs: 12 },
        { date: 'Tue', rfqs: 18 },
        { date: 'Wed', rfqs: 22 },
        { date: 'Thu', rfqs: 28 },
        { date: 'Fri', rfqs: 25 },
        { date: 'Sat', rfqs: 15 },
        { date: 'Sun', rfqs: 22 },
    ],
    topProducts: [
        { id: 'p1', name: 'Recycled Structural Steel', views: 856, rfqs: 45, conversionRate: 5.25 },
        { id: 'p2', name: 'Low-Carbon Concrete Mix', views: 642, rfqs: 38, conversionRate: 5.92 },
        { id: 'p3', name: 'FSC Certified CLT Panels', views: 534, rfqs: 28, conversionRate: 5.24 },
        { id: 'p4', name: 'Mineral Wool Insulation', views: 421, rfqs: 18, conversionRate: 4.27 },
        { id: 'p5', name: 'Recycled Aluminum Framing', views: 394, rfqs: 13, conversionRate: 3.30 },
    ],
    buyerTypes: [
        { type: 'Architects', count: 45, percentage: 35 },
        { type: 'General Contractors', count: 38, percentage: 30 },
        { type: 'Developers', count: 26, percentage: 20 },
        { type: 'Engineers', count: 12, percentage: 10 },
        { type: 'Other', count: 6, percentage: 5 },
    ],
    regions: [
        { region: 'California', count: 38, percentage: 27 },
        { region: 'New York', count: 28, percentage: 20 },
        { region: 'Texas', count: 22, percentage: 15 },
        { region: 'Washington', count: 18, percentage: 13 },
        { region: 'Other', count: 36, percentage: 25 },
    ],
};

export default function SupplierAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setData(MOCK_DATA);
            setLoading(false);
        };

        fetchData();
    }, [timeRange]);

    if (loading || !data) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const maxViews = Math.max(...data.viewsTrend.map(d => d.views));
    const maxRfqs = Math.max(...data.rfqsTrend.map(d => d.rfqs));

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <ChartBarIcon className="w-8 h-8 text-emerald-500" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-400 mt-1">Track your product performance and buyer engagement</p>
                    </div>

                    <div className="mt-4 md:mt-0 flex gap-2">
                        {(['7d', '30d', '90d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <EyeIcon className="w-6 h-6 text-blue-400" />
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                                +12%
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-bold">{data.summary.totalViews.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">Product Views</div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <DocumentTextIcon className="w-6 h-6 text-purple-400" />
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                                +8%
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-bold">{data.summary.totalRfqs}</div>
                            <div className="text-sm text-gray-400">RFQs Received</div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <CurrencyDollarIcon className="w-6 h-6 text-emerald-400" />
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                                +0.5%
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-bold">{data.summary.conversionRate}%</div>
                            <div className="text-sm text-gray-400">Conversion Rate</div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <SparklesIcon className="w-6 h-6 text-yellow-400" />
                            <span className="flex items-center gap-1 text-red-400 text-sm">
                                <ArrowTrendingDownIcon className="w-4 h-4" />
                                -15min
                            </span>
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-bold">{data.summary.avgResponseTime}</div>
                            <div className="text-sm text-gray-400">Avg Response Time</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <GlobeAltIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-bold">{(data.summary.carbonImpact / 1000).toFixed(1)}t</div>
                            <div className="text-sm text-emerald-300">CO2e Avoided</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Views Chart */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <EyeIcon className="w-5 h-5 text-blue-400" />
                                Product Views
                            </h3>
                            <div className="h-48 flex items-end justify-between gap-2">
                                {data.viewsTrend.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-500 hover:to-blue-300"
                                            style={{ height: `${(d.views / maxViews) * 160}px` }}
                                            title={`${d.views} views`}
                                        ></div>
                                        <span className="text-xs text-gray-400 mt-2">{d.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RFQs Chart */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                                RFQs Received
                            </h3>
                            <div className="h-48 flex items-end justify-between gap-2">
                                {data.rfqsTrend.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all hover:from-purple-500 hover:to-purple-300"
                                            style={{ height: `${(d.rfqs / maxRfqs) * 160}px` }}
                                            title={`${d.rfqs} RFQs`}
                                        ></div>
                                        <span className="text-xs text-gray-400 mt-2">{d.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Top Performing Products</h3>
                                <Link to="/dashboard/supplier/products" className="text-sm text-emerald-400 hover:underline">
                                    View all →
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                                            <th className="pb-3">Product</th>
                                            <th className="pb-3 text-right">Views</th>
                                            <th className="pb-3 text-right">RFQs</th>
                                            <th className="pb-3 text-right">Conv. Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {data.topProducts.map((product, i) => (
                                            <tr key={product.id} className="hover:bg-gray-700/50">
                                                <td className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded text-xs font-medium">
                                                            {i + 1}
                                                        </span>
                                                        <span className="font-medium">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right text-gray-300">{product.views.toLocaleString()}</td>
                                                <td className="py-3 text-right text-gray-300">{product.rfqs}</td>
                                                <td className="py-3 text-right">
                                                    <span className={`font-medium ${product.conversionRate >= 5 ? 'text-green-400' : 'text-gray-300'}`}>
                                                        {product.conversionRate.toFixed(2)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Buyer Types */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <UserGroupIcon className="w-5 h-5 text-emerald-400" />
                                Buyer Types
                            </h3>
                            <div className="space-y-3">
                                {data.buyerTypes.map(buyer => (
                                    <div key={buyer.type}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">{buyer.type}</span>
                                            <span className="text-gray-400">{buyer.percentage}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${buyer.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Regions */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <GlobeAltIcon className="w-5 h-5 text-blue-400" />
                                Top Regions
                            </h3>
                            <div className="space-y-3">
                                {data.regions.map(region => (
                                    <div key={region.region}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">{region.region}</span>
                                            <span className="text-gray-400">{region.count} RFQs</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${region.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border border-emerald-700 rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link
                                    to="/dashboard/supplier/products/new"
                                    className="block w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-center font-medium transition-colors"
                                >
                                    Add New Product
                                </Link>
                                <Link
                                    to="/dashboard/supplier/rfqs"
                                    className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
                                >
                                    View Pending RFQs
                                </Link>
                                <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                                    Export Analytics
                                </button>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                                Tips to Improve
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    Add EPD documentation to increase buyer trust
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    Respond to RFQs within 2 hours for better conversion
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400 mt-0.5">•</span>
                                    Add more product photos to boost engagement
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
