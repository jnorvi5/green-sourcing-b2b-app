/**
 * Quote Details Page
 *
 * View and respond to supplier quotes
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    BuildingOfficeIcon,
    TruckIcon,
    ClockIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChatBubbleLeftIcon,
    PrinterIcon,
    ShareIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface QuoteItem {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    leadTime: string;
    carbonPerUnit: number;
}

interface Quote {
    id: string;
    rfqId: string;
    rfqTitle: string;
    supplier: {
        id: string;
        name: string;
        logo?: string;
        rating: number;
        verified: boolean;
        location: string;
    };
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'countered';
    items: QuoteItem[];
    subtotal: number;
    shipping: number;
    taxes: number;
    total: number;
    totalCarbon: number;
    validUntil: string;
    createdAt: string;
    paymentTerms: string;
    deliveryTerms: string;
    notes?: string;
    attachments?: string[];
}

const MOCK_QUOTE: Quote = {
    id: 'QT-2024-001',
    rfqId: 'RFQ-2024-0012',
    rfqTitle: 'Structural Steel for Riverside Development',
    supplier: {
        id: 's1',
        name: 'EcoSteel Solutions',
        rating: 4.8,
        verified: true,
        location: 'Pittsburgh, PA',
    },
    status: 'pending',
    items: [
        {
            productId: 'p1',
            productName: 'Recycled Structural Steel Beams (W12x26)',
            quantity: 500,
            unit: 'tons',
            unitPrice: 850,
            totalPrice: 425000,
            leadTime: '4-6 weeks',
            carbonPerUnit: 0.8,
        },
        {
            productId: 'p2',
            productName: 'Steel Reinforcement Bars (Grade 60)',
            quantity: 200,
            unit: 'tons',
            unitPrice: 720,
            totalPrice: 144000,
            leadTime: '3-4 weeks',
            carbonPerUnit: 0.65,
        },
        {
            productId: 'p3',
            productName: 'Steel Connection Plates',
            quantity: 1000,
            unit: 'pcs',
            unitPrice: 45,
            totalPrice: 45000,
            leadTime: '2-3 weeks',
            carbonPerUnit: 0.02,
        },
    ],
    subtotal: 614000,
    shipping: 12500,
    taxes: 0,
    total: 626500,
    totalCarbon: 530,
    validUntil: '2024-02-15',
    createdAt: '2024-01-25',
    paymentTerms: 'Net 30 from delivery',
    deliveryTerms: 'DAP - Delivered at Place (Project Site)',
    notes:
        'Quote includes EPD documentation for all products. Steel beams are mill-certified with full traceability. Partial shipments available upon request.',
    attachments: ['EPD_Steel_Beams.pdf', 'Mill_Certificate.pdf', 'Product_Specifications.pdf'],
};

export function QuoteDetails() {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        const fetchQuote = async () => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setQuote(MOCK_QUOTE);
            setLoading(false);
        };
        fetchQuote();
    }, [quoteId]);

    const handleAccept = async () => {
        // In real app, would call API
        setQuote((prev) => (prev ? { ...prev, status: 'accepted' } : null));
        setShowAcceptModal(false);
    };

    const handleReject = async () => {
        // In real app, would call API with reason
        setQuote((prev) => (prev ? { ...prev, status: 'rejected' } : null));
        setShowRejectModal(false);
        setRejectReason('');
    };

    const daysUntilExpiry = quote
        ? Math.ceil(
            (new Date(quote.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        : 0;

    const isExpired = daysUntilExpiry <= 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Quote Not Found</h2>
                    <p className="text-gray-400 mb-4">The quote you're looking for doesn't exist.</p>
                    <Link to="/rfq-history" className="text-emerald-400 hover:underline">
                        Back to RFQ History
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: Quote['status']) => {
        const styles = {
            pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
            accepted: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
            rejected: 'bg-red-900/50 text-red-400 border-red-800',
            expired: 'bg-gray-700 text-gray-400 border-gray-600',
            countered: 'bg-blue-900/50 text-blue-400 border-blue-800',
        };
        return styles[status] || styles.pending;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        Back
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold">Quote {quote.id}</h1>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(
                                        quote.status
                                    )}`}
                                >
                                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                </span>
                            </div>
                            <p className="text-gray-400">
                                For RFQ: <Link to={`/rfq/${quote.rfqId}`} className="text-emerald-400 hover:underline">{quote.rfqTitle}</Link>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <PrinterIcon className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <ShareIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Expiry Warning */}
                {quote.status === 'pending' && daysUntilExpiry <= 3 && !isExpired && (
                    <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3 mb-6">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400">
                            This quote expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. Take action soon!
                        </span>
                    </div>
                )}

                {isExpired && quote.status === 'pending' && (
                    <div className="flex items-center gap-3 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 mb-6">
                        <XCircleIcon className="w-5 h-5 text-red-400" />
                        <span className="text-red-400">
                            This quote has expired. Please request a new quote from the supplier.
                        </span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Supplier Info */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-bold mb-4">Supplier</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-lg bg-gray-700 flex items-center justify-center">
                                    <BuildingOfficeIcon className="w-7 h-7 text-gray-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/supplier/${quote.supplier.id}`}
                                            className="font-bold text-lg hover:text-emerald-400 transition-colors"
                                        >
                                            {quote.supplier.name}
                                        </Link>
                                        {quote.supplier.verified && (
                                            <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm">{quote.supplier.location}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-yellow-400">★</span>
                                        <span className="text-sm">{quote.supplier.rating}</span>
                                    </div>
                                </div>
                                <Link
                                    to={`/messages?supplier=${quote.supplier.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <ChatBubbleLeftIcon className="w-5 h-5" />
                                    Message
                                </Link>
                            </div>
                        </div>

                        {/* Quote Items */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                                <h3 className="font-bold">Quoted Items</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                                            <th className="px-6 py-3 font-medium">Product</th>
                                            <th className="px-6 py-3 font-medium">Qty</th>
                                            <th className="px-6 py-3 font-medium">Unit Price</th>
                                            <th className="px-6 py-3 font-medium">Lead Time</th>
                                            <th className="px-6 py-3 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quote.items.map((item) => (
                                            <tr key={item.productId} className="border-b border-gray-700 last:border-0">
                                                <td className="px-6 py-4">
                                                    <Link
                                                        to={`/product/${item.productId}`}
                                                        className="font-medium hover:text-emerald-400 transition-colors"
                                                    >
                                                        {item.productName}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Carbon: {item.carbonPerUnit} tCO₂e/{item.unit}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {item.quantity.toLocaleString()} {item.unit}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    ${item.unitPrice.toLocaleString()}/{item.unit}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">{item.leadTime}</td>
                                                <td className="px-6 py-4 text-right font-medium">
                                                    ${item.totalPrice.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Terms & Notes */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-bold mb-4">Terms & Notes</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Payment Terms</p>
                                    <p className="text-gray-300">{quote.paymentTerms}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Delivery Terms</p>
                                    <p className="text-gray-300">{quote.deliveryTerms}</p>
                                </div>
                            </div>
                            {quote.notes && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">Supplier Notes</p>
                                    <p className="text-gray-300">{quote.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Attachments */}
                        {quote.attachments && quote.attachments.length > 0 && (
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                                <h3 className="font-bold mb-4">Attachments</h3>
                                <div className="space-y-2">
                                    {quote.attachments.map((file, i) => (
                                        <a
                                            key={i}
                                            href="#"
                                            className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-850 rounded-lg transition-colors"
                                        >
                                            <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                                            <span className="text-emerald-400">{file}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h3 className="font-bold mb-4">Quote Summary</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>${quote.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Shipping</span>
                                    <span>${quote.shipping.toLocaleString()}</span>
                                </div>
                                {quote.taxes > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>Taxes</span>
                                        <span>${quote.taxes.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-700">
                                    <span>Total</span>
                                    <span className="text-emerald-400">${quote.total.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Carbon Impact */}
                            <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <ChartBarIcon className="w-5 h-5 text-emerald-400" />
                                    <span className="font-medium">Carbon Impact</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-400">{quote.totalCarbon} tCO₂e</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    ~40% less than industry average
                                </p>
                            </div>

                            {/* Validity */}
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                                <ClockIcon className="w-5 h-5" />
                                <span>
                                    Valid until{' '}
                                    {new Date(quote.validUntil).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>

                            {/* Actions */}
                            {quote.status === 'pending' && !isExpired && (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowAcceptModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Accept Quote
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-red-400 rounded-lg font-medium transition-colors"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                        Decline Quote
                                    </button>
                                    <Link
                                        to={`/messages?supplier=${quote.supplier.id}&rfq=${quote.rfqId}`}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                                    >
                                        <ChatBubbleLeftIcon className="w-5 h-5" />
                                        Negotiate
                                    </Link>
                                </div>
                            )}

                            {quote.status === 'accepted' && (
                                <div className="text-center p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                                    <CheckCircleIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                    <p className="font-medium text-emerald-400">Quote Accepted</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        The supplier will begin processing your order.
                                    </p>
                                </div>
                            )}

                            {quote.status === 'rejected' && (
                                <div className="text-center p-4 bg-red-900/20 border border-red-800 rounded-lg">
                                    <XCircleIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <p className="font-medium text-red-400">Quote Declined</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h4 className="font-bold mb-4">Quick Stats</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Items</span>
                                    <span>{quote.items.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Avg Lead Time</span>
                                    <span>4 weeks</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">$/tCO₂e Saved</span>
                                    <span className="text-emerald-400">$1,182</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accept Modal */}
            {showAcceptModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                            <h2 className="text-xl font-bold">Accept Quote</h2>
                        </div>
                        <p className="text-gray-400 mb-6">
                            By accepting this quote, you agree to proceed with the order under the stated terms.
                            The supplier will be notified and will begin processing.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAcceptModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                            >
                                Confirm Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <XCircleIcon className="w-8 h-8 text-red-400" />
                            <h2 className="text-xl font-bold">Decline Quote</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            Please provide a reason for declining (optional). This helps suppliers improve their offers.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Price too high, lead time too long..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg resize-none mb-6 focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition-colors"
                            >
                                Decline Quote
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuoteDetails;
