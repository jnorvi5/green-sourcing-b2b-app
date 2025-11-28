/**
 * Supplier RFQ Management
 * 
 * Lists all RFQs received, allows responding with quotes,
 * tracking status, and managing communications
 */
import { useState, useEffect } from 'react';
import {
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    BuildingOffice2Icon,
    CurrencyDollarIcon,
    TruckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface RFQ {
    id: string;
    rfqNumber: string;
    productName: string;
    quantity: number;
    unit: string;
    buyer: {
        company: string;
        name: string;
        email: string;
    };
    project: string;
    deliveryLocation: string;
    deliveryDate: string;
    status: 'pending' | 'quoted' | 'won' | 'lost' | 'expired';
    urgency: 'low' | 'medium' | 'high';
    receivedAt: string;
    expiresAt: string;
    notes?: string;
    quote?: {
        price: number;
        leadTime: number;
        validUntil: string;
        notes: string;
    };
}

const MOCK_RFQS: RFQ[] = [
    {
        id: '1',
        rfqNumber: 'RFQ-2024-0156',
        productName: 'Recycled Structural Steel',
        quantity: 500,
        unit: 'tons',
        buyer: { company: 'GreenBuild Architecture', name: 'Sarah Johnson', email: 'sarah@greenbuild.com' },
        project: 'Downtown Mixed-Use Development',
        deliveryLocation: 'Portland, OR',
        deliveryDate: '2024-04-15',
        status: 'pending',
        urgency: 'high',
        receivedAt: '2024-01-20T10:30:00Z',
        expiresAt: '2024-01-27T10:30:00Z',
        notes: 'Need materials with minimum 85% recycled content. EPD required.',
    },
    {
        id: '2',
        rfqNumber: 'RFQ-2024-0155',
        productName: 'Low-Carbon Concrete Mix',
        quantity: 2000,
        unit: 'cubic yards',
        buyer: { company: 'EcoConstruct Inc', name: 'Michael Chen', email: 'mchen@ecoconstruct.com' },
        project: 'LEED Platinum Office Tower',
        deliveryLocation: 'Seattle, WA',
        deliveryDate: '2024-05-01',
        status: 'quoted',
        urgency: 'medium',
        receivedAt: '2024-01-18T14:00:00Z',
        expiresAt: '2024-01-25T14:00:00Z',
        quote: {
            price: 185,
            leadTime: 14,
            validUntil: '2024-02-15',
            notes: 'Price includes delivery. 30% SCM content.',
        },
    },
    {
        id: '3',
        rfqNumber: 'RFQ-2024-0148',
        productName: 'FSC Certified CLT Panels',
        quantity: 150,
        unit: 'panels',
        buyer: { company: 'Sustainable Homes LLC', name: 'Emma Davis', email: 'emma@sustainablehomes.com' },
        project: 'Multi-Family Housing Complex',
        deliveryLocation: 'San Francisco, CA',
        deliveryDate: '2024-03-20',
        status: 'won',
        urgency: 'low',
        receivedAt: '2024-01-10T09:00:00Z',
        expiresAt: '2024-01-17T09:00:00Z',
        quote: {
            price: 2450,
            leadTime: 21,
            validUntil: '2024-02-10',
            notes: 'Custom dimensions available.',
        },
    },
    {
        id: '4',
        rfqNumber: 'RFQ-2024-0142',
        productName: 'Mineral Wool Insulation',
        quantity: 10000,
        unit: 'sq ft',
        buyer: { company: 'BuildRight Construction', name: 'John Smith', email: 'jsmith@buildright.com' },
        project: 'Passive House Development',
        deliveryLocation: 'Denver, CO',
        deliveryDate: '2024-02-28',
        status: 'lost',
        urgency: 'high',
        receivedAt: '2024-01-05T11:30:00Z',
        expiresAt: '2024-01-12T11:30:00Z',
        quote: {
            price: 4.50,
            leadTime: 10,
            validUntil: '2024-01-30',
            notes: 'R-38 rating available.',
        },
    },
    {
        id: '5',
        rfqNumber: 'RFQ-2024-0138',
        productName: 'Recycled Aluminum Framing',
        quantity: 200,
        unit: 'linear feet',
        buyer: { company: 'Modern Architects Group', name: 'Lisa Wong', email: 'lwong@modernarch.com' },
        project: 'Museum Expansion',
        deliveryLocation: 'Los Angeles, CA',
        deliveryDate: '2024-04-01',
        status: 'expired',
        urgency: 'low',
        receivedAt: '2024-01-02T08:00:00Z',
        expiresAt: '2024-01-09T08:00:00Z',
    },
];

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: ClockIcon },
    quoted: { label: 'Quoted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: DocumentTextIcon },
    won: { label: 'Won', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircleIcon },
    lost: { label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircleIcon },
    expired: { label: 'Expired', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: ClockIcon },
};

