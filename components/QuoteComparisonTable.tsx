'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QuoteWithSupplier, RFQWithQuotes } from '@/types/rfq';

interface QuoteComparisonTableProps {
  quotes: QuoteWithSupplier[];
  onAccept: (quoteId: string) => void;
  acceptingQuoteId: string | null;
  rfq?: RFQWithQuotes; // Optional context
}

type SortField = 'price' | 'leadTime' | null;
type SortDirection = 'asc' | 'desc';

export default function QuoteComparisonTable({
  quotes,
  onAccept,
  acceptingQuoteId,
  rfq,
}: QuoteComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Determine best metrics for highlighting
  const lowestPrice = quotes.length > 0 ? Math.min(...quotes.map((q) => q.quote_amount)) : null;
  const shortestLeadTime = quotes.length > 0 ? Math.min(...quotes.map((q) => q.lead_time_days)) : null;

  // Sustainability scores
  const tierScores = { verified: 3, standard: 2, free: 1 };
  const bestSustainabilityScore = quotes.length > 0 ? Math.max(...quotes.map(q => tierScores[q.supplier.tier] || 0)) : null;

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getSortedQuotes(): QuoteWithSupplier[] {
    const sorted = [...quotes];
    if (sortField === 'price') {
      sorted.sort((a, b) => {
        const diff = a.quote_amount - b.quote_amount;
        return sortDirection === 'asc' ? diff : -diff;
      });
    } else if (sortField === 'leadTime') {
      sorted.sort((a, b) => {
        const diff = a.lead_time_days - b.lead_time_days;
        return sortDirection === 'asc' ? diff : -diff;
      });
    }
    return sorted;
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

  const sortedQuotes = getSortedQuotes();

  if (quotes.length === 0) {
    return (
      <div className="p-12 rounded-xl bg-white/5 border border-white/10 text-center">
        <div className="text-gray-500 text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold mb-2">No quotes yet</h3>
        <p className="text-gray-400">
          Suppliers haven&apos;t responded to this RFQ yet. Check back later!
        </p>
      </div>
    );
  }

  return (
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
                Certifications
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
              const isLowestPrice = quote.quote_amount === lowestPrice;
              const isShortestLeadTime = quote.lead_time_days === shortestLeadTime;
              const quoteScore = tierScores[quote.supplier.tier] || 0;
              // const isBestSustainability = quoteScore === bestSustainabilityScore; // Optional if we want to highlight this too

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
                          Best Price
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span>{quote.lead_time_days} days</span>
                        {isShortestLeadTime && (
                            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                                Shortest
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {/* Display certifications or tier as a proxy */}
                    <div className="flex flex-wrap gap-1">
                        <span className="capitalize text-sm bg-gray-700 px-2 py-0.5 rounded-full">{quote.supplier.tier} Tier</span>
                        {/* Assuming we might want to list actual certs if available, but for now tier is fine */}
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
                      {quote.attachment_url && (
                        <a
                          href={quote.attachment_url}
                          download
                          className="px-3 py-1 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 text-sm transition"
                        >
                          📄 PDF
                        </a>
                      )}
                      {quote.status === 'submitted' && (
                        <button
                          onClick={() => onAccept(quote.id)}
                          disabled={acceptingQuoteId === quote.id}
                          className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acceptingQuoteId === quote.id
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
          const isLowestPrice = quote.quote_amount === lowestPrice;
          const isShortestLeadTime = quote.lead_time_days === shortestLeadTime;

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
                        Best Price
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Lead Time:</span>
                  <div className="flex items-center gap-2">
                    <span>{quote.lead_time_days} days</span>
                    {isShortestLeadTime && (
                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                            Shortest
                        </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Sustainability:</span>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">
                      {quote.supplier.tier} Tier
                    </span>
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
                {quote.attachment_url && (
                  <a
                    href={quote.attachment_url}
                    download
                    className="px-4 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 text-center transition"
                  >
                    📄 Download PDF
                  </a>
                )}
                {quote.status === 'submitted' && (
                  <button
                    onClick={() => onAccept(quote.id)}
                    disabled={acceptingQuoteId === quote.id}
                    className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {acceptingQuoteId === quote.id
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
  );
}
