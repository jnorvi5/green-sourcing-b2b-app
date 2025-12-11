'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DashboardStats, IncomingRfq, SupplierQuote, SupplierProfile, Product } from '@/types/supplier-dashboard'
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary'
import { DashboardLoadingSkeleton } from '@/components/DashboardLoadingSkeleton'

// Safe error logging helper - only logs in development
function logError(message: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error)
  }
}

function DashboardContent() {
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalRfqMatches: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    profileCompleteness: 0,
  })
  const [incomingRfqs, setIncomingRfqs] = useState<IncomingRfq[]>([])
  const [myQuotes, setMyQuotes] = useState<SupplierQuote[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true)
      }
      setError(null)

      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // Load supplier profile
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (supplierError) {
        setError('Failed to load supplier profile. Please ensure your account is set up correctly.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      setProfile(supplierData)

      // Load products for profile completeness calculation
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, supplier_id, product_name, material_type, description')
        .eq('supplier_id', supplierData.id)

      if (productsError) {
        logError('Error loading products:', productsError)
      }

      setProducts(productsData || [])

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(supplierData, productsData || [])

      // Load incoming RFQs (where supplier is matched but hasn't quoted yet)
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfqs')
        .select(`
          id,
          project_name,
          material_specs,
          delivery_deadline,
          created_at,
          architect_id,
          users!rfqs_architect_id_fkey(full_name, company_name)
        `)
        .contains('matched_suppliers', [supplierData.id])
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (rfqsError) {
        logError('Error loading RFQs:', rfqsError)
      }

      // Filter out RFQs that already have responses from this supplier
      const { data: existingResponses, error: responsesError } = await supabase
        .from('rfq_responses')
        .select('rfq_id')
        .eq('supplier_id', supplierData.id)

      if (responsesError) {
        logError('Error loading responses:', responsesError)
      }

      const respondedRfqIds = new Set(existingResponses?.map(r => r.rfq_id) || [])
      const unquotedRfqs = (rfqsData || []).filter(rfq => !respondedRfqIds.has(rfq.id))

      // Transform RFQs data
      const transformedRfqs: IncomingRfq[] = unquotedRfqs.map(rfq => {
        const users = Array.isArray(rfq.users) ? rfq.users[0] : rfq.users;
        return {
          id: rfq.id,
          project_name: rfq.project_name,
          material_type: (rfq.material_specs as { material_type?: string })?.material_type || 'N/A',
          delivery_deadline: rfq.delivery_deadline,
          match_score: 85, // Placeholder - would need actual matching algorithm
          created_at: rfq.created_at,
          architect: {
            full_name: (users as { full_name: string | null } | null)?.full_name || null,
            company_name: (users as { company_name: string | null } | null)?.company_name || null,
          },
        };
      })

      setIncomingRfqs(transformedRfqs)

      // Load my quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('rfq_responses')
        .select(`
          id,
          rfq_id,
          quote_amount,
          status,
          responded_at,
          rfqs!rfq_responses_rfq_id_fkey(project_name)
        `)
        .eq('supplier_id', supplierData.id)
        .order('responded_at', { ascending: false })

      if (quotesError) {
        logError('Error loading quotes:', quotesError)
      }

      const transformedQuotes: SupplierQuote[] = (quotesData || []).map(quote => {
        const rfqs = Array.isArray(quote.rfqs) ? quote.rfqs[0] : quote.rfqs;
        return {
          id: quote.id,
          rfq_id: quote.rfq_id,
          quote_amount: quote.quote_amount,
          status: quote.status as 'submitted' | 'accepted' | 'rejected',
          responded_at: quote.responded_at,
          rfq: {
            project_name: (rfqs as { project_name: string } | null)?.project_name || 'Unknown Project',
          },
        };
      })

      setMyQuotes(transformedQuotes)

      // Calculate stats
      const pendingQuotes = transformedQuotes.filter(q => q.status === 'submitted').length
      const acceptedQuotes = transformedQuotes.filter(q => q.status === 'accepted').length

      setStats({
        totalRfqMatches: transformedRfqs.length + transformedQuotes.length,
        pendingQuotes,
        acceptedQuotes,
        profileCompleteness: completeness,
      })

    } catch (err) {
      logError('Dashboard error:', err)
      setError('An unexpected error occurred while loading the dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleRefresh() {
    await loadDashboard(true)
  }

  function calculateProfileCompleteness(
    supplier: SupplierProfile,
    products: Product[]
  ): number {
    let score = 0
    const maxScore = 100

    // Company name (20 points)
    if (supplier.company_name) score += 20

    // Description (20 points)
    if (supplier.description && supplier.description.length > 50) score += 20

    // Certifications (30 points)
    if (supplier.certifications && Array.isArray(supplier.certifications) && supplier.certifications.length > 0) {
      score += 30
    }

    // Products (30 points)
    if (products.length > 0) score += 30

    return Math.round(score)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function isNewRfq(createdAt: string): boolean {
    const now = new Date()
    const rfqDate = new Date(createdAt)
    const hoursDiff = (now.getTime() - rfqDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'No deadline'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'accepted':
        return 'bg-green-500/10 text-green-400'
      case 'rejected':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'submitted':
        return 'Pending'
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  if (loading) {
    return <DashboardLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="p-6 sm:p-8 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3 text-center">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-300 mb-6 text-center text-sm sm:text-base">{error}</p>
            <button
              onClick={() => loadDashboard()}
              disabled={refreshing}
              className="w-full px-4 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/50 disabled:cursor-not-allowed text-black font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center gap-2"
            >
              {refreshing ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                'Try Again'
              )}
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">
            If the problem persists, please contact support
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Supplier Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {profile?.company_name || 'Supplier'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition text-sm sm:text-base flex items-center gap-2"
              title="Refresh dashboard data"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link 
              href="/search" 
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm sm:text-base"
            >
              Marketplace
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* Total RFQ Matches */}
          <div className="p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/50 transition">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold">RFQ Matches</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-teal-400">{stats.totalRfqMatches}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Total opportunities</p>
          </div>

          {/* Pending Quotes */}
          <div className="p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-yellow-500/50 transition">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold">Pending</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-400">{stats.pendingQuotes}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Awaiting response</p>
          </div>

          {/* Accepted Quotes */}
          <div className="p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-green-500/50 transition">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold">Accepted</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-green-400">{stats.acceptedQuotes}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Successful quotes</p>
          </div>

          {/* Profile Completeness */}
          <div className="p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 transition">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold">Profile</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">{stats.profileCompleteness}%</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Completeness</p>
          </div>
        </div>

        {/* Main Content Grid - 2 Column Layout on Desktop */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - RFQs and Quotes (2/3 width) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Incoming RFQs Section */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Incoming RFQs</h2>
              
              {incomingRfqs.length === 0 ? (
                <div className="p-6 sm:p-8 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-4">No new RFQs at the moment</p>
                  <p className="text-sm text-gray-500">Check back soon or improve your profile to get matched with more projects!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">Project</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 hidden sm:table-cell">Material</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 hidden md:table-cell">Deadline</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 hidden lg:table-cell">Match</th>
                        <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomingRfqs.map((rfq) => (
                        <tr key={rfq.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="flex items-start gap-2">
                              {isNewRfq(rfq.created_at) && (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-teal-500 text-black text-xs font-bold flex-shrink-0">
                                  NEW
                                </span>
                              )}
                              <div>
                                <p className="font-medium text-sm sm:text-base">{rfq.project_name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {rfq.architect.full_name || rfq.architect.company_name || 'Architect'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-sm text-gray-300 hidden sm:table-cell">
                            {rfq.material_type}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-sm text-gray-300 hidden md:table-cell">
                            {formatDate(rfq.delivery_deadline)}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 hidden lg:table-cell">
                            <span className="inline-block px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium">
                              {rfq.match_score}%
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-right">
                            <Link
                              href={`/rfq/${rfq.id}`}
                              className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition text-xs sm:text-sm"
                            >
                              Submit Quote
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* My Quotes Section */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">My Quotes</h2>
              
              {myQuotes.length === 0 ? (
                <div className="p-6 sm:p-8 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-4">No quotes submitted yet</p>
                  <p className="text-sm text-gray-500">Start responding to incoming RFQs to build your quote history!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">Project</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 hidden sm:table-cell">Price</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400">Status</th>
                        <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-400 hidden md:table-cell">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myQuotes.map((quote) => (
                        <tr key={quote.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <p className="font-medium text-sm sm:text-base">{quote.rfq.project_name}</p>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-sm text-gray-300 hidden sm:table-cell">
                            ${quote.quote_amount.toLocaleString()}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                              {getStatusLabel(quote.status)}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-sm text-gray-400 hidden md:table-cell">
                            {formatDate(quote.responded_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions (1/3 width) */}
          <div className="lg:col-span-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3 sm:space-y-4">
              <Link
                href="/supplier/products/new"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 hover:bg-white/10 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Add Product</p>
                  <p className="text-xs text-gray-400">List a new sustainable material</p>
                </div>
              </Link>

              <Link
                href="/supplier/certifications/upload"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Upload Certification</p>
                  <p className="text-xs text-gray-400">Add sustainability credentials</p>
                </div>
              </Link>

              <Link
                href="/supplier/profile"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base">Edit Profile</p>
                  <p className="text-xs text-gray-400">Update company information</p>
                </div>
              </Link>
            </div>

            {/* Profile Completeness Widget */}
            {stats.profileCompleteness < 100 && (
              <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <h3 className="font-semibold text-yellow-400 mb-2 text-sm sm:text-base">Complete Your Profile</h3>
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.profileCompleteness}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {stats.profileCompleteness}% complete. A complete profile gets 3x more RFQ matches!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SupplierDashboard() {
  return (
    <DashboardErrorBoundary onReset={() => window.location.reload()}>
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <DashboardContent />
      </Suspense>
    </DashboardErrorBoundary>
  )
}
