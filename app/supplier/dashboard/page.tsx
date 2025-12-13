'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DashboardStats, IncomingRfq, SupplierQuote, SupplierProfile } from '@/types/supplier-dashboard'
import type { Product } from '@/types/product'
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary'
import { DashboardLoadingSkeleton } from '@/components/DashboardLoadingSkeleton'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FiRefreshCw, FiLogOut, FiPlus, FiUpload, FiEdit, FiSearch, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi"
import { FaLeaf } from "react-icons/fa"
import { ProductList } from './ProductList'

// ... (skipping to next chunk in file content for clarity in tool usage, but tool requires contiguous block or use multi_replace)
// I will use multi_replace for this file as there are multiple separated conflicts.

// Safe error logging helper - only logs in development
function logError(message: string, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error)
  }
}

function DashboardContent() {
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
      // setUserId(user.id) // Unused

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

      // Load products for profile completeness calculation and display
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, supplier_id, name, description, material_type, application, certifications, sustainability_data, specs, images, epd_url, verified')
        .eq('supplier_id', supplierData.id)

      if (productsError) {
        logError('Error loading products:', productsError)
      }

      // Map to Product type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
        ...p,
        name: p.name || p.product_name, // Fallback if name is empty but product_name exists
        // Add placeholders for analytics if not in DB
        views_count: Math.floor(Math.random() * 50) + 10,
        clicks_count: Math.floor(Math.random() * 20) + 5,
        rfq_count: Math.floor(Math.random() * 5),
      })) as Product[]

      setProducts(mappedProducts)

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(supplierData, mappedProducts)

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unquotedRfqs = (rfqsData || []).filter((rfq: any) => !respondedRfqIds.has(rfq.id))

      // Transform RFQs data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedRfqs: IncomingRfq[] = unquotedRfqs.map((rfq: any) => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedQuotes: SupplierQuote[] = (quotesData || []).map((quote: any) => {
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
    // const maxScore = 100 // Unused

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
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-200'
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-200'
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-200'
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200'
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => loadDashboard()} disabled={refreshing} className="w-full bg-red-600 hover:bg-red-700 text-white">
              {refreshing ? 'Retrying...' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Supplier Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {profile?.company_name || 'Supplier'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/search">
              <Button variant="outline" size="sm" className="gap-2">
                <FiSearch className="w-4 h-4" />
                <span className="hidden sm:inline">Marketplace</span>
              </Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
              <FiLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <FaLeaf className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">RFQ Matches</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">{stats.totalRfqMatches}</p>
              <p className="text-xs text-muted-foreground mt-1">Total opportunities</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <FiClock className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Pending</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.pendingQuotes}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Accepted</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.acceptedQuotes}</p>
              <p className="text-xs text-muted-foreground mt-1">Successful quotes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FiEdit className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Profile</h3>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.profileCompleteness}%</p>
              <p className="text-xs text-muted-foreground mt-1">Completeness</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - 2 Column Layout on Desktop */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - RFQs and Quotes (2/3 width) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            {/* Products Section (New) */}
            <div className="mb-8">
                <ProductList products={products} loading={loading} />
            </div>

            {/* Incoming RFQs Section */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Incoming RFQs</h2>
              
              {incomingRfqs.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FiSearch className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-2">No new RFQs</p>
                    <p className="text-sm text-muted-foreground">Check back soon or improve your profile.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Project</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Material</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Deadline</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Match</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {incomingRfqs.map((rfq) => (
                          <tr key={rfq.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-start gap-2">
                                {isNewRfq(rfq.created_at) && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">NEW</span>
                                )}
                                <div>
                                  <p className="font-medium text-foreground text-sm">{rfq.project_name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {rfq.architect.full_name || rfq.architect.company_name || 'Architect'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground hidden sm:table-cell">{rfq.material_type}</td>
                            <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell">{formatDate(rfq.delivery_deadline)}</td>
                            <td className="py-4 px-4 hidden lg:table-cell">
                              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium dark:bg-emerald-950 dark:text-emerald-400">
                                {rfq.match_score}%
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Link href={`/rfq/${rfq.id}`}>
                                <Button size="sm">Quote</Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>

            {/* My Quotes */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">My Quotes</h2>
              
              {myQuotes.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <FiClock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-2">No quotes submitted</p>
                    <p className="text-sm text-muted-foreground">Start responding to RFQs!</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Project</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Price</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {myQuotes.map((quote) => (
                          <tr key={quote.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4">
                              <p className="font-medium text-foreground text-sm">{quote.rfq.project_name}</p>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                              ${quote.quote_amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                                {getStatusLabel(quote.status)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground hidden md:table-cell">
                              {formatDate(quote.responded_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
            
            <Link href="/supplier/products/new">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <FiPlus className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Add Product</h3>
                    <p className="text-xs text-muted-foreground">List a new material</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/supplier/certifications/upload">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FiUpload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Upload Certifications</h3>
                    <p className="text-xs text-muted-foreground">Add sustainability credentials</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/supplier/profile">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FiEdit className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Edit Profile</h3>
                    <p className="text-xs text-muted-foreground">Update company info</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Profile Completeness Widget */}
            {stats.profileCompleteness < 100 && (
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-500 mb-2">Complete Your Profile</h3>
                  <div className="w-full bg-yellow-200 dark:bg-yellow-900/30 rounded-full h-2 mb-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.profileCompleteness}%` }}
                    />
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-600">
                    {stats.profileCompleteness}% complete. A complete profile gets 3x more RFQ matches!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
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
