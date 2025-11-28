/**
 * Quotes Management Page
 *
 * View all quotes, compare quotes, manage RFQ responses
 */
import React, { useState } from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Search,
    Filter,
    ChevronDown,
    ChevronRight,
    Building,
    Calendar,
    DollarSign,
    Leaf,
    TrendingDown,
    ArrowUpRight,
    BarChart2,
    Eye,
    Download,
    MessageSquare,
    Scale,
} from 'lucide-react';

interface QuoteItem {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
}

interface Quote {
    id: string;
    quoteNumber: string;
    rfqNumber: string;
    rfqTitle: string;
    supplier: string;
    supplierRating: number;
    submittedDate: string;
    validUntil: string;
    totalAmount: number;
    carbonScore: number;
    leadTime: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'negotiating';
    items: QuoteItem[];
    notes?: string;
}

const mockQuotes: Quote[] = [
    {
        id: '1',
        quoteNumber: 'QT-2024-0891',
        rfqNumber: 'RFQ-2024-0567',
        rfqTitle: 'Sustainable Packaging Materials Q2',
        supplier: 'EcoMaterials Co',
        supplierRating: 4.8,
        submittedDate: '2024-01-18',
        validUntil: '2024-02-18',
        totalAmount: 12500.0,
        carbonScore: 92,
        leadTime: '14 days',
        status: 'pending',
        items: [
            { name: 'Recycled Cardboard Boxes', quantity: 1000, unit: 'units', unitPrice: 2.5, total: 2500 },
            { name: 'Biodegradable Packing Peanuts', quantity: 500, unit: 'kg', unitPrice: 8.0, total: 4000 },
            { name: 'Compostable Mailers', quantity: 2000, unit: 'units', unitPrice: 3.0, total: 6000 },
        ],
    },
    {
        id: '2',
        quoteNumber: 'QT-2024-0892',
        rfqNumber: 'RFQ-2024-0567',
        rfqTitle: 'Sustainable Packaging Materials Q2',
        supplier: 'GreenPack Solutions',
        supplierRating: 4.5,
        submittedDate: '2024-01-19',
        validUntil: '2024-02-19',
        totalAmount: 11800.0,
        carbonScore: 88,
        leadTime: '21 days',
        status: 'pending',
        items: [
            { name: 'Recycled Cardboard Boxes', quantity: 1000, unit: 'units', unitPrice: 2.3, total: 2300 },
            { name: 'Biodegradable Packing Peanuts', quantity: 500, unit: 'kg', unitPrice: 7.5, total: 3750 },
            { name: 'Compostable Mailers', quantity: 2000, unit: 'units', unitPrice: 2.88, total: 5750 },
        ],
    },
    {
        id: '3',
        quoteNumber: 'QT-2024-0885',
        rfqNumber: 'RFQ-2024-0560',
        rfqTitle: 'Organic Raw Materials',
        supplier: 'BioFiber Industries',
        supplierRating: 4.7,
        submittedDate: '2024-01-10',
        validUntil: '2024-01-25',
        totalAmount: 28500.0,
        carbonScore: 95,
        leadTime: '10 days',
        status: 'accepted',
        items: [
            { name: 'Organic Hemp Fiber', quantity: 500, unit: 'kg', unitPrice: 45.0, total: 22500 },
            { name: 'Natural Dyes Assortment', quantity: 50, unit: 'kg', unitPrice: 120.0, total: 6000 },
        ],
    },
    {
        id: '4',
        quoteNumber: 'QT-2024-0880',
        rfqNumber: 'RFQ-2024-0555',
        rfqTitle: 'Eco-friendly Office Supplies',
        supplier: 'Sustainable Supply',
        supplierRating: 4.2,
        submittedDate: '2024-01-08',
        validUntil: '2024-01-22',
        totalAmount: 5600.0,
        carbonScore: 78,
        leadTime: '30 days',
        status: 'expired',
        items: [
            { name: 'Recycled Paper Notebooks', quantity: 200, unit: 'units', unitPrice: 12.0, total: 2400 },
            { name: 'Bamboo Pens', quantity: 500, unit: 'units', unitPrice: 6.4, total: 3200 },
        ],
    },
    {
        id: '5',
        quoteNumber: 'QT-2024-0878',
        rfqNumber: 'RFQ-2024-0552',
        rfqTitle: 'Green Building Materials',
        supplier: 'RecycleTech Partners',
        supplierRating: 4.6,
        submittedDate: '2024-01-05',
        validUntil: '2024-02-05',
        totalAmount: 45000.0,
        carbonScore: 90,
        leadTime: '28 days',
        status: 'negotiating',
        items: [
            { name: 'Recycled Steel Beams', quantity: 50, unit: 'units', unitPrice: 500.0, total: 25000 },
            { name: 'Eco-Concrete Mix', quantity: 100, unit: 'tons', unitPrice: 200.0, total: 20000 },
        ],
        notes: 'Negotiating 5% discount for bulk order',
    },
];

