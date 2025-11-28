import { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Calendar,
    Building2,
    DollarSign,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Edit,
    Eye,
    Download,
    Send,
    RefreshCw,
    FileSignature,
    Leaf,
    MoreVertical,
} from 'lucide-react';

interface Contract {
    _id: string;
    contractNumber: string;
    title: string;
    type: 'purchase' | 'framework' | 'service' | 'nda' | 'custom';
    status: 'draft' | 'pending_review' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'renewed';
    buyerId: string;
    supplierId: string;
    totalValue: number;
    currency: string;
    effectiveDate: string;
    expirationDate: string;
    signatures: {
        signerName: string;
        company: string;
        status: 'pending' | 'signed' | 'declined';
        signedAt?: string;
    }[];
    sustainabilityCommitments?: {
        type: string;
        target: string;
    }[];
    createdAt: string;
}

interface ContractListResponse {
    contracts: Contract[];
    total: number;
    pages: number;
}

const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-700', icon: Edit, label: 'Draft' },
    pending_review: { color: 'bg-blue-100 text-blue-700', icon: Eye, label: 'Pending Review' },
    pending_signature: { color: 'bg-yellow-100 text-yellow-700', icon: FileSignature, label: 'Awaiting Signature' },
    active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Active' },
    expired: { color: 'bg-red-100 text-red-700', icon: Clock, label: 'Expired' },
    terminated: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Terminated' },
    renewed: { color: 'bg-purple-100 text-purple-700', icon: RefreshCw, label: 'Renewed' },
};

const typeLabels = {
    purchase: 'Purchase Agreement',
    framework: 'Framework Agreement',
    service: 'Service Contract',
    nda: 'NDA',
    custom: 'Custom',
};

