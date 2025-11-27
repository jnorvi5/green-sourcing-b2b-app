// frontend/src/pages/RFQHistoryPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchRFQs, MongoRFQ, getRFQStatusInfo, updateRFQStatus } from '../lib/rfq-api';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// Skeleton loader for table rows
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
          <td className="px-6 py-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" /></td>
          <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
        </tr>
      ))}
    </>
  );
}

export default function RFQHistoryPage() {
  const [rfqs, setRfqs] = useState<MongoRFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Get user ID from localStorage or context
  const userId = localStorage.getItem('greenchainz-user-id') || 'demo-buyer-001';

  useEffect(() => {
    async function loadRFQs() {
      setLoading(true);
      setError(null);

      const filters = filter === 'all' 
        ? { buyerId: userId }
        : { buyerId: userId, status: filter };

      const response = await fetchRFQs(filters);

      if (!response.success) {
        setError(response.error || 'Failed to load quote requests');
        setLoading(false);
        return;
      }

      setRfqs(response.data);
      setLoading(false);
    }

    loadRFQs();
  }, [userId, filter]);

  // Handle accept/decline actions
  const handleStatusUpdate = async (rfqId: string, newStatus: 'accepted' | 'declined') => {
    setActionLoading(rfqId);
    
    const response = await updateRFQStatus(rfqId, newStatus);
    
    if (response.success) {
      setRfqs(prev => prev.map(rfq => 
        rfq._id === rfqId ? { ...rfq, status: newStatus } : rfq
      ));
    } else {
      alert(response.error || 'Failed to update status');
    }
    
    setActionLoading(null);
  };

  const filterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'responded', label: 'Quoted' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'declined', label: 'Declined' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">My Quote Requests</h1>
            <p className="text-muted-foreground mt-1">Track and manage your requests for quotes</p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Browse Products
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-500 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Supplier
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date Sent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <TableSkeleton />
                ) : rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-foreground font-medium">No quote requests found</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Browse products and request quotes from suppliers
                      </p>
                    </td>
                  </tr>
                ) : (
                  rfqs.map((rfq) => {
                    const statusInfo = getRFQStatusInfo(rfq.status);
                    return (
                      <tr key={rfq._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link 
                            to={`/product/${rfq.productId}`}
                            className="text-sm font-medium text-foreground hover:text-primary"
                          >
                            {rfq.productTitle}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Link 
                            to={`/supplier/${rfq.supplierId}`}
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            {rfq.supplierName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {rfq.quantity} {rfq.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {rfq.status === 'responded' && rfq.response && (
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                {rfq.response.quotedPrice && (
                                  <span className="font-semibold text-foreground">${rfq.response.quotedPrice}</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleStatusUpdate(rfq._id, 'accepted')}
                                disabled={actionLoading === rfq._id}
                                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded disabled:opacity-50"
                                title="Accept Quote"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(rfq._id, 'declined')}
                                disabled={actionLoading === rfq._id}
                                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                                title="Decline Quote"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {rfq.status === 'pending' && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              Awaiting response
                            </span>
                          )}
                          {rfq.status === 'accepted' && (
                            <span className="text-green-600">Quote accepted</span>
                          )}
                          {rfq.status === 'declined' && (
                            <span className="text-red-600">Quote declined</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination info */}
        {!loading && rfqs.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {rfqs.length} quote request{rfqs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
