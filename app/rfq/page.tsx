'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';

function RFQForm() {
  const searchParams = useSearchParams();

  const productId = searchParams?.get('productId');
  const supplierId = searchParams?.get('supplierId');
  const productName = searchParams?.get('productName') || 'Selected Product';

  const [formData, setFormData] = useState({
    quantity: '',
    delivery_date: '',
    project_name: '',
    notes: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !supplierId) {
        setErrorMessage("Missing product or supplier information.");
        return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId,
          product_id: productId,
          quantity: Number(formData.quantity),
          delivery_date: formData.delivery_date || undefined,
          project_name: formData.project_name,
          notes: formData.notes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details ? JSON.stringify(data.details) : (data.error || 'Failed to submit RFQ'));
      }

      setStatus('success');
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(errorMsg);
    }
  };

  if (!productId || !supplierId) {
      return (
          <div className="container mx-auto p-8 text-center text-white">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Invalid Request</h1>
              <p className="mb-4">Product or Supplier information is missing.</p>
              <Link href="/search" className="text-teal-400 hover:underline">Return to Search</Link>
          </div>
      );
  }

  if (status === 'success') {
      return (
          <div className="container mx-auto p-8 text-center text-white max-w-md bg-gray-900 rounded-xl border border-teal-500/30 mt-10">
              <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-2xl font-bold text-teal-400 mb-2">RFQ Sent!</h1>
              <p className="text-gray-300 mb-6">Your request has been sent to the supplier. They will be notified immediately.</p>
              <Link href="/search" className="block w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-lg font-medium transition">Return to Marketplace</Link>
          </div>
      );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-white">
      <Link href="/search" className="text-gray-400 hover:text-white mb-6 inline-block">← Back to Search</Link>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Request Quote</h1>
        <p className="text-gray-400 mb-8">For <span className="text-teal-400 font-medium">{productName}</span></p>

        {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
                {errorMessage}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
            <input
              required
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="e.g. Office Renovation Phase 1"
              value={formData.project_name}
              onChange={e => setFormData({...formData, project_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity *</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Required By</label>
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.delivery_date}
                  onChange={e => setFormData({...formData, delivery_date: e.target.value})}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
            <textarea
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Any specific requirements, delivery instructions, etc..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Sending Request...' : 'Send RFQ'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RFQPage() {
    return (
        <Suspense fallback={<div className="text-white text-center py-20">Loading...</div>}>
            <RFQForm />
        </Suspense>
    )
}
