'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Supplier {
  id: string
  company_name: string
  description: string
  location: string
  certifications: string[]
  products_count: number
  avg_carbon_footprint: number
}

export default function SearchPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    location: '',
    certification: '',
    maxCarbon: 1000,
    search: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadSuppliers()
  }, [filters])

  async function loadSuppliers() {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          company_name,
          description,
          location,
          certifications
        `)
        .eq('role', 'supplier')
        .eq('is_verified', true)

      if (filters.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      if (filters.certification) {
        query = query.contains('certifications', [filters.certification])
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const certOptions = ['EPD', 'FSC', 'B Corp', 'LEED', 'Cradle to Cradle', 'ISO 14001']

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-teal-400 hover:underline">
            ← Back to Home
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
            Login
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Find Verified Suppliers</h1>
        <p className="text-gray-400 mb-8">Search {suppliers.length}+ certified sustainable material suppliers</p>

        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Search */}
          <input
            type="text"
            placeholder="Search suppliers..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-teal-500 outline-none"
          />

          {/* Location */}
          <input
            type="text"
            placeholder="Location..."
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-teal-500 outline-none"
          />

          {/* Certification */}
          <select
            value={filters.certification}
            onChange={(e) => setFilters({ ...filters, certification: e.target.value })}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-teal-500 outline-none"
          >
            <option value="">All Certifications</option>
            {certOptions.map(cert => (
              <option key={cert} value={cert}>{cert}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => setFilters({ location: '', certification: '', maxCarbon: 1000, search: '' })}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
          >
            Clear Filters
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-400">Loading suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No suppliers found matching your filters</p>
            <button
              onClick={() => setFilters({ location: '', certification: '', maxCarbon: 1000, search: '' })}
              className="mt-4 px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-medium transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <Link
                key={supplier.id}
                href={`/supplier/${supplier.id}`}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold group-hover:text-teal-400 transition">
                    {supplier.company_name}
                  </h3>
                  <span className="px-2 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium">
                    Verified
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {supplier.description || 'No description provided'}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {supplier.location || 'Location not provided'}
                </div>

                {supplier.certifications && supplier.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {supplier.certifications.slice(0, 3).map((cert, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-400"
                      >
                        {cert}
                      </span>
                    ))}
                    {supplier.certifications.length > 3 && (
                      <span className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-400">
                        +{supplier.certifications.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
