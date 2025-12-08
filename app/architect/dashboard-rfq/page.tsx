'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// TypeScript interfaces matching Supabase schema
interface RFQ {
  id: string
  architect_id: string
  product_id: string | null
  project_name: string
  project_location: string
  material_specs: {
    quantity?: number
    unit?: string
    material_type?: string
  }
  budget_range: string | null
  delivery_deadline: string | null
  required_certifications: string[]
  message: string | null
  status: 'pending' | 'responded' | 'closed' | 'expired'
  matched_suppliers: string[]
  created_at: string
  updated_at: string
}

interface RFQWithQuotes extends RFQ {
  quote_count: number
  latest_quote?: Quote
  product?: {
    id: string
    product_name: string
  } | null
}

interface Quote {
  id: string
  rfq_id: string
  supplier_id: string
  quote_amount: number
  lead_time_days: number
  message: string | null
  status: 'submitted' | 'accepted' | 'rejected'
  responded_at: string
  supplier?: {
    id: string
    company_name: string
    user_id: string
  } | null
}

interface DashboardStats {
  totalRfqs: number
  pendingRfqs: number
  totalQuotes: number
  avgQuotesPerRfq: number
}

type StatusFilter = 'all' | 'pending' | 'responded' | 'closed'

export default function ArchitectDashboardRFQ() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null)
  const [rfqs, setRfqs] = useState<RFQWithQuotes[]>([])
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRfqs: 0,
    pendingRfqs: 0,
    totalQuotes: 0,
    avgQuotesPerRfq: 0,
  })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        setError('Failed to load profile')
        return
      }

      if (profileData?.role !== 'architect') {
        router.push('/')
        return
      }
      setProfile(profileData)

      // Load RFQs with quote counts
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfqs')
        .select(`
          *,
          products:product_id (
            id,
            product_name
          )
        `)
        .eq('architect_id', user.id)
        .order('created_at', { ascending: false })

      if (rfqsError) {
        console.error('RFQs error:', rfqsError)
        setError('Failed to load RFQs')
        return
      }

      // For each RFQ, get the quote count and latest quote
      const rfqsWithQuotes: RFQWithQuotes[] = await Promise.all(
        (rfqsData || []).map(async (rfq) => {
          const { data: quotesData, error: quotesError } = await supabase
            .from('rfq_responses')
            .select(`
              *,
              suppliers:supplier_id (
                id,
                company_name,
                user_id
              )
            `)
            .eq('rfq_id', rfq.id)
            .order('responded_at', { ascending: false })

          if (quotesError) {
            console.error('Quotes error for RFQ:', rfq.id, quotesError)
          }

          const quotes = quotesData || []
          return {
            ...rfq,
            quote_count: quotes.length,
            latest_quote: quotes[0] || undefined,
          }
        })
      )

      setRfqs(rfqsWithQuotes)

      // Get recent quotes across all RFQs
      const { data: allQuotesData, error: allQuotesError } = await supabase
        .from('rfq_responses')
        .select(`
          *,
          suppliers:supplier_id (
            id,
            company_name,
            user_id
          )
        `)
        .in('rfq_id', rfqsWithQuotes.map(r => r.id))
        .order('responded_at', { ascending: false })
        .limit(5)

      if (allQuotesError) {
        console.error('All quotes error:', allQuotesError)
      } else {
        setRecentQuotes(allQuotesData || [])
      }

      // Calculate stats
      const totalQuotes = rfqsWithQuotes.reduce((sum, rfq) => sum + rfq.quote_count, 0)
      const pendingCount = rfqsWithQuotes.filter(rfq => rfq.status === 'pending').length
      const avgQuotes = rfqsWithQuotes.length > 0 
        ? totalQuotes / rfqsWithQuotes.length 
        : 0

      setStats({
        totalRfqs: rfqsWithQuotes.length,
        pendingRfqs: pendingCount,
        totalQuotes,
        avgQuotesPerRfq: Math.round(avgQuotes * 10) / 10,
      })

    } catch (error) {
      console.error('Dashboard error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredRfqs = statusFilter === 'all' 
    ? rfqs 
    : statusFilter === 'responded'
    ? rfqs.filter(rfq => rfq.quote_count > 0)
    : rfqs.filter(rfq => rfq.status === statusFilter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">RFQ Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {profile?.full_name || 'Architect'}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/rfq/new"
              className="px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition"
            >
              + Create New RFQ
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Search Products
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="p-4 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-gray-400">Total RFQs</h3>
            <p className="text-2xl md:text-3xl font-bold text-teal-400">{stats.totalRfqs}</p>
          </div>
          <div className="p-4 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-gray-400">Pending RFQs</h3>
            <p className="text-2xl md:text-3xl font-bold text-yellow-400">{stats.pendingRfqs}</p>
          </div>
          <div className="p-4 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-gray-400">Total Quotes</h3>
            <p className="text-2xl md:text-3xl font-bold text-blue-400">{stats.totalQuotes}</p>
          </div>
          <div className="p-4 md:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-gray-400">Avg Quotes/RFQ</h3>
            <p className="text-2xl md:text-3xl font-bold text-emerald-400">{stats.avgQuotesPerRfq}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'responded', 'closed'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-teal-500 text-black'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* My RFQs Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl md:text-2xl font-bold mb-4">My RFQs</h2>
            
            {filteredRfqs.length === 0 ? (
              <div className="p-8 md:p-12 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400 mb-6">
                    No RFQs yet. Create your first RFQ to get quotes from verified suppliers.
                  </p>
                  <Link
                    href="/rfq/new"
                    className="inline-block px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
                  >
                    Create Your First RFQ
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-2 text-sm font-semibold text-gray-400">
                  <div className="col-span-2">Project Name</div>
                  <div>Material</div>
                  <div>Deadline</div>
                  <div>Status</div>
                  <div className="text-right">Actions</div>
                </div>
                
                {filteredRfqs.map((rfq) => {
                  const materialType = rfq.material_specs?.material_type || 'N/A'
                  const deadline = rfq.delivery_deadline 
                    ? new Date(rfq.delivery_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'No deadline'
                  
                  return (
                    <div
                      key={rfq.id}
                      className="p-4 md:p-6 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 transition"
                    >
                      <div className="grid md:grid-cols-6 gap-3 md:gap-4 items-start md:items-center">
                        <div className="md:col-span-2">
                          <h3 className="font-semibold text-white mb-1">{rfq.project_name}</h3>
                          <p className="text-xs text-gray-500">{rfq.project_location}</p>
                          <div className="md:hidden mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {rfq.quote_count} {rfq.quote_count === 1 ? 'quote' : 'quotes'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-300">
                          <span className="md:hidden text-gray-500">Material: </span>
                          {materialType}
                        </div>
                        
                        <div className="text-sm text-gray-300">
                          <span className="md:hidden text-gray-500">Deadline: </span>
                          {deadline}
                        </div>
                        
                        <div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              rfq.status === 'pending'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : rfq.status === 'responded'
                                ? 'bg-blue-500/10 text-blue-400'
                                : rfq.status === 'closed'
                                ? 'bg-gray-500/10 text-gray-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {rfq.status}
                          </span>
                          <div className="hidden md:block mt-1 text-xs text-gray-500">
                            {rfq.quote_count} {rfq.quote_count === 1 ? 'quote' : 'quotes'}
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Link
                            href={`/rfq/${rfq.id}/quotes`}
                            className="px-4 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-medium transition text-sm"
                          >
                            View Quotes
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Quotes Panel */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4">Recent Quotes</h2>
            
            {recentQuotes.length === 0 ? (
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                <p className="text-gray-400 text-sm">No quotes received yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{quote.supplier?.company_name || 'Supplier'}</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(quote.responded_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          quote.status === 'submitted'
                            ? 'bg-blue-500/10 text-blue-400'
                            : quote.status === 'accepted'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-lg font-bold text-teal-400">
                        ${quote.quote_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400">Lead time: {quote.lead_time_days} days</p>
                    </div>
                    
                    <Link
                      href={`/rfq/${quote.rfq_id}/quotes#quote-${quote.id}`}
                      className="text-xs text-teal-400 hover:text-teal-300 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