const URGENCY_CONFIG = {
    low: { label: 'Low', color: 'text-gray-400' },
    medium: { label: 'Medium', color: 'text-yellow-400' },
    high: { label: 'High', color: 'text-red-400' },
};

export default function SupplierRFQs() {
    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [quoteForm, setQuoteForm] = useState({
        price: '',
        leadTime: '',
        validDays: '30',
        notes: '',
    });

    useEffect(() => {
        const fetchRFQs = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setRfqs(MOCK_RFQS);
            setLoading(false);
        };
        fetchRFQs();
    }, []);

    const filteredRfqs = rfqs.filter(rfq => {
        const matchesSearch =
            rfq.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rfq.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rfq.buyer.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = rfqs.filter(r => r.status === 'pending').length;
    const quotedCount = rfqs.filter(r => r.status === 'quoted').length;
    const wonCount = rfqs.filter(r => r.status === 'won').length;

    const handleSubmitQuote = () => {
        if (!selectedRfq) return;

        // Update the RFQ with quote
        setRfqs(prev =>
            prev.map(r =>
                r.id === selectedRfq.id
                    ? {
                        ...r,
                        status: 'quoted' as const,
                        quote: {
                            price: parseFloat(quoteForm.price),
                            leadTime: parseInt(quoteForm.leadTime),
                            validUntil: new Date(Date.now() + parseInt(quoteForm.validDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            notes: quoteForm.notes,
                        },
                    }
                    : r
            )
        );

        setShowQuoteModal(false);
        setSelectedRfq(null);
        setQuoteForm({ price: '', leadTime: '', validDays: '30', notes: '' });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();

        if (diff < 0) return 'Expired';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    if (loading) {
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
                            <DocumentTextIcon className="w-8 h-8 text-emerald-500" />
                            RFQ Management
                        </h1>
                        <p className="text-gray-400 mt-1">Manage incoming quote requests from buyers</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-8 h-8 text-yellow-400" />
                            <div>
                                <div className="text-3xl font-bold text-yellow-400">{pendingCount}</div>
                                <div className="text-sm text-yellow-300/80">Awaiting Response</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <DocumentTextIcon className="w-8 h-8 text-blue-400" />
                            <div>
                                <div className="text-3xl font-bold text-blue-400">{quotedCount}</div>
                                <div className="text-sm text-blue-300/80">Quotes Sent</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <CheckCircleIcon className="w-8 h-8 text-green-400" />
                            <div>
                                <div className="text-3xl font-bold text-green-400">{wonCount}</div>
                                <div className="text-sm text-green-300/80">RFQs Won</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <CurrencyDollarIcon className="w-8 h-8 text-emerald-400" />
                            <div>
                                <div className="text-3xl font-bold text-emerald-400">
                                    {((wonCount / Math.max(wonCount + rfqs.filter(r => r.status === 'lost').length, 1)) * 100).toFixed(0)}%
                                </div>
                                <div className="text-sm text-emerald-300/80">Win Rate</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by RFQ number, product, or company..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div className="relative">
                        <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="quoted">Quoted</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="expired">Expired</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* RFQ List */}
                <div className="space-y-4">
                    {filteredRfqs.length === 0 ? (
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-gray-300">No RFQs Found</h3>
                            <p className="text-gray-500 mt-1">No quote requests match your search criteria</p>
                        </div>
                    ) : (
                        filteredRfqs.map(rfq => {
                            const StatusIcon = STATUS_CONFIG[rfq.status].icon;
                            const isUrgent = rfq.status === 'pending' && rfq.urgency === 'high';

                            return (
                                <div
                                    key={rfq.id}
                                    className={`bg-gray-800 border rounded-xl overflow-hidden transition-all hover:border-gray-600 ${isUrgent ? 'border-red-500/50' : 'border-gray-700'
                                        }`}
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            {/* Left: RFQ Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-lg font-semibold">{rfq.rfqNumber}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_CONFIG[rfq.status].color}`}>
                                                        {STATUS_CONFIG[rfq.status].label}
                                                    </span>
                                                    {isUrgent && (
                                                        <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-medium text-white mb-3">{rfq.productName}</h3>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Quantity</span>
                                                        <div className="font-medium">{rfq.quantity.toLocaleString()} {rfq.unit}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Delivery</span>
                                                        <div className="font-medium">{formatDate(rfq.deliveryDate)}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Location</span>
                                                        <div className="font-medium">{rfq.deliveryLocation}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Received</span>
                                                        <div className="font-medium">{formatTimeAgo(rfq.receivedAt)}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <BuildingOffice2Icon className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-300">{rfq.buyer.company}</span>
                                                    </div>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-gray-400">{rfq.project}</span>
                                                </div>

                                                {rfq.notes && (
                                                    <div className="mt-3 p-3 bg-gray-900/50 rounded-lg text-sm text-gray-400">
                                                        <span className="font-medium text-gray-300">Notes: </span>
                                                        {rfq.notes}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Actions & Quote Info */}
                                            <div className="lg:w-64 shrink-0">
                                                {rfq.status === 'pending' && (
                                                    <div className="space-y-3">
                                                        <div className={`text-center p-3 rounded-lg ${getTimeRemaining(rfq.expiresAt) === 'Expired'
                                                                ? 'bg-red-500/10 text-red-400'
                                                                : 'bg-yellow-500/10 text-yellow-400'
                                                            }`}>
                                                            <ClockIcon className="w-5 h-5 mx-auto mb-1" />
                                                            <div className="text-sm font-medium">{getTimeRemaining(rfq.expiresAt)}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRfq(rfq);
                                                                setShowQuoteModal(true);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                                                        >
                                                            <PaperAirplaneIcon className="w-4 h-4" />
                                                            Submit Quote
                                                        </button>
                                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                                                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                            Message Buyer
                                                        </button>
                                                    </div>
                                                )}

                                                {rfq.quote && (
                                                    <div className="bg-gray-900/50 rounded-lg p-4">
                                                        <div className="text-sm text-gray-400 mb-2">Your Quote</div>
                                                        <div className="text-2xl font-bold text-emerald-400">
                                                            ${rfq.quote.price.toLocaleString()}/{rfq.unit.replace(/s$/, '')}
                                                        </div>
                                                        <div className="mt-2 space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Lead Time</span>
                                                                <span>{rfq.quote.leadTime} days</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Valid Until</span>
                                                                <span>{formatDate(rfq.quote.validUntil)}</span>
                                                            </div>
                                                        </div>
                                                        {rfq.status === 'quoted' && (
                                                            <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                                                                <button className="flex-1 text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                                                                    Edit Quote
                                                                </button>
                                                                <button className="text-sm px-3 py-1.5 text-gray-400 hover:text-gray-300 transition-colors">
                                                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {rfq.status === 'expired' && (
                                                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                                                        <XCircleIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                                        <div className="text-gray-400 text-sm">This RFQ has expired</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Quote Modal */}
                {showQuoteModal && selectedRfq && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-bold">Submit Quote</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    {selectedRfq.rfqNumber} - {selectedRfq.productName}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-gray-900/50 rounded-lg p-4 text-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500">Quantity</span>
                                            <div className="font-medium">{selectedRfq.quantity.toLocaleString()} {selectedRfq.unit}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Delivery Date</span>
                                            <div className="font-medium">{formatDate(selectedRfq.deliveryDate)}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Location</span>
                                            <div className="font-medium">{selectedRfq.deliveryLocation}</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Buyer</span>
                                            <div className="font-medium">{selectedRfq.buyer.company}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Unit Price ($/{selectedRfq.unit.replace(/s$/, '')})
                                    </label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={quoteForm.price}
                                            onChange={e => setQuoteForm(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="Enter unit price"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    {quoteForm.price && (
                                        <div className="mt-1 text-sm text-gray-400">
                                            Total: ${(parseFloat(quoteForm.price) * selectedRfq.quantity).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Lead Time (days)</label>
                                    <div className="relative">
                                        <TruckIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={quoteForm.leadTime}
                                            onChange={e => setQuoteForm(prev => ({ ...prev, leadTime: e.target.value }))}
                                            placeholder="Days to deliver"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Quote Valid For</label>
                                    <select
                                        value={quoteForm.validDays}
                                        onChange={e => setQuoteForm(prev => ({ ...prev, validDays: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="7">7 days</option>
                                        <option value="14">14 days</option>
                                        <option value="30">30 days</option>
                                        <option value="60">60 days</option>
                                        <option value="90">90 days</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Additional Notes</label>
                                    <textarea
                                        value={quoteForm.notes}
                                        onChange={e => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Include any terms, conditions, or additional details..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-700 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowQuoteModal(false);
                                        setSelectedRfq(null);
                                        setQuoteForm({ price: '', leadTime: '', validDays: '30', notes: '' });
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitQuote}
                                    disabled={!quoteForm.price || !quoteForm.leadTime}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                    Send Quote
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
