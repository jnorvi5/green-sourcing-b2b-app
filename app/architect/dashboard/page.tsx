'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ArchitectDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [savedSuppliers, setSavedSuppliers] = useState<any[]>([])
  const [sentRFQs, setSentRFQs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadDashboard()
    
    // Check for success message
    if (searchParams.get('rfq') === 'created') {
      setShowSuccessMessage(true)
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [])

  async function loadDashboard() {
    try {
      // Check if using test token
      const token = localStorage.getItem('auth-token')
      const isTest = token?.startsWith('test_')
      setIsTestMode(isTest || false)

      if (isTest) {
        // Demo data for test mode
        const userType = localStorage.getItem('user-type')
        setUser({
          id: 'test-user',
          email: userType === 'supplier' ? 'demo@supplier.com' : 'demo@architect.com',
        })
        setProfile({
          id: 'test-user',
          full_name: userType === 'supplier' ? 'Demo Supplier' : 'Demo Architect',
          role: 'architect',
        })
        setSentRFQs([
          {
            id: '1',
            created_at: new Date().toISOString(),
            message: 'This is a demo RFQ in test mode',
            status: 'Pending',
            profiles: { company_name: 'Demo Supplier' },
          },
        ])
        setLoading(false)
        return
      }

      // Production: Use real Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'architect') {
        router.push('/')
        return
      }
      setProfile(profileData)

      // Load sent RFQs
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select(`
          *,
          profiles!rfqs_supplier_id_fkey(company_name)
        `)
        .eq('architect_id', user.id)
        .order('created_at', { ascending: false })

      setSentRFQs(rfqsData || [])

    } catch (error) {
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-type')
    if (!isTestMode) {
      await supabase.auth.signOut()
    }
    router.push('/login')
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
        {/* Test Mode Banner */}
        {isTestMode && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            ⚠️ Test Mode Active - Using demo data (not real Supabase)
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>RFQ created successfully! Suppliers will be notified and can respond with quotes.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Architect Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {profile?.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/architect/rfq/new" className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition">
              Create RFQ
            </Link>
            <Link href="/search" className="px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold transition">
              Search Suppliers
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-lg font-semibold mb-2">RFQs Sent</h3>
            <p className="text-3xl font-bold text-teal-400">{sentRFQs.length}</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-lg font-semibold mb-2">Saved Suppliers</h3>
            <p className="text-3xl font-bold text-blue-400">{savedSuppliers.length}</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-emerald-400">0</p>
          </div>
        </div>

        {/* Recent RFQs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your RFQs</h2>
          {sentRFQs.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400 mb-4">No RFQs sent yet</p>
              <Link href="/search" className="inline-block px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition">
                Search Suppliers
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRFQs.map((rfq) => (
                <div key={rfq.id} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        RFQ to {rfq.profiles?.company_name || 'Supplier'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Sent {new Date(rfq.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                      {rfq.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-gray-300">{rfq.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Suppliers */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Saved Suppliers</h2>
          {savedSuppliers.length === 0 ? (
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
              <p className="text-gray-400">No saved suppliers yet. Discover verified suppliers in the marketplace.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSuppliers.map((supplier) => (
                <div key={supplier.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-semibold mb-2">{supplier.company_name}</h3>
                  <p className="text-sm text-gray-400">{supplier.location}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
