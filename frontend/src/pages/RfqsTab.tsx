import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchRFQs, respondToRFQ, MongoRFQ, getRFQStatusInfo } from '../lib/rfq-api';
import { ClockIcon, CheckCircleIcon, EnvelopeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface RfqsTabProps {
  supplierId?: string;
}

export function RfqsTab({ supplierId }: RfqsTabProps) {
  const [rfqs, setRfqs] = useState<MongoRFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  
  // Response modal state
  const [respondingTo, setRespondingTo] = useState<MongoRFQ | null>(null);
  const [responseForm, setResponseForm] = useState({
    message: '',
    quotedPrice: '',
    leadTime: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Get supplier ID from props or localStorage
  const currentSupplierId = supplierId || localStorage.getItem('greenchainz-supplier-id') || 'demo-supplier-001';

  useEffect(() => {
    async function loadRFQs() {
      setLoading(true);
      setError(null);

      const filters = filter === 'all' 
        ? { supplierId: currentSupplierId }
        : { supplierId: currentSupplierId, status: filter };

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
  }, [currentSupplierId, filter]);

  // Handle response submission
  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingTo) return;

    setSubmitting(true);

    const response = await respondToRFQ(respondingTo._id, {
      message: responseForm.message,
      quotedPrice: responseForm.quotedPrice ? parseFloat(responseForm.quotedPrice) : undefined,
      leadTime: responseForm.leadTime ? parseInt(responseForm.leadTime) : undefined
    });

    if (response.success) {
      // Update the RFQ in the list
      setRfqs(prev => prev.map(rfq => 
        rfq._id === respondingTo._id ? { ...rfq, status: 'responded', response: response.data.response } : rfq
      ));
      setRespondingTo(null);
      setResponseForm({ message: '', quotedPrice: '', leadTime: '' });
    } else {
      alert(response.error || 'Failed to submit response');
    }

    setSubmitting(false);
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'New' },
    { value: 'responded', label: 'Quoted' },
    { value: 'accepted', label: 'Won' },
    { value: 'declined', label: 'Lost' },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Quote Requests</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-5 bg-slate-700 rounded w-40" />
                  <div className="h-4 bg-slate-700 rounded w-24" />
                </div>
                <div className="h-6 bg-slate-700 rounded-full w-16" />
              </div>
              <div className="h-4 bg-slate-700 rounded w-48 mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Quote Requests</h2>
        <div className="flex gap-2 overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* RFQ List */}
      <div className="space-y-4">
        {rfqs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <EnvelopeIcon className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-white font-medium">No quote requests found</p>
            <p className="text-slate-400 text-sm mt-1">
              {filter !== 'all' ? 'Try changing the filter' : 'Quote requests from buyers will appear here'}
            </p>
          </div>
        ) : (
          rfqs.map((rfq) => {
            const statusInfo = getRFQStatusInfo(rfq.status);
            return (
              <div key={rfq._id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {rfq.buyerCompany || rfq.buyerName}
                    </h3>
                    <p className="text-slate-400 text-sm">{rfq.buyerEmail}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    rfq.status === 'pending' ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400' :
                    rfq.status === 'responded' ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400' :
                    rfq.status === 'accepted' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
                    'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mb-4">
                  <Link 
                    to={`/product/${rfq.productId}`}
                    className="text-sky-400 hover:text-sky-300 font-medium"
                  >
                    {rfq.productTitle}
                  </Link>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span>Qty: {rfq.quantity} {rfq.unit}</span>
                    {rfq.deliveryDate && (
                      <span>Delivery: {new Date(rfq.deliveryDate).toLocaleDateString()}</span>
                    )}
                    {rfq.deliveryLocation && (
                      <span>📍 {rfq.deliveryLocation}</span>
                    )}
                  </div>
                </div>

                {rfq.message && (
                  <div className="mb-4 p-3 rounded-lg bg-slate-800/50 text-slate-300 text-sm">
                    <strong className="text-slate-400">Message:</strong> {rfq.message}
                  </div>
                )}

                {/* Response info if already responded */}
                {rfq.status === 'responded' && rfq.response && (
                  <div className="mb-4 p-3 rounded-lg bg-green-900/20 border border-green-500/30 text-green-300 text-sm">
                    <div className="flex items-center gap-4 mb-2">
                      {rfq.response.quotedPrice && (
                        <span className="font-bold text-lg">${rfq.response.quotedPrice.toLocaleString()}</span>
                      )}
                      {rfq.response.leadTime && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" /> {rfq.response.leadTime} days lead time
                        </span>
                      )}
                    </div>
                    {rfq.response.message && <p>{rfq.response.message}</p>}
                  </div>
                )}

                {/* Won/Lost badges */}
                {rfq.status === 'accepted' && (
                  <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/30 flex items-center gap-2 text-green-300">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">Quote accepted! Contact buyer to proceed.</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Received: {new Date(rfq.createdAt).toLocaleDateString()}
                  </span>
                  {rfq.status === 'pending' && (
                    <button 
                      onClick={() => setRespondingTo(rfq)}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
                    >
                      Send Quote
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Response Modal */}
      {respondingTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Send Quote</h3>
            <p className="text-slate-400 text-sm mb-4">
              Responding to: <span className="text-white">{respondingTo.buyerCompany || respondingTo.buyerName}</span>
            </p>
            <p className="text-sky-400 font-medium mb-6">
              {respondingTo.productTitle} × {respondingTo.quantity} {respondingTo.unit}
            </p>

            <form onSubmit={handleRespond} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">
                  <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                  Quoted Price (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Total price"
                  value={responseForm.quotedPrice}
                  onChange={(e) => setResponseForm({ ...responseForm, quotedPrice: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Lead Time (days, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Estimated delivery days"
                  value={responseForm.leadTime}
                  onChange={(e) => setResponseForm({ ...responseForm, leadTime: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">
                  Message *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Include any terms, conditions, or additional details..."
                  value={responseForm.message}
                  onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingTo(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-slate-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Quote'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
