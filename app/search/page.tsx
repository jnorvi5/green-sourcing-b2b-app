'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaSearch, FaMapMarkerAlt, FaLeaf, FaRobot } from 'react-icons/fa'

interface ProductSnippet {
  _id: string
  title: string
  price: number
  currency: string
  material_type?: string // Added for Agent
  greenData?: {
    carbonFootprint?: number
    certifications?: string[]
  }
}

interface Supplier {
  id: string
  company_name: string
  description: string
  location: string
  certifications: string[]
  epd_verified: boolean
  fsc_verified: boolean
  bcorp_verified: boolean
  leed_verified: boolean
  verification_source: string | null
  matched_products?: ProductSnippet[]
  agent_insight?: string
}

export default function SearchPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    location: '',
    search: ''
  })
  const [agentActive, setAgentActive] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliers()
    }, 500) // Debounce search
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  async function loadSuppliers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('q', filters.search)
      if (filters.location) params.append('location', filters.location)

      const res = await fetch(`/api/search?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setSuppliers(data.data)
        setAgentActive(data.meta?.intent?.isSmartSearch || false)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-teal-400 hover:underline flex items-center gap-2">
            <span>←</span> Back to Home
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
            Login
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-500">
            Enterprise Supplier Search
          </h1>
          <p className="text-gray-400">
            Find verified suppliers using natural language. Try &quot;FSC plywood under 50kg carbon&quot;
          </p>
        </div>

        {/* Search Bar & Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 backdrop-blur-sm">
          <div className="grid md:grid-cols-[1fr_auto_auto] gap-4">
            {/* Main Search */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers, products, certifications..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-teal-500 outline-none text-lg transition-colors"
              />
              {agentActive && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-teal-400 text-xs font-medium animate-pulse">
                  <FaRobot />
                  <span>AI Active</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="relative min-w-[200px]">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Location..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:border-teal-500 outline-none transition-colors"
              />
            </div>

            {/* Clear */}
            <button
              onClick={() => setFilters({ location: '', search: '' })}
              className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-400">Searching enterprise database...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <FaSearch className="mx-auto w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No suppliers found matching your criteria</p>
            <button
              onClick={() => setFilters({ location: '', search: '' })}
              className="mt-4 px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/50 transition-all group overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/supplier/${supplier.id}`} className="text-2xl font-bold group-hover:text-teal-400 transition">
                          {supplier.company_name}
                        </Link>
                        {supplier.epd_verified && (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            EPD Verified
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mb-3 max-w-2xl">
                        {supplier.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt /> {supplier.location || 'Global'}
                        </span>
                        {supplier.verification_source && (
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${
                            supplier.verification_source === 'EC3' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            supplier.verification_source === 'EPD' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                            {supplier.verification_source === 'EC3' && '🌍 Building Transparency EC3'}
                            {supplier.verification_source === 'EPD' && '📊 EPD International'}
                            {supplier.verification_source === 'Autodesk' && '🏗️ Autodesk Verified'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 md:justify-end max-w-md">
                      {supplier.certifications?.map((cert, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-white/5">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Matched Products Section */}
                  {supplier.matched_products && supplier.matched_products.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 mb-4 text-sm text-teal-400 font-medium">
                        <FaLeaf />
                        <span>Matching Products</span>
                        {supplier.agent_insight && (
                          <span className="text-gray-500 font-normal ml-2">• {supplier.agent_insight}</span>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        {supplier.matched_products.map((product) => (
                          <div key={product._id} className="bg-black/20 rounded-lg p-3 border border-white/5 hover:border-teal-500/30 transition flex flex-col justify-between">
                            <div>
                                <h4 className="font-medium text-gray-200 truncate mb-1">{product.title}</h4>
                                <div className="flex items-center justify-between text-xs mb-3">
                                <span className="text-gray-400">
                                    {product.currency} {product.price}
                                </span>
                                </div>
                            </div>

                            {/* LIVE Sustainability Data Badge */}
                            <SustainabilityDataBadge
                                productId={product.title}
                                materialType={product.material_type || 'Unknown'}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </main>
  )
}
