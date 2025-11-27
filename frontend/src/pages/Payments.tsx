import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Download,
    Filter,
    Search,
    Eye,
    RotateCcw,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Building,
    User,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

interface Payment {
    _id: string;
    orderId: string;
    customerId: string;
    supplierId: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    platformFee: number;
    processingFee: number;
    netAmount: number;
    cardLast4?: string;
    cardBrand?: string;
    paidAt?: string;
    createdAt: string;
    refundAmount?: number;
}

interface PaymentStats {
    totalVolume: number;
    totalFees: number;
    successRate: number;
    avgTransactionValue: number;
}

const Payments: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        method: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [refundModal, setRefundModal] = useState<Payment | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');

    // Mock data for demo
    useEffect(() => {
        const mockPayments: Payment[] = [
            {
                _id: '1',
                orderId: 'ORD-2024-001',
                customerId: 'buyer1',
                supplierId: 'supplier1',
                amount: 15000,
                currency: 'USD',
                status: 'succeeded',
                method: 'card',
                platformFee: 375,
                processingFee: 465,
                netAmount: 14160,
                cardLast4: '4242',
                cardBrand: 'Visa',
                paidAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            },
            {
                _id: '2',
                orderId: 'ORD-2024-002',
                customerId: 'buyer2',
                supplierId: 'supplier2',
                amount: 8500,
                currency: 'USD',
                status: 'pending',
                method: 'bank_transfer',
                platformFee: 212,
                processingFee: 276,
                netAmount: 8012,
                createdAt: new Date().toISOString(),
            },
            {
                _id: '3',
                orderId: 'ORD-2024-003',
                customerId: 'buyer1',
                supplierId: 'supplier3',
                amount: 25000,
                currency: 'USD',
                status: 'succeeded',
                method: 'card',
                platformFee: 625,
                processingFee: 755,
                netAmount: 23620,
                cardLast4: '1234',
                cardBrand: 'Mastercard',
                paidAt: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                _id: '4',
                orderId: 'ORD-2024-004',
                customerId: 'buyer3',
                supplierId: 'supplier1',
                amount: 5000,
                currency: 'USD',
                status: 'failed',
                method: 'card',
                platformFee: 125,
                processingFee: 175,
                netAmount: 4700,
                cardLast4: '9999',
                cardBrand: 'Visa',
                createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
            {
                _id: '5',
                orderId: 'ORD-2024-005',
                customerId: 'buyer2',
                supplierId: 'supplier2',
                amount: 12000,
                currency: 'USD',
                status: 'refunded',
                method: 'card',
                platformFee: 300,
                processingFee: 378,
                netAmount: 11322,
                cardLast4: '5678',
                cardBrand: 'Amex',
                paidAt: new Date(Date.now() - 259200000).toISOString(),
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                refundAmount: 12000,
            },
        ];

        setPayments(mockPayments);
        setStats({
            totalVolume: mockPayments.reduce((sum, p) => sum + p.amount, 0),
            totalFees: mockPayments.reduce((sum, p) => sum + p.platformFee + p.processingFee, 0),
            successRate: (mockPayments.filter(p => p.status === 'succeeded').length / mockPayments.length) * 100,
            avgTransactionValue: mockPayments.reduce((sum, p) => sum + p.amount, 0) / mockPayments.length,
        });
        setLoading(false);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'succeeded':
                return 'bg-green-100 text-green-700';
            case 'pending':
            case 'processing':
                return 'bg-amber-100 text-amber-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            case 'refunded':
            case 'partially_refunded':
                return 'bg-purple-100 text-purple-700';
            case 'cancelled':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'succeeded':
                return <CheckCircle className="w-4 h-4" />;
            case 'pending':
            case 'processing':
                return <Clock className="w-4 h-4" />;
            case 'failed':
                return <XCircle className="w-4 h-4" />;
            case 'refunded':
                return <RotateCcw className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'card':
                return <CreditCard className="w-4 h-4" />;
            case 'bank_transfer':
            case 'ach':
                return <Building className="w-4 h-4" />;
            default:
                return <DollarSign className="w-4 h-4" />;
        }
    };

    const handleRefund = async () => {
        if (!refundModal) return;
        // Would call API here
        console.log('Processing refund:', {
            paymentId: refundModal._id,
            amount: parseFloat(refundAmount) || refundModal.amount,
            reason: refundReason,
        });
        setRefundModal(null);
        setRefundAmount('');
        setRefundReason('');
    };

    const filteredPayments = payments.filter(payment => {
        if (filters.status && payment.status !== filters.status) return false;
        if (filters.method && payment.method !== filters.method) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                payment.orderId.toLowerCase().includes(query) ||
                payment._id.includes(query)
            );
        }
        return true;
    });

    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />

            <main className="flex-1 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                        <p className="text-gray-500 mt-1">Manage transactions, refunds, and payouts</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-green-50 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="flex items-center gap-1 text-sm text-green-600">
                                    <ArrowUpRight className="w-4 h-4" />
                                    12%
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Total Volume</p>
                            <p className="text-2xl font-bold">${(stats.totalVolume / 1000).toFixed(1)}K</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-blue-50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="flex items-center gap-1 text-sm text-green-600">
                                    <ArrowUpRight className="w-4 h-4" />
                                    8%
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Revenue (Fees)</p>
                            <p className="text-2xl font-bold">${(stats.totalFees / 1000).toFixed(1)}K</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-emerald-50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Success Rate</p>
                            <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-purple-50 rounded-lg">
                                    <CreditCard className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Avg Transaction</p>
                            <p className="text-2xl font-bold">${stats.avgTransactionValue.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="succeeded">Succeeded</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                                <select
                                    value={filters.method}
                                    onChange={(e) => setFilters({ ...filters, method: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All Methods</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="ach">ACH</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ status: '', method: '' })}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payments Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by order ID or payment ID..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-3 font-medium">Payment</th>
                                        <th className="pb-3 font-medium">Amount</th>
                                        <th className="pb-3 font-medium">Method</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Fees</th>
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment._id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-4">
                                                <div>
                                                    <p className="font-medium">{payment.orderId}</p>
                                                    <p className="text-xs text-gray-500">ID: {payment._id}</p>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">Net: ${payment.netAmount.toLocaleString()}</p>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    {getMethodIcon(payment.method)}
                                                    <div>
                                                        <p className="capitalize">{payment.method.replace('_', ' ')}</p>
                                                        {payment.cardLast4 && (
                                                            <p className="text-xs text-gray-500">
                                                                {payment.cardBrand} •••• {payment.cardLast4}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                                                    {getStatusIcon(payment.status)}
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <p className="text-gray-600">${(payment.platformFee + payment.processingFee).toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">{((payment.platformFee + payment.processingFee) / payment.amount * 100).toFixed(1)}%</p>
                                            </td>
                                            <td className="py-4 text-gray-500">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPayment(payment)}
                                                        className="p-1.5 hover:bg-gray-100 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    {payment.status === 'succeeded' && (
                                                        <button
                                                            onClick={() => setRefundModal(payment)}
                                                            className="p-1.5 hover:bg-gray-100 rounded"
                                                            title="Refund"
                                                        >
                                                            <RotateCcw className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Refund Modal */}
                {refundModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6 border-b">
                                <h2 className="text-lg font-semibold">Process Refund</h2>
                                <p className="text-sm text-gray-500 mt-1">Order: {refundModal.orderId}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Refund Amount (Max: ${refundModal.amount.toLocaleString()})
                                    </label>
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        placeholder={refundModal.amount.toString()}
                                        max={refundModal.amount}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                    <select
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Select reason...</option>
                                        <option value="requested_by_customer">Requested by customer</option>
                                        <option value="duplicate">Duplicate charge</option>
                                        <option value="fraudulent">Fraudulent</option>
                                        <option value="order_cancelled">Order cancelled</option>
                                        <option value="product_not_received">Product not received</option>
                                        <option value="product_unacceptable">Product unacceptable</option>
                                    </select>
                                </div>
                            </div>
                            <div className="p-6 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setRefundModal(null)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRefund}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Process Refund
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Detail Modal */}
                {selectedPayment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Payment Details</h2>
                                    <button
                                        onClick={() => setSelectedPayment(null)}
                                        className="p-1.5 hover:bg-gray-100 rounded"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b">
                                    <div>
                                        <p className="text-sm text-gray-500">Amount</p>
                                        <p className="text-3xl font-bold">${selectedPayment.amount.toLocaleString()}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${getStatusColor(selectedPayment.status)}`}>
                                        {getStatusIcon(selectedPayment.status)}
                                        {selectedPayment.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Order ID</p>
                                        <p className="font-medium">{selectedPayment.orderId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Payment ID</p>
                                        <p className="font-medium">{selectedPayment._id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Method</p>
                                        <p className="font-medium capitalize">{selectedPayment.method.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Currency</p>
                                        <p className="font-medium">{selectedPayment.currency}</p>
                                    </div>
                                </div>

                                {selectedPayment.cardLast4 && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-2">Card Details</p>
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-8 h-8 text-gray-400" />
                                            <div>
                                                <p className="font-medium">{selectedPayment.cardBrand} •••• {selectedPayment.cardLast4}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 mb-3">Fee Breakdown</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>${selectedPayment.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Platform Fee (2.5%)</span>
                                            <span>-${selectedPayment.platformFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Processing Fee</span>
                                            <span>-${selectedPayment.processingFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold pt-2 border-t">
                                            <span>Net Amount</span>
                                            <span>${selectedPayment.netAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedPayment.paidAt && (
                                    <div>
                                        <p className="text-sm text-gray-500">Paid At</p>
                                        <p className="font-medium">{new Date(selectedPayment.paidAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Payments;