export default function Contracts() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [showNewContract, setShowNewContract] = useState(false);

    useEffect(() => {
        fetchContracts();
    }, [currentPage, statusFilter, typeFilter, searchTerm]);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10',
                ...(statusFilter && { status: statusFilter }),
                ...(typeFilter && { type: typeFilter }),
                ...(searchTerm && { search: searchTerm }),
            });

            const response = await fetch(`/api/contracts?${params}`);
            if (response.ok) {
                const data: ContractListResponse = await response.json();
                setContracts(data.contracts);
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch contracts:', error);
            // Mock data for demo
            setContracts([
                {
                    _id: '1',
                    contractNumber: 'GCZ-2024-00001',
                    title: 'Sustainable Steel Supply Agreement',
                    type: 'framework',
                    status: 'active',
                    buyerId: 'buyer-1',
                    supplierId: 'supplier-1',
                    totalValue: 2500000,
                    currency: 'USD',
                    effectiveDate: '2024-01-01',
                    expirationDate: '2025-12-31',
                    signatures: [
                        { signerName: 'John Smith', company: 'BuildGreen Inc', status: 'signed', signedAt: '2024-01-01' },
                        { signerName: 'Sarah Johnson', company: 'EcoSteel Ltd', status: 'signed', signedAt: '2024-01-02' },
                    ],
                    sustainabilityCommitments: [
                        { type: 'carbon_reduction', target: '30% reduction by 2025' },
                        { type: 'recycled_content', target: 'Minimum 80% recycled steel' },
                    ],
                    createdAt: '2023-12-15',
                },
                {
                    _id: '2',
                    contractNumber: 'GCZ-2024-00002',
                    title: 'Timber Purchase Agreement - Q2 2024',
                    type: 'purchase',
                    status: 'pending_signature',
                    buyerId: 'buyer-1',
                    supplierId: 'supplier-2',
                    totalValue: 850000,
                    currency: 'USD',
                    effectiveDate: '2024-04-01',
                    expirationDate: '2024-06-30',
                    signatures: [
                        { signerName: 'John Smith', company: 'BuildGreen Inc', status: 'signed', signedAt: '2024-03-15' },
                        { signerName: 'Mike Wilson', company: 'ForestCraft', status: 'pending' },
                    ],
                    sustainabilityCommitments: [
                        { type: 'certification', target: 'FSC Certified' },
                    ],
                    createdAt: '2024-03-10',
                },
                {
                    _id: '3',
                    contractNumber: 'GCZ-2024-00003',
                    title: 'Low-Carbon Concrete Supply',
                    type: 'framework',
                    status: 'draft',
                    buyerId: 'buyer-1',
                    supplierId: 'supplier-3',
                    totalValue: 1200000,
                    currency: 'USD',
                    effectiveDate: '2024-06-01',
                    expirationDate: '2025-05-31',
                    signatures: [],
                    sustainabilityCommitments: [
                        { type: 'carbon_reduction', target: '40% lower carbon concrete' },
                    ],
                    createdAt: '2024-03-20',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getDaysUntilExpiration = (expirationDate: string) => {
        const now = new Date();
        const expDate = new Date(expirationDate);
        const diffTime = expDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getSignatureProgress = (signatures: Contract['signatures']) => {
        const signed = signatures.filter((s) => s.status === 'signed').length;
        const total = signatures.length;
        return { signed, total, percentage: total > 0 ? (signed / total) * 100 : 0 };
    };

    // Stats
    const activeContracts = contracts.filter((c) => c.status === 'active').length;
    const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
    const pendingSignatures = contracts.filter((c) => c.status === 'pending_signature').length;
    const expiringContracts = contracts.filter((c) => {
        const days = getDaysUntilExpiration(c.expirationDate);
        return c.status === 'active' && days <= 30 && days > 0;
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-7 h-7 text-green-600" />
                        Contract Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage supplier agreements and sustainability commitments
                    </p>
                </div>
                <button
                    onClick={() => setShowNewContract(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Contract
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Contracts</p>
                            <p className="text-2xl font-bold text-gray-800">{activeContracts}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Value</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatCurrency(totalValue, 'USD')}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending Signatures</p>
                            <p className="text-2xl font-bold text-yellow-600">{pendingSignatures}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <FileSignature className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Expiring (30 days)</p>
                            <p className="text-2xl font-bold text-red-600">{expiringContracts}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search contracts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="pending_signature">Awaiting Signature</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="terminated">Terminated</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">All Types</option>
                        <option value="purchase">Purchase Agreement</option>
                        <option value="framework">Framework Agreement</option>
                        <option value="service">Service Contract</option>
                        <option value="nda">NDA</option>
                    </select>

                    <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Contracts List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading contracts...
                    </div>
                ) : contracts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No contracts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Contract</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Value</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Duration</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Signatures</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Sustainability</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {contracts.map((contract) => {
                                    const statusInfo = statusConfig[contract.status];
                                    const StatusIcon = statusInfo.icon;
                                    const sigProgress = getSignatureProgress(contract.signatures);
                                    const daysUntilExp = getDaysUntilExpiration(contract.expirationDate);
                                    const isExpiringSoon = contract.status === 'active' && daysUntilExp <= 30 && daysUntilExp > 0;

                                    return (
                                        <tr key={contract._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-800">{contract.title}</div>
                                                    <div className="text-sm text-gray-500">{contract.contractNumber}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {typeLabels[contract.type]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 font-medium">
                                                {formatCurrency(contract.totalValue, contract.currency)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(contract.effectiveDate)} - {formatDate(contract.expirationDate)}
                                                    </div>
                                                    {isExpiringSoon && (
                                                        <div className="text-xs text-red-600 mt-1">
                                                            Expires in {daysUntilExp} days
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {contract.signatures.length > 0 ? (
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-gray-600">
                                                            {sigProgress.signed}/{sigProgress.total} signed
                                                        </div>
                                                        <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                                                            <div
                                                                className="h-full bg-green-600 rounded-full"
                                                                style={{ width: `${sigProgress.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">No signatures</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {contract.sustainabilityCommitments && contract.sustainabilityCommitments.length > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <Leaf className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm text-green-600">
                                                            {contract.sustainabilityCommitments.length} commitments
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">None</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedContract(contract)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {contract.status === 'draft' && (
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {contract.status === 'pending_signature' && (
                                                        <button
                                                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-gray-100 rounded"
                                                            title="Send Reminder"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                                        title="More"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contract Detail Modal */}
            {selectedContract && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedContract.title}</h2>
                                    <p className="text-gray-500">{selectedContract.contractNumber}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedContract(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Contract Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Contract Type</label>
                                    <p className="font-medium">{typeLabels[selectedContract.type]}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Status</label>
                                    <p>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedContract.status].color}`}>
                                            {statusConfig[selectedContract.status].label}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Contract Value</label>
                                    <p className="font-medium text-lg">
                                        {formatCurrency(selectedContract.totalValue, selectedContract.currency)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Duration</label>
                                    <p className="font-medium">
                                        {formatDate(selectedContract.effectiveDate)} - {formatDate(selectedContract.expirationDate)}
                                    </p>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileSignature className="w-4 h-4 text-green-600" />
                                    Signatures
                                </h3>
                                <div className="space-y-2">
                                    {selectedContract.signatures.map((sig, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium">{sig.signerName}</p>
                                                    <p className="text-sm text-gray-500">{sig.company}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${sig.status === 'signed' ? 'bg-green-100 text-green-700' :
                                                    sig.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {sig.status === 'signed' ? `Signed ${sig.signedAt ? formatDate(sig.signedAt) : ''}` : sig.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sustainability Commitments */}
                            {selectedContract.sustainabilityCommitments && selectedContract.sustainabilityCommitments.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Leaf className="w-4 h-4 text-green-600" />
                                        Sustainability Commitments
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedContract.sustainabilityCommitments.map((commitment, idx) => (
                                            <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                <p className="font-medium text-green-800 capitalize">
                                                    {commitment.type.replace('_', ' ')}
                                                </p>
                                                <p className="text-sm text-green-600">{commitment.target}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                                {selectedContract.status === 'draft' && (
                                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                                        <Send className="w-4 h-4" />
                                        Send for Review
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Contract Modal */}
            {showNewContract && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Create New Contract</h2>
                                <button
                                    onClick={() => setShowNewContract(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Title</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="e.g., Sustainable Steel Supply Agreement"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="">Select type...</option>
                                        <option value="purchase">Purchase Agreement</option>
                                        <option value="framework">Framework Agreement</option>
                                        <option value="service">Service Contract</option>
                                        <option value="nda">NDA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Total value"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewContract(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    Create Contract
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