const statusConfig: Record<
    string,
    { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
    pending: {
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        icon: <Clock className="w-4 h-4" />,
        label: 'Pending Review',
    },
    accepted: {
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Accepted',
    },
    rejected: {
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Rejected',
    },
    expired: {
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Expired',
    },
    negotiating: {
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        icon: <MessageSquare className="w-4 h-4" />,
        label: 'Negotiating',
    },
};

export default function Quotes() {
    const [quotes] = useState<Quote[]>(mockQuotes);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareList, setCompareList] = useState<string[]>([]);
    const [expandedRfq, setExpandedRfq] = useState<string | null>(null);

    const filteredQuotes = quotes.filter((quote) => {
        const matchesSearch =
            quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            quote.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
            quote.rfqTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Group quotes by RFQ
    const groupedQuotes = filteredQuotes.reduce((acc, quote) => {
        if (!acc[quote.rfqNumber]) {
            acc[quote.rfqNumber] = {
                rfqNumber: quote.rfqNumber,
                rfqTitle: quote.rfqTitle,
                quotes: [],
            };
        }
        acc[quote.rfqNumber].quotes.push(quote);
        return acc;
    }, {} as Record<string, { rfqNumber: string; rfqTitle: string; quotes: Quote[] }>);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const toggleCompare = (quoteId: string) => {
        setCompareList((prev) =>
            prev.includes(quoteId)
                ? prev.filter((id) => id !== quoteId)
                : prev.length < 3
                    ? [...prev, quoteId]
                    : prev
        );
    };

    const comparedQuotes = quotes.filter((q) => compareList.includes(q.id));

    // Stats
    const stats = {
        pending: quotes.filter((q) => q.status === 'pending').length,
        accepted: quotes.filter((q) => q.status === 'accepted').length,
        totalValue: quotes
            .filter((q) => q.status === 'pending')
            .reduce((sum, q) => sum + q.totalAmount, 0),
        avgCarbonScore: Math.round(
            quotes.reduce((sum, q) => sum + q.carbonScore, 0) / quotes.length
        ),
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quote Management</h1>
                        <p className="text-gray-600">Review and compare supplier quotes</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setCompareMode(!compareMode);
                                if (compareMode) setCompareList([]);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${compareMode
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <Scale className="w-4 h-4" />
                            {compareMode ? 'Exit Compare' : 'Compare Quotes'}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending Review</p>
                                <p className="text-xl font-bold text-gray-900">{stats.pending} quotes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Accepted</p>
                                <p className="text-xl font-bold text-green-600">{stats.accepted} quotes</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending Value</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(stats.totalValue)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Leaf className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Avg Carbon Score</p>
                                <p className="text-xl font-bold text-green-600">{stats.avgCarbonScore}/100</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compare Mode Panel */}
                {compareMode && compareList.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Scale className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-blue-900">
                                    {compareList.length} quote{compareList.length > 1 ? 's' : ''} selected for
                                    comparison
                                </span>
                            </div>
                            {compareList.length >= 2 && (
                                <button
                                    onClick={() => setSelectedQuote(comparedQuotes[0])}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Compare Now
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search quotes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {['all', 'pending', 'negotiating', 'accepted', 'rejected', 'expired'].map(
                                (status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status === 'all' ? 'All' : statusConfig[status]?.label || status}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Quotes Grouped by RFQ */}
                <div className="space-y-4">
                    {Object.values(groupedQuotes).map((group) => (
                        <div
                            key={group.rfqNumber}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                        >
                            {/* RFQ Header */}
                            <button
                                onClick={() =>
                                    setExpandedRfq(expandedRfq === group.rfqNumber ? null : group.rfqNumber)
                                }
                                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    {expandedRfq === group.rfqNumber ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{group.rfqTitle}</p>
                                        <p className="text-sm text-gray-500">{group.rfqNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">
                                        {group.quotes.length} quote{group.quotes.length > 1 ? 's' : ''}
                                    </span>
                                    <span className="text-sm font-medium text-green-600">
                                        Best: {formatCurrency(Math.min(...group.quotes.map((q) => q.totalAmount)))}
                                    </span>
                                </div>
                            </button>

                            {/* Quotes */}
                            {(expandedRfq === group.rfqNumber || expandedRfq === null) && (
                                <div className="divide-y divide-gray-100">
                                    {group.quotes.map((quote) => {
                                        const config = statusConfig[quote.status];
                                        const isLowestPrice =
                                            quote.totalAmount === Math.min(...group.quotes.map((q) => q.totalAmount));
                                        const isHighestCarbon =
                                            quote.carbonScore === Math.max(...group.quotes.map((q) => q.carbonScore));

                                        return (
                                            <div
                                                key={quote.id}
                                                className={`p-4 hover:bg-gray-50 ${compareList.includes(quote.id) ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {compareMode && (
                                                            <input
                                                                type="checkbox"
                                                                checked={compareList.includes(quote.id)}
                                                                onChange={() => toggleCompare(quote.id)}
                                                                className="w-5 h-5 text-blue-600 rounded"
                                                            />
                                                        )}
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                                <Building className="w-5 h-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium text-gray-900">{quote.supplier}</p>
                                                                    <span className="text-sm text-yellow-600">
                                                                        ★ {quote.supplierRating}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-500">{quote.quoteNumber}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6">
                                                        {/* Price */}
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-gray-900">
                                                                    {formatCurrency(quote.totalAmount)}
                                                                </p>
                                                                {isLowestPrice && (
                                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                                        Best Price
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500">{quote.leadTime} lead time</p>
                                                        </div>

                                                        {/* Carbon Score */}
                                                        <div className="text-center">
                                                            <div className="flex items-center gap-2">
                                                                <Leaf className="w-4 h-4 text-green-600" />
                                                                <span className="font-medium text-green-600">
                                                                    {quote.carbonScore}
                                                                </span>
                                                                {isHighestCarbon && (
                                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                                        Greenest
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500">Carbon Score</p>
                                                        </div>

                                                        {/* Valid Until */}
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-600">Valid until</p>
                                                            <p className="font-medium text-gray-900">{quote.validUntil}</p>
                                                        </div>

                                                        {/* Status */}
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
                                                        >
                                                            {config.icon}
                                                            {config.label}
                                                        </span>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedQuote(quote)}
                                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                            {quote.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                                        title="Accept Quote"
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                                                                        title="Negotiate"
                                                                    >
                                                                        Negotiate
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                {quote.notes && (
                                                    <div className="mt-3 ml-14 p-2 bg-yellow-50 rounded-lg">
                                                        <p className="text-sm text-yellow-800">{quote.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredQuotes.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No quotes found</p>
                    </div>
                )}

                {/* Quote Detail Modal */}
                {selectedQuote && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Quote Details</h2>
                                        <p className="text-gray-500">{selectedQuote.quoteNumber}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedQuote(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Supplier Info */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Building className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedQuote.supplier}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="text-yellow-600">★ {selectedQuote.supplierRating}</span>
                                            <span>•</span>
                                            <span>{selectedQuote.rfqTitle}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(selectedQuote.totalAmount)}
                                        </p>
                                        <p className="text-sm text-gray-500">Total Amount</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {selectedQuote.carbonScore}/100
                                        </p>
                                        <p className="text-sm text-gray-500">Carbon Score</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-blue-600">{selectedQuote.leadTime}</p>
                                        <p className="text-sm text-gray-500">Lead Time</p>
                                    </div>
                                </div>

                                {/* Line Items */}
                                <div className="mb-6">
                                    <h3 className="font-medium text-gray-900 mb-3">Line Items</h3>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-600">
                                                        Item
                                                    </th>
                                                    <th className="text-right px-4 py-2 text-sm font-medium text-gray-600">
                                                        Quantity
                                                    </th>
                                                    <th className="text-right px-4 py-2 text-sm font-medium text-gray-600">
                                                        Unit Price
                                                    </th>
                                                    <th className="text-right px-4 py-2 text-sm font-medium text-gray-600">
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedQuote.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-4 py-3 text-gray-900">{item.name}</td>
                                                        <td className="px-4 py-3 text-right text-gray-600">
                                                            {item.quantity} {item.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-600">
                                                            {formatCurrency(item.unitPrice)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                            {formatCurrency(item.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-right font-medium">
                                                        Total
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                        {formatCurrency(selectedQuote.totalAmount)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Submitted Date</p>
                                        <p className="font-medium text-gray-900">{selectedQuote.submittedDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Valid Until</p>
                                        <p className="font-medium text-gray-900">{selectedQuote.validUntil}</p>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedQuote.notes && (
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <p className="text-sm font-medium text-yellow-800 mb-1">Notes</p>
                                        <p className="text-yellow-700">{selectedQuote.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {selectedQuote.status === 'pending' && (
                                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">
                                        Reject
                                    </button>
                                    <button className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50">
                                        <MessageSquare className="w-4 h-4 inline mr-2" />
                                        Negotiate
                                    </button>
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        <CheckCircle className="w-4 h-4 inline mr-2" />
                                        Accept Quote
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
