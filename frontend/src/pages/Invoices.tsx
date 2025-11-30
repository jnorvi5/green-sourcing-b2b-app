/**
 * Invoices Page
 *
 * View and manage invoices, track payments, download PDFs
 */
import React, { useState } from 'react';
import {
    FileText,
    Download,
    Send,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    Eye,
    CreditCard,
    Building,
    Calendar,
    ChevronDown,
    ChevronRight,
    Plus,
    RefreshCw,
} from 'lucide-react';

interface Invoice {
    id: string;
    invoiceNumber: string;
    orderNumber: string;
    supplier: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    amountPaid: number;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue';
    items: number;
}

const mockInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2024-0891',
        orderNumber: 'ORD-2024-0567',
        supplier: 'EcoMaterials Co',
        issueDate: '2024-01-15',
        dueDate: '2024-02-14',
        amount: 12500.0,
        amountPaid: 12500.0,
        status: 'paid',
        items: 5,
    },
    {
        id: '2',
        invoiceNumber: 'INV-2024-0892',
        orderNumber: 'ORD-2024-0568',
        supplier: 'GreenPack Solutions',
        issueDate: '2024-01-18',
        dueDate: '2024-02-17',
        amount: 8750.0,
        amountPaid: 0,
        status: 'sent',
        items: 3,
    },
    {
        id: '3',
        invoiceNumber: 'INV-2024-0893',
        orderNumber: 'ORD-2024-0569',
        supplier: 'Sustainable Supply',
        issueDate: '2024-01-10',
        dueDate: '2024-01-25',
        amount: 15200.0,
        amountPaid: 7600.0,
        status: 'partial',
        items: 8,
    },
    {
        id: '4',
        invoiceNumber: 'INV-2024-0894',
        orderNumber: 'ORD-2024-0570',
        supplier: 'BioFiber Industries',
        issueDate: '2024-01-05',
        dueDate: '2024-01-20',
        amount: 6800.0,
        amountPaid: 0,
        status: 'overdue',
        items: 2,
    },
    {
        id: '5',
        invoiceNumber: 'INV-2024-0895',
        orderNumber: 'ORD-2024-0571',
        supplier: 'RecycleTech Partners',
        issueDate: '2024-01-20',
        dueDate: '2024-02-19',
        amount: 22100.0,
        amountPaid: 0,
        status: 'draft',
        items: 12,
    },
];

const statusConfig: Record<
    string,
    { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
    draft: {
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: <FileText className="w-4 h-4" />,
        label: 'Draft',
    },
    sent: {
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        icon: <Send className="w-4 h-4" />,
        label: 'Sent',
    },
    viewed: {
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        icon: <Eye className="w-4 h-4" />,
        label: 'Viewed',
    },
    paid: {
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Paid',
    },
    partial: {
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        icon: <Clock className="w-4 h-4" />,
        label: 'Partial',
    },
    overdue: {
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Overdue',
    },
};

