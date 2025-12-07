'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { RfqWithResponse, Rfq, UserProfile, RfqResponse } from '@/types/rfq'
import { formatMaterialType, formatDate } from '@/lib/utils/formatters'

export default function RfqDetailPage() {
  const [rfq, setRfq] = useState<RfqWithResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const rfqId = params?.rfq_id as string

  useEffect(() => {
    if (rfqId) {
      loadRfq()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId])

  async function loadRfq() {
    try {
      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }

      // Fetch RFQ details
      const { data: rfqData, error: rfqError } = await supabase
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
        .eq('id', rfqId)
        .single()

      if (rfqError || !rfqData) {
        setError('RFQ not found')
        setLoading(false)
        return
      }

      // Get supplier ID
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!supplierData) {
        setError('Supplier profile not found')
        setLoading(false)
        return
      }

      // Check if supplier is matched
      const typedRfq = rfqData as Rfq & { users: UserProfile | null }
      if (!typedRfq.matched_suppliers.includes(supplierData.id)) {
        setError('You do not have access to this RFQ')
        setLoading(false)
        return
      }

      // Fetch response if exists
      const { data: responseData } = await supabase
        .from('rfq_responses')
        .select('*')
        .eq('rfq_id', rfqId)
        .eq('supplier_id', supplierData.id)
        .single()

      // Calculate is_new
      const now = new Date()
      const createdAt = new Date(typedRfq.created_at)
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      const is_new = hoursSinceCreation < 24

      const enrichedRfq: RfqWithResponse = {
        ...typedRfq,
        rfq_response: (responseData as RfqResponse) || null,
        is_new
      }

      setRfq(enrichedRfq)
    } catch (error) {
      console.error('Error loading RFQ:', error)
      setError('Failed to load RFQ details')
    } finally {
      setLoading(false)
    }
  }



  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'responded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'closed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'expired':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading RFQ details...</p>
        </div>
      </div>
    )
  }

  if (error || !rfq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/supplier/rfqs"
            className="inline-block px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
          >
            ← Back to RFQs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/supplier/rfqs"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to RFQs
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{rfq.project_name}</h1>
              <p className="text-gray-400 text-lg">
                {rfq.users?.company_name || rfq.users?.full_name || 'Architect'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {rfq.is_new && (
                <span className="px-3 py-1 rounded-full bg-teal-500 text-black text-sm font-bold">
                  NEW
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(rfq.status)}`}>
                {rfq.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{rfq.project_location}</span>
          </div>
        </div>

        {/* Key Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Material Requirements
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Material Type</dt>
                <dd className="text-lg font-semibold">
                  {formatMaterialType(rfq.material_specs.material_type)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Quantity</dt>
                <dd className="text-lg font-semibold">
                  {rfq.material_specs.quantity.toLocaleString()} {rfq.material_specs.unit}
                </dd>
              </div>
              {rfq.budget_range && (
                <div>
                  <dt className="text-sm text-gray-500">Budget Range</dt>
                  <dd className="text-lg font-semibold">{rfq.budget_range}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Delivery Deadline</dt>
                <dd className="text-lg font-semibold">
                  {formatDate(rfq.delivery_deadline)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">RFQ Created</dt>
                <dd className="text-lg font-semibold">
                  {formatDate(rfq.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Certifications */}
        {rfq.required_certifications.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Required Certifications
            </h2>
            <div className="flex flex-wrap gap-2">
              {rfq.required_certifications.map((cert, idx) => (
                <span key={idx} className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        {rfq.message && (
          <div className="mb-8 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Additional Details
            </h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {rfq.message}
            </p>
          </div>
        )}

        {/* Quote Status */}
        {rfq.rfq_response ? (
          <div className="p-6 rounded-xl bg-blue-500/10 backdrop-blur-sm border border-blue-500/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your Quote
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <dt className="text-sm text-blue-300">Quoted Amount</dt>
                <dd className="text-2xl font-bold text-blue-400">
                  ${rfq.rfq_response.quote_amount.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-blue-300">Lead Time</dt>
                <dd className="text-2xl font-bold text-blue-400">
                  {rfq.rfq_response.lead_time_days} days
                </dd>
              </div>
              <div>
                <dt className="text-sm text-blue-300">Status</dt>
                <dd className="text-2xl font-bold text-blue-400 capitalize">
                  {rfq.rfq_response.status}
                </dd>
              </div>
            </div>
            {rfq.rfq_response.message && (
              <div className="pt-4 border-t border-blue-500/20">
                <dt className="text-sm text-blue-300 mb-2">Your Message</dt>
                <dd className="text-white whitespace-pre-wrap">
                  {rfq.rfq_response.message}
                </dd>
              </div>
            )}
            <p className="text-sm text-blue-300 mt-4">
              Submitted on {formatDate(rfq.rfq_response.responded_at)}
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-teal-500/10 backdrop-blur-sm border border-teal-500/20 text-center">
            <h2 className="text-xl font-bold mb-2">Ready to Quote?</h2>
            <p className="text-gray-400 mb-4">
              Submit your competitive quote to win this project
            </p>
            <button className="px-8 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition">
              Submit Quote
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
