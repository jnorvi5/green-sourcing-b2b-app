import React, { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Eye,
    Search,
    Filter,
    ChevronDown,
    FolderOpen,
    File,
    FileCheck,
    FileWarning,
    FilePlus,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    MoreHorizontal,
    Share2,
    Lock,
    Building,
    User,
    Calendar,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

interface Document {
    _id: string;
    name: string;
    type: string;
    category: string;
    size: number;
    mimeType: string;
    status: string;
    uploadedBy: string;
    relatedEntity?: {
        type: string;
        id: string;
        name?: string;
    };
    expiresAt?: string;
    createdAt: string;
    version: number;
}

interface DocumentStats {
    totalDocuments: number;
    totalSize: number;
    pendingReview: number;
    expiringSoon: number;
}

const Documents: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState<DocumentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        category: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState('');
    const [uploadCategory, setUploadCategory] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    useEffect(() => {
        const mockDocuments: Document[] = [
            {
                _id: '1',
                name: 'Purchase Agreement - GreenCorp 2024',
                type: 'contract',
                category: 'procurement',
                size: 245000,
                mimeType: 'application/pdf',
                status: 'active',
                uploadedBy: 'admin@greenchainz.com',
                relatedEntity: { type: 'supplier', id: 'sup1', name: 'EcoMaterials Inc' },
                expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
                createdAt: new Date().toISOString(),
                version: 1,
            },
            {
                _id: '2',
                name: 'EPD Certificate - Recycled Steel',
                type: 'epd',
                category: 'sustainability',
                size: 1250000,
                mimeType: 'application/pdf',
                status: 'verified',
                uploadedBy: 'supplier@ecomaterials.com',
                relatedEntity: { type: 'product', id: 'prod1', name: 'Recycled Steel Beams' },
                expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
                version: 2,
            },
            {
                _id: '3',
                name: 'Invoice INV-2024-0015',
                type: 'invoice',
                category: 'financial',
                size: 85000,
                mimeType: 'application/pdf',
                status: 'active',
                uploadedBy: 'system',
                relatedEntity: { type: 'order', id: 'ord1', name: 'ORD-2024-001' },
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                version: 1,
            },
            {
                _id: '4',
                name: 'ISO 14001 Certification',
                type: 'certificate',
                category: 'compliance',
                size: 520000,
                mimeType: 'application/pdf',
                status: 'pending_review',
                uploadedBy: 'supplier@greenbuilders.com',
                relatedEntity: { type: 'supplier', id: 'sup2', name: 'GreenBuilders Ltd' },
                expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                version: 1,
            },
            {
                _id: '5',
                name: 'Material Spec Sheet - Bamboo Flooring',
                type: 'specification',
                category: 'product',
                size: 3400000,
                mimeType: 'application/pdf',
                status: 'active',
                uploadedBy: 'supplier@bambooworld.com',
                relatedEntity: { type: 'product', id: 'prod2', name: 'Bamboo Flooring Premium' },
                createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
                version: 3,
            },
            {
                _id: '6',
                name: 'PO-2024-0089',
                type: 'purchase_order',
                category: 'procurement',
                size: 125000,
                mimeType: 'application/pdf',
                status: 'active',
                uploadedBy: 'buyer@construction.com',
                relatedEntity: { type: 'order', id: 'ord2', name: 'ORD-2024-003' },
                createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
                version: 1,
            },
            {
                _id: '7',
                name: 'Carbon Footprint Report Q4 2023',
                type: 'report',
                category: 'sustainability',
                size: 2800000,
                mimeType: 'application/pdf',
                status: 'active',
                uploadedBy: 'admin@greenchainz.com',
                createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
                version: 1,
            },
            {
                _id: '8',
                name: 'Expired Certificate - FSC Wood',
                type: 'certificate',
                category: 'compliance',
                size: 450000,
                mimeType: 'application/pdf',
                status: 'expired',
                uploadedBy: 'supplier@woodworks.com',
                relatedEntity: { type: 'supplier', id: 'sup3', name: 'WoodWorks Inc' },
                expiresAt: new Date(Date.now() - 30 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 400 * 86400000).toISOString(),
                version: 1,
            },
        ];

        setDocuments(mockDocuments);
        setStats({
            totalDocuments: mockDocuments.length,
            totalSize: mockDocuments.reduce((sum, d) => sum + d.size, 0),
            pendingReview: mockDocuments.filter(d => d.status === 'pending_review').length,
            expiringSoon: mockDocuments.filter(d => {
                if (!d.expiresAt) return false;
                const daysUntilExpiry = (new Date(d.expiresAt).getTime() - Date.now()) / 86400000;
                return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            }).length,
        });
        setLoading(false);
    }, []);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'contract':
                return <FileCheck className="w-5 h-5 text-blue-600" />;
            case 'epd':
            case 'certificate':
                return <FileCheck className="w-5 h-5 text-green-600" />;
            case 'invoice':
            case 'purchase_order':
                return <FileText className="w-5 h-5 text-purple-600" />;
            case 'specification':
                return <File className="w-5 h-5 text-amber-600" />;
            case 'report':
                return <FileText className="w-5 h-5 text-cyan-600" />;
            default:
                return <File className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
            case 'verified':
                return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Verified</span>;
            case 'pending_review':
                return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Pending Review</span>;
            case 'expired':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Expired</span>;
            case 'archived':
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Archived</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            procurement: 'Procurement',
            sustainability: 'Sustainability',
            financial: 'Financial',
            compliance: 'Compliance',
            product: 'Product',
        };
        return labels[category] || category;
    };

    const handleUpload = async () => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        // Would call API here
        console.log('Uploading:', {
            files: selectedFiles,
            type: uploadType,
            category: uploadCategory,
        });
        setShowUploadModal(false);
        setSelectedFiles(null);
        setUploadType('');
        setUploadCategory('');
    };

    const filteredDocuments = documents.filter(doc => {
        if (filters.type && doc.type !== filters.type) return false;
        if (filters.status && doc.status !== filters.status) return false;
        if (filters.category && doc.category !== filters.category) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                doc.name.toLowerCase().includes(query) ||
                doc.type.toLowerCase().includes(query)
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
                        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                        <p className="text-gray-500 mt-1">Manage contracts, certificates, and files</p>
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
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-blue-50 rounded-lg">
                                    <FolderOpen className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Total Documents</p>
                            <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-purple-50 rounded-lg">
                                    <File className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Total Size</p>
                            <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-amber-50 rounded-lg">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Pending Review</p>
                            <p className="text-2xl font-bold">{stats.pendingReview}</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between">
                                <div className="p-2.5 bg-red-50 rounded-lg">
                                    <FileWarning className="w-5 h-5 text-red-600" />
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">Expiring Soon</p>
                            <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All Types</option>
                                    <option value="contract">Contract</option>
                                    <option value="invoice">Invoice</option>
                                    <option value="purchase_order">Purchase Order</option>
                                    <option value="epd">EPD</option>
                                    <option value="certificate">Certificate</option>
                                    <option value="specification">Specification</option>
                                    <option value="report">Report</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="verified">Verified</option>
                                    <option value="pending_review">Pending Review</option>
                                    <option value="expired">Expired</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All Categories</option>
                                    <option value="procurement">Procurement</option>
                                    <option value="sustainability">Sustainability</option>
                                    <option value="financial">Financial</option>
                                    <option value="compliance">Compliance</option>
                                    <option value="product">Product</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ type: '', status: '', category: '' })}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc._id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDocument(doc)}
                                >
                                    <div className="p-3 bg-white rounded-lg shadow-sm">
                                        {getTypeIcon(doc.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className="capitalize">{doc.type.replace('_', ' ')}</span>
                                            <span>•</span>
                                            <span>{formatFileSize(doc.size)}</span>
                                            <span>•</span>
                                            <span>{getCategoryLabel(doc.category)}</span>
                                            {doc.relatedEntity && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        {doc.relatedEntity.type === 'supplier' ? (
                                                            <Building className="w-3 h-3" />
                                                        ) : doc.relatedEntity.type === 'product' ? (
                                                            <File className="w-3 h-3" />
                                                        ) : (
                                                            <FileText className="w-3 h-3" />
                                                        )}
                                                        {doc.relatedEntity.name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(doc.status)}

                                        {doc.expiresAt && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(doc.expiresAt).toLocaleDateString()}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 hover:bg-white rounded" title="Download">
                                                <Download className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button className="p-1.5 hover:bg-white rounded" title="Share">
                                                <Share2 className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button className="p-1.5 hover:bg-white rounded" title="More">
                                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredDocuments.length === 0 && (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No documents found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                            <div className="p-6 border-b">
                                <h2 className="text-lg font-semibold">Upload Document</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                    <select
                                        value={uploadType}
                                        onChange={(e) => setUploadType(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="contract">Contract</option>
                                        <option value="invoice">Invoice</option>
                                        <option value="purchase_order">Purchase Order</option>
                                        <option value="epd">EPD Certificate</option>
                                        <option value="certificate">Other Certificate</option>
                                        <option value="specification">Specification Sheet</option>
                                        <option value="report">Report</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={uploadCategory}
                                        onChange={(e) => setUploadCategory(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Select category...</option>
                                        <option value="procurement">Procurement</option>
                                        <option value="sustainability">Sustainability</option>
                                        <option value="financial">Financial</option>
                                        <option value="compliance">Compliance</option>
                                        <option value="product">Product</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Files</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={(e) => setSelectedFiles(e.target.files)}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            <FilePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">
                                                {selectedFiles && selectedFiles.length > 0
                                                    ? `${selectedFiles.length} file(s) selected`
                                                    : 'Click to select files or drag and drop'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS up to 10MB</p>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFiles || selectedFiles.length === 0 || !uploadType || !uploadCategory}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document Detail Modal */}
                {selectedDocument && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getTypeIcon(selectedDocument.type)}
                                        <h2 className="text-lg font-semibold">{selectedDocument.name}</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDocument(null)}
                                        className="p-1.5 hover:bg-gray-100 rounded"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4 pb-4 border-b">
                                    {getStatusBadge(selectedDocument.status)}
                                    <span className="text-sm text-gray-500">Version {selectedDocument.version}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Type</p>
                                        <p className="font-medium capitalize">{selectedDocument.type.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Category</p>
                                        <p className="font-medium">{getCategoryLabel(selectedDocument.category)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Size</p>
                                        <p className="font-medium">{formatFileSize(selectedDocument.size)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Format</p>
                                        <p className="font-medium">{selectedDocument.mimeType.split('/')[1].toUpperCase()}</p>
                                    </div>
                                </div>

                                {selectedDocument.relatedEntity && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500 mb-2">Related To</p>
                                        <div className="flex items-center gap-2">
                                            {selectedDocument.relatedEntity.type === 'supplier' ? (
                                                <Building className="w-4 h-4 text-gray-400" />
                                            ) : selectedDocument.relatedEntity.type === 'product' ? (
                                                <File className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-gray-400" />
                                            )}
                                            <span className="capitalize">{selectedDocument.relatedEntity.type}:</span>
                                            <span className="font-medium">{selectedDocument.relatedEntity.name}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Uploaded By</p>
                                        <p className="font-medium">{selectedDocument.uploadedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Upload Date</p>
                                        <p className="font-medium">{new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {selectedDocument.expiresAt && (
                                    <div className={`rounded-lg p-4 ${new Date(selectedDocument.expiresAt) < new Date() ? 'bg-red-50' : 'bg-amber-50'
                                        }`}>
                                        <p className="text-sm text-gray-500 mb-1">Expiration Date</p>
                                        <p className="font-medium">
                                            {new Date(selectedDocument.expiresAt).toLocaleDateString()}
                                            {new Date(selectedDocument.expiresAt) < new Date() && (
                                                <span className="text-red-600 ml-2">(Expired)</span>
                                            )}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Documents;