export default function Invoices() {
    const [invoices] = useState<Invoice[]>(mockInvoices);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate summary stats
    const stats = {
        totalOutstanding: invoices
            .filter((i) => !['paid', 'draft'].includes(i.status))
            .reduce((sum, i) => sum + (i.amount - i.amountPaid), 0),
        overdue: invoices
            .filter((i) => i.status === 'overdue')
            .reduce((sum, i) => sum + i.amount, 0),
        paidThisMonth: invoices
            .filter((i) => i.status === 'paid')
            .reduce((sum, i) => sum + i.amount, 0),
        pendingCount: invoices.filter((i) => ['sent', 'viewed', 'partial'].includes(i.status))
            .length,
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                        <p className="text-gray-600">Manage and track your invoices</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <Plus className="w-4 h-4" />
                            New Invoice
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Outstanding</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(stats.totalOutstanding)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Overdue</p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(stats.overdue)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Paid This Month</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(stats.paidThisMonth)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-xl font-bold text-gray-900">{stats.pendingCount} invoices</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search invoices..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {['all', 'draft', 'sent', 'paid', 'partial', 'overdue'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {status === 'all' ? 'All' : statusConfig[status]?.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Invoice List */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Invoice
                                </th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Supplier
                                </th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Issue Date
                                </th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Due Date
                                </th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Amount
                                </th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                                    Status
                                </th>
                                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => {
                                const config = statusConfig[invoice.status];
                                const isPaid = invoice.status === 'paid';
                                const progress = (invoice.amountPaid / invoice.amount) * 100;

                                return (
                                    <tr
                                        key={invoice.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedInvoice(invoice)}
                                    >
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                                <p className="text-sm text-gray-500">Order: {invoice.orderNumber}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Building className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <span className="text-gray-900">{invoice.supplier}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">{invoice.issueDate}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span
                                                    className={
                                                        invoice.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                                                    }
                                                >
                                                    {invoice.dueDate}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {formatCurrency(invoice.amount)}
                                                </p>
                                                {invoice.status === 'partial' && (
                                                    <div className="mt-1">
                                                        <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500 rounded-full"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {formatCurrency(invoice.amountPaid)} paid
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}
                                            >
                                                {config.icon}
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                    title="View Invoice"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedInvoice(invoice);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                    title="Download PDF"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download className="w-4 h-4 text-gray-600" />
                                                </button>
                                                {!isPaid && (
                                                    <button
                                                        className="p-2 hover:bg-green-100 rounded-lg"
                                                        title="Record Payment"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInvoice(invoice);
                                                            setShowPaymentModal(true);
                                                        }}
                                                    >
                                                        <CreditCard className="w-4 h-4 text-green-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredInvoices.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No invoices found</p>
                        </div>
                    )}
                </div>

                {/* Invoice Detail Modal */}
                {selectedInvoice && !showPaymentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {selectedInvoice.invoiceNumber}
                                        </h2>
                                        <p className="text-gray-500">Order: {selectedInvoice.orderNumber}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedInvoice(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Supplier</p>
                                        <p className="font-medium text-gray-900">{selectedInvoice.supplier}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Status</p>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${statusConfig[selectedInvoice.status].bg
                                                } ${statusConfig[selectedInvoice.status].color}`}
                                        >
                                            {statusConfig[selectedInvoice.status].icon}
                                            {statusConfig[selectedInvoice.status].label}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Issue Date</p>
                                        <p className="font-medium text-gray-900">{selectedInvoice.issueDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Due Date</p>
                                        <p className="font-medium text-gray-900">{selectedInvoice.dueDate}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="font-medium text-gray-900 mb-4">Summary</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">
                                                Items ({selectedInvoice.items})
                                            </span>
                                            <span className="text-gray-900">
                                                {formatCurrency(selectedInvoice.amount * 0.9)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tax (10%)</span>
                                            <span className="text-gray-900">
                                                {formatCurrency(selectedInvoice.amount * 0.1)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="font-medium text-gray-900">Total</span>
                                            <span className="font-bold text-gray-900">
                                                {formatCurrency(selectedInvoice.amount)}
                                            </span>
                                        </div>
                                        {selectedInvoice.amountPaid > 0 && (
                                            <>
                                                <div className="flex justify-between text-green-600">
                                                    <span>Amount Paid</span>
                                                    <span>-{formatCurrency(selectedInvoice.amountPaid)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold">
                                                    <span>Amount Due</span>
                                                    <span>
                                                        {formatCurrency(
                                                            selectedInvoice.amount - selectedInvoice.amountPaid
                                                        )}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                                {selectedInvoice.status !== 'paid' && (
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Record Payment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                                <p className="text-gray-500">{selectedInvoice.invoiceNumber}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount Due
                                    </label>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(selectedInvoice.amount - selectedInvoice.amountPaid)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Amount
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        defaultValue={selectedInvoice.amount - selectedInvoice.amountPaid}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option>Bank Transfer</option>
                                        <option>Credit Card</option>
                                        <option>Check</option>
                                        <option>Wire Transfer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reference Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Transaction ID or check number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPaymentModal(false);
                                        setSelectedInvoice(null);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
