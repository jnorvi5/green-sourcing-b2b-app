'use client';

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { RfqWithResponse, RfqFilter, RfqSort, Rfq, UserProfile, RfqResponse } from '@/types/rfq'
import { formatMaterialType, formatShortDate, getStatusColor, getDeadlineUrgency, getDeadlineUrgencyColor, getDeadlineUrgencyIcon } from '@/lib/utils/formatters'

export default function SupplierRfqsPage() {
  const [, setUser] = useState<{ id: string } | null>(null)
  const [, setSupplierId] = useState<string | null>(null)
  const [rfqs, setRfqs] = useState<RfqWithResponse[]>([])
  const [filteredRfqs, setFilteredRfqs] = useState<RfqWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<RfqFilter>('all')
  const [activeSort, setActiveSort] = useState<RfqSort>('newest')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadRfqs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqs, activeFilter, activeSort])

  async function loadRfqs() {
    try {
      // Check auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)

      // Get supplier ID for this user
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', authUser.id)
        .single()

      if (supplierError || !supplierData) {
        console.error('Error getting supplier:', supplierError)
        router.push('/supplier/dashboard')
        return
      }
      
      setSupplierId(supplierData.id)

      // Fetch RFQs where this supplier is in matched_suppliers array
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfqs')
        .select(`
          *,
          users!rfqs_architect_id_fkey(
            id,
            email,
            role,
            full_name,
            company_name,
            created_at,
            updated_at
          )
        `)
        .contains('matched_suppliers', [supplierData.id])
        .order('created_at', { ascending: false })

      if (rfqsError) {
        console.error('Error fetching RFQs:', rfqsError)
        setLoading(false)
        return
      }

      // Fetch responses for these RFQs
      const rfqIds = (rfqsData || []).map((rfq: Rfq) => rfq.id)
      const responsesMap = new Map<string, RfqResponse>()
      
      if (rfqIds.length > 0) {
        const { data: responsesData } = await supabase
          .from('rfq_responses')
          .select('*')
          .eq('supplier_id', supplierData.id)
          .in('rfq_id', rfqIds)

        if (responsesData) {
          responsesData.forEach((response: RfqResponse) => {
            responsesMap.set(response.rfq_id, response)
          })
        }
      }

      // Enrich RFQs with response data and calculate is_new
      const now = new Date()
      const enrichedRfqs: RfqWithResponse[] = (rfqsData || []).map((rfq: Rfq & { users: UserProfile | null }) => {
        const createdAt = new Date(rfq.created_at)
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        const is_new = hoursSinceCreation < 24
        
        return {
          ...rfq,
          rfq_response: responsesMap.get(rfq.id) || null,
          is_new,
          match_score: calculateMatchScore(rfq, supplierData.id)
        }
      })

      setRfqs(enrichedRfqs)
    } catch (error) {
      console.error('Error loading RFQs:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateMatchScore(rfq: Rfq, supplierId: string): number {
    // Simple match score: position in matched_suppliers array
    // Lower index = better match (assumes matching algorithm orders by relevance)
    const index = rfq.matched_suppliers.indexOf(supplierId)
    if (index === -1) return 0
    
    // Convert to score out of 100, where first match = 100
    const totalMatches = rfq.matched_suppliers.length
    return Math.round(100 - (index / Math.max(totalMatches, 1)) * 100)
  }

  function applyFiltersAndSort() {
    let filtered = [...rfqs]

    // Apply filter
    switch (activeFilter) {
      case 'new':
        filtered = filtered.filter(rfq => !rfq.rfq_response && rfq.status !== 'closed')
        break
      case 'quoted':
        filtered = filtered.filter(rfq => rfq.rfq_response !== null)
        break
      case 'closed':
        filtered = filtered.filter(rfq => rfq.status === 'closed' || rfq.status === 'expired')
        break
      case 'all':
      default:
        // No filter
        break
    }

    // Apply sort
    switch (activeSort) {
      case 'deadline':
        filtered.sort((a, b) => {
          if (!a.delivery_deadline) return 1
          if (!b.delivery_deadline) return -1
          return new Date(a.delivery_deadline).getTime() - new Date(b.delivery_deadline).getTime()
        })
        break
      case 'match_score':
        filtered.sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredRfqs(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading RFQs...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Matched RFQs</h1>
              <p className="text-gray-400">
                Architects looking for materials you supply
              </p>
            </div>
            <Link
              href="/supplier/dashboard"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm md:text-base"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-white/10">
          <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
            {(['all', 'new', 'quoted', 'closed'] as RfqFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                  px-4 py-2 rounded-t-lg font-medium transition whitespace-nowrap text-sm md:text-base
                  ${activeFilter === filter
                    ? 'bg-teal-500 text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {filter === 'all' && 'All'}
                {filter === 'new' && 'New (Not Quoted)'}
                {filter === 'quoted' && 'Quoted'}
                {filter === 'closed' && 'Closed'}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            {filteredRfqs.length} {filteredRfqs.length === 1 ? 'RFQ' : 'RFQs'}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-400">
              Sort by:
            </label>
            <select
              id="sort"
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as RfqSort)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="deadline">Deadline (Soonest)</option>
              <option value="match_score">Match Score (Highest)</option>
            </select>
          </div>
        </div>

        {/* RFQ List */}
        {filteredRfqs.length === 0 ? (
          <div className="p-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">
              No RFQs yet. We&apos;ll notify you when architects need your products.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredRfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/50 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white mb-1 truncate">
                          {rfq.project_name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {rfq.users?.company_name || rfq.users?.full_name || 'Architect'} • {rfq.project_location}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {rfq.is_new && (
                          <span className="px-2 py-1 rounded-full bg-teal-500 text-black text-xs font-bold">
                            NEW
                          </span>
                        )}
                        {/* Deadline Urgency Indicator */}
                        {rfq.delivery_deadline && (() => {
                          const urgency = getDeadlineUrgency(rfq.delivery_deadline);
                          const urgencyLabel = urgency === 'urgent' ? 'URGENT' : urgency === 'soon' ? 'SOON' : 'NORMAL';
                          return (
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDeadlineUrgencyColor(rfq.delivery_deadline)}`}>
                              {getDeadlineUrgencyIcon(rfq.delivery_deadline)} {urgencyLabel}
                            </span>
                          );
                        })()}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(rfq.status)}`}>
                          {rfq.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Material Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Material</p>
                        <p className="text-white font-medium">
                          {formatMaterialType(rfq.material_specs.material_type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Quantity</p>
                        <p className="text-white font-medium">
                          {rfq.material_specs.quantity.toLocaleString()} {rfq.material_specs.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Deadline</p>
                        <p className="text-white font-medium">
                          {formatShortDate(rfq.delivery_deadline)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Match Score</p>
                        <p className="text-teal-400 font-bold">
                          {rfq.match_score || 0}%
                        </p>
                      </div>
                    </div>

                    {/* Budget & Certifications */}
                    {(rfq.budget_range || rfq.required_certifications.length > 0) && (
                      <div className="flex flex-wrap gap-4 mb-4 text-sm">
                        {rfq.budget_range && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Budget: {rfq.budget_range}</span>
                          </div>
                        )}
                        {rfq.required_certifications.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {rfq.required_certifications.map((cert, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quote Status */}
                    {rfq.rfq_response && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                        <p className="text-blue-400 font-medium mb-1">
                          ✓ You quoted ${rfq.rfq_response.quote_amount.toLocaleString()}
                        </p>
                        <p className="text-gray-400">
                          Lead time: {rfq.rfq_response.lead_time_days} days • 
                          Submitted {formatShortDate(rfq.rfq_response.responded_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/rfq/${rfq.id}`}
                      className="block px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition text-center whitespace-nowrap"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
