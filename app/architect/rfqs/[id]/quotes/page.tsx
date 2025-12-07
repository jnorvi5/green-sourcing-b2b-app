'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRFQWithQuotes, acceptQuote } from '@/app/actions/quotes';
import { exportQuotesToCSV } from '@/lib/utils/formatters';
import { RFQWithQuotes, QuoteWithSupplier } from '@/types/rfq';

type SortField = 'price' | 'leadTime' | null;
type SortDirection = 'asc' | 'desc';

export default function QuoteComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const rfqId = params.id as string;

  const [rfqData, setRfqData] = useState<RFQWithQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
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

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getSortedQuotes(): QuoteWithSupplier[] {
    if (!rfqData?.quotes) return [];

    const quotes = [...rfqData.quotes];

    if (sortField === 'price') {
      quotes.sort((a, b) => {
        const comparison = a.quote_amount - b.quote_amount;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else if (sortField === 'leadTime') {
      quotes.sort((a, b) => {
        const comparison = a.lead_time_days - b.lead_time_days;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return quotes;
  }

  function toggleNotes(quoteId: string) {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedNotes(newExpanded);
  }

  async function handleAcceptQuote(quoteId: string) {
    if (!confirm('Are you sure you want to accept this quote?')) {
      return;
    }

    try {
      setAcceptingQuote(quoteId);
      const result = await acceptQuote({ quoteId, rfqId });

      if (!result.success) {
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

  function getLowestPrice(): number | null {
    if (!rfqData?.quotes || rfqData.quotes.length === 0) return null;
    return Math.min(...rfqData.quotes.map((q) => q.quote_amount));
  }

  function getBestSustainabilityScore(): number | null {
    if (!rfqData?.quotes || rfqData.quotes.length === 0) return null;
    // For now, we'll use tier as a proxy for sustainability
    // 'verified' > 'standard' > 'free'
    const tierScores = { verified: 3, standard: 2, free: 1 };
    return Math.max(
      ...rfqData.quotes.map((q) => tierScores[q.supplier.tier] || 0)
    );
  }

  function calculateSustainabilityScore(quote: QuoteWithSupplier): number {
    const tierScores = { verified: 3, standard: 2, free: 1 };
    return tierScores[quote.supplier.tier] || 0;
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

  const sortedQuotes = getSortedQuotes();
  const lowestPrice = getLowestPrice();
  const bestSustainabilityScore = getBestSustainabilityScore();
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
        {sortedQuotes.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition"
            >
              📥 Export to CSV
            </button>
          </div>
        )}

        {/* Quotes List */}
        {sortedQuotes.length === 0 ? (
          <div className="p-12 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-gray-500 text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No quotes yet</h3>
            <p className="text-gray-400">
              Suppliers haven&apos;t responded to this RFQ yet. Check back later!
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl bg-white/5 border border-white/10">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Supplier Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center gap-2 hover:text-teal-400 transition"
                      >
                        Price
                        {sortField === 'price' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      <button
                        onClick={() => handleSort('leadTime')}
                        className="flex items-center gap-2 hover:text-teal-400 transition"
                      >
                        Lead Time
                        {sortField === 'leadTime' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Sustainability
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Notes
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuotes.map((quote) => {
                    const sustainabilityScore = calculateSustainabilityScore(quote);
                    const isLowestPrice = quote.quote_amount === lowestPrice;
                    const isBestSustainability =
                      sustainabilityScore === bestSustainabilityScore;

                    return (
                      <tr
                        key={quote.id}
                        className="border-t border-white/10 hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/supplier/${quote.supplier_id}`}
                            className="text-teal-400 hover:text-teal-300 font-medium"
                          >
                            {quote.supplier.company_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              ${quote.quote_amount.toLocaleString()}
                            </span>
                            {isLowestPrice && (
                              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                                Lowest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {quote.lead_time_days} days
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="capitalize">
                              {quote.supplier.tier}
                            </span>
                            {isBestSustainability && (
                              <span className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium">
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {quote.message ? (
                            <div>
                              <p
                                className={`text-sm ${
                                  expandedNotes.has(quote.id)
                                    ? ''
                                    : 'line-clamp-2'
                                }`}
                              >
                                {quote.message}
                              </p>
                              <button
                                onClick={() => toggleNotes(quote.id)}
                                className="text-xs text-teal-400 hover:text-teal-300 mt-1"
                              >
                                {expandedNotes.has(quote.id)
                                  ? 'Show less'
                                  : 'Show more'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">
                              No notes
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {quote.pdf_url && (
                              <a
                                href={quote.pdf_url}
                                download
                                className="px-3 py-1 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 text-sm transition"
                              >
                                📄 PDF
                              </a>
                            )}
                            {quote.status === 'submitted' && (
                              <button
                                onClick={() => handleAcceptQuote(quote.id)}
                                disabled={acceptingQuote === quote.id}
                                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {acceptingQuote === quote.id
                                  ? 'Accepting...'
                                  : 'Accept Quote'}
                              </button>
                            )}
                            {quote.status === 'accepted' && (
                              <span className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium">
                                ✓ Accepted
                              </span>
                            )}
                            {quote.status === 'rejected' && (
                              <span className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium">
                                Rejected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {sortedQuotes.map((quote) => {
                const sustainabilityScore = calculateSustainabilityScore(quote);
                const isLowestPrice = quote.quote_amount === lowestPrice;
                const isBestSustainability =
                  sustainabilityScore === bestSustainabilityScore;

                return (
                  <div
                    key={quote.id}
                    className="p-6 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="mb-4">
                      <Link
                        href={`/supplier/${quote.supplier_id}`}
                        className="text-xl font-bold text-teal-400 hover:text-teal-300"
                      >
                        {quote.supplier.company_name}
                      </Link>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Price:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            ${quote.quote_amount.toLocaleString()}
                          </span>
                          {isLowestPrice && (
                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                              Lowest
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Lead Time:</span>
                        <span>{quote.lead_time_days} days</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Sustainability:</span>
                        <div className="flex items-center gap-2">
                          <span className="capitalize">
                            {quote.supplier.tier}
                          </span>
                          {isBestSustainability && (
                            <span className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium">
                              Best
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {quote.message && (
                      <div className="mb-4 p-3 rounded-lg bg-white/5">
                        <p className="text-sm text-gray-400 mb-1">Notes:</p>
                        <p
                          className={`text-sm ${
                            expandedNotes.has(quote.id) ? '' : 'line-clamp-3'
                          }`}
                        >
                          {quote.message}
                        </p>
                        <button
                          onClick={() => toggleNotes(quote.id)}
                          className="text-xs text-teal-400 hover:text-teal-300 mt-1"
                        >
                          {expandedNotes.has(quote.id)
                            ? 'Show less'
                            : 'Show more'}
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {quote.pdf_url && (
                        <a
                          href={quote.pdf_url}
                          download
                          className="px-4 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 text-center transition"
                        >
                          📄 Download PDF
                        </a>
                      )}
                      {quote.status === 'submitted' && (
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          disabled={acceptingQuote === quote.id}
                          className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acceptingQuote === quote.id
                            ? 'Accepting...'
                            : 'Accept Quote'}
                        </button>
                      )}
                      {quote.status === 'accepted' && (
                        <div className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-center font-medium">
                          ✓ Accepted
                        </div>
                      )}
                      {quote.status === 'rejected' && (
                        <div className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-center font-medium">
                          Rejected
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
