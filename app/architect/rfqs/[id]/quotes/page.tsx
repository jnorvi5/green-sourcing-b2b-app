'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getRFQWithQuotes } from '@/app/actions/quotes';
import { exportQuotesToCSV } from '@/lib/utils/formatters';
import { RFQWithQuotes } from '@/types/rfq';
import QuoteComparisonTable from '@/components/QuoteComparisonTable';

export default function QuoteComparisonPage() {
  const params = useParams();
  const rfqId = params?.['id'] as string;

  const [rfqData, setRfqData] = useState<RFQWithQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);

  useEffect(() => {
    loadRFQData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId]);

  async function loadRFQData() {
    try {
      setLoading(true);
      const result = await getRFQWithQuotes(rfqId);
      
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to load RFQ data');
        return;
      }

      setRfqData(result.data);
    } catch (err) {
      console.error('Error loading RFQ:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptQuote(quoteId: string) {
    if (!confirm('Are you sure you want to accept this quote?')) {
      return;
    }

    try {
      setAcceptingQuote(quoteId);

      const response = await fetch(`/api/rfqs/${rfqId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quoteId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || 'Failed to accept quote');
        return;
      }

      alert('Quote accepted successfully! The supplier has been notified.');
      loadRFQData();
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert('An unexpected error occurred');
    } finally {
      setAcceptingQuote(null);
    }
  }

  function handleExportCSV() {
    if (!rfqData?.quotes) return;

    const csv = exportQuotesToCSV(rfqData.quotes);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfq-${rfqId}-quotes.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (error || !rfqData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Error Loading RFQ</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/architect/dashboard"
            className="inline-block px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const materialCategory = rfqData.material_specs?.material_type || 'Unknown';
  const quantity = rfqData.material_specs?.quantity || 'N/A';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/architect/dashboard"
            className="text-teal-400 hover:text-teal-300 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Compare Quotes</h1>
        </div>

        {/* RFQ Summary */}
        <div className="mb-8 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h2 className="text-xl font-bold mb-4">RFQ Summary</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Project Name</p>
              <p className="font-semibold">{rfqData.project_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Material Category</p>
              <p className="font-semibold">{materialCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Quantity</p>
              <p className="font-semibold">
                {quantity} {rfqData.material_specs?.unit || ''}
              </p>
            </div>
          </div>
          {rfqData.message && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">Details</p>
              <p className="text-gray-300">{rfqData.message}</p>
            </div>
          )}
        </div>

        {/* Export Button */}
        {rfqData.quotes && rfqData.quotes.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition"
            >
              📥 Export to CSV
            </button>
          </div>
        )}

        {/* Quotes List using reusable component */}
        <QuoteComparisonTable
          quotes={rfqData.quotes || []}
          onAccept={handleAcceptQuote}
          acceptingQuoteId={acceptingQuote}
          rfq={rfqData}
        />
      </div>
    </main>
  );
}
