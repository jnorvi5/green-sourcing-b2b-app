'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rfq, RfqStatus } from '@/types/rfq';
import { formatShortDate, getStatusColor } from '@/lib/utils/formatters';

interface RfqWithQuoteCount extends Rfq {
  quote_count: number;
}

type FilterStatus = 'all' | 'pending' | 'responded' | 'closed';

export default function MyRfqsPage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [rfqs, setRfqs] = useState<RfqWithQuoteCount[]>([]);
  const [filteredRfqs, setFilteredRfqs] = useState<RfqWithQuoteCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadRfqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqs, filterStatus]);

  async function loadRfqs() {
    try {
      // Check auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        router.push('/auth/login');
        return;
      }
      setUser(authUser);

      // Verify user is architect
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (userError || !userData || userData.role !== 'architect') {
        router.push('/supplier/dashboard');
        return;
      }

      // Fetch RFQs for this architect
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('architect_id', authUser.id)
        .order('created_at', { ascending: false });

      if (rfqsError) {
        console.error('Error fetching RFQs:', rfqsError);
        setError('Failed to load RFQs');
        setLoading(false);
        return;
      }

      // Fetch all quote counts in a single query using aggregation
      const rfqIds = (rfqsData || []).map((rfq: Rfq) => rfq.id);
      const quoteCounts: Record<string, number> = {};
      
      if (rfqIds.length > 0) {
        // Get all responses for these RFQs
        const { data: responsesData, error: responsesError } = await supabase
          .from('rfq_responses')
          .select('rfq_id')
          .in('rfq_id', rfqIds);

        if (!responsesError && responsesData) {
          // Count responses per RFQ
          responsesData.forEach((response) => {
            quoteCounts[response.rfq_id] = (quoteCounts[response.rfq_id] || 0) + 1;
          });
        }
      }

      // Combine RFQs with their quote counts
      const rfqsWithCounts: RfqWithQuoteCount[] = (rfqsData || []).map((rfq: Rfq) => ({
        ...rfq,
        quote_count: quoteCounts[rfq.id] || 0,
      }));

      setRfqs(rfqsWithCounts);
      setLoading(false);
    } catch (err) {
      console.error('Error loading RFQs:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  function applyFilter() {
    if (filterStatus === 'all') {
      setFilteredRfqs(rfqs);
    } else {
      setFilteredRfqs(rfqs.filter((rfq) => rfq.status === filterStatus));
    }
  }

  function getMaterialType(rfq: Rfq): string {
    if (rfq.material_specs && typeof rfq.material_specs === 'object') {
      const specs = rfq.material_specs as { material_type?: string };
      return specs.material_type || 'N/A';
    }
    return 'N/A';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mb-4"></div>
          <p className="text-gray-400">Loading your RFQs...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">My RFQs</h1>
              <p className="text-gray-400">
                Manage your requests for quotes and review supplier responses
              </p>
            </div>
            <Link
              href="/architect/rfq/new"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Create New RFQ
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['all', 'pending', 'responded', 'closed'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === status
                  ? 'bg-teal-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${rfqs.length})`}
              {status !== 'all' && ` (${rfqs.filter((r) => r.status === status).length})`}
            </button>
          ))}
        </div>

        {/* RFQs Table */}
        {filteredRfqs.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No RFQs Found</h3>
            <p className="text-gray-400 mb-6">
              {filterStatus === 'all'
                ? "You haven't created any RFQs yet."
                : `No ${filterStatus} RFQs at the moment.`}
            </p>
            {filterStatus === 'all' && (
              <Link
                href="/architect/rfq/new"
                className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Your First RFQ
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Project Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Material
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Quotes
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRfqs.map((rfq) => (
                    <tr
                      key={rfq.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{rfq.project_name}</div>
                        <div className="text-sm text-gray-400">{rfq.project_location}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{getMaterialType(rfq)}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatShortDate(rfq.delivery_deadline)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            rfq.status
                          )}`}
                        >
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 font-semibold">{rfq.quote_count}</span>
                        <span className="text-gray-500 text-sm ml-1">
                          {rfq.quote_count === 1 ? 'quote' : 'quotes'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/architect/rfqs/${rfq.id}/quotes`}
                          className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                        >
                          View Quotes →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
