'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  carbon_footprint: number
  certifications: string[]
  views: number
}

interface RFQ {
  id: string
  created_at: string
  architect_name: string
  project_name: string
  message: string
  status: string
}

export default function SupplierDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [rfqs, setRFQs] = useState<RFQ[]>([])
  const [stats, setStats] = useState({ totalViews: 0, totalRFQs: 0, totalProducts: 0 })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'supplier') {
        router.push('/')
        return
      }
      setProfile(profileData)

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setProducts(productsData || [])

      // Load RFQs
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select(`
          *,
          profiles!rfqs_architect_id_fkey(full_name)
        `)
        .eq('supplier_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setRFQs(rfqsData || [])

      // Calculate stats
      const totalViews = productsData?.reduce((sum, p) => sum + (p.views || 0), 0) || 0
      setStats({
        totalViews,
        totalRFQs: rfqsData?.length || 0,
        totalProducts: productsData?.length || 0
      })

    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {profile?.company_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/search" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              View Marketplace
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Products</h3>
            </div>
            <p className="text-3xl font-bold text-teal-400">{stats.totalProducts}</p>
            <p className="text-sm text-gray-400 mt-1">Active listings</p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Profile Views</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.totalViews}</p>
            <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">RFQs Received</h3>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{stats.totalRFQs}</p>
            <p className="text-sm text-gray-400 mt-1">Total inquiries</p>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Your Products</h2>
            <button className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition">
              + Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 mb-4">No products yet</p>
              <button className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition">
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/50 transition">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <span className="text-sm text-gray-400">{product.views || 0} views</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    Carbon: {product.carbon_footprint} kg CO2e/unit
                  </p>
                  {product.certifications && product.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.certifications.map((cert, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs">
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RFQs Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent RFQs</h2>

          {rfqs.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400">No RFQs yet. Once architects discover your products, inquiries will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rfqs.map((rfq) => (
                <div key={rfq.id} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{rfq.project_name || 'Project Inquiry'}</h3>
                      <p className="text-sm text-gray-400">
                        From: {rfq.architect_name} • {new Date(rfq.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                      {rfq.status || 'New'}
                    </span>
                  </div>
                  <p className="text-gray-300">{rfq.message}</p>
                  <button className="mt-4 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition">
                    Respond
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
