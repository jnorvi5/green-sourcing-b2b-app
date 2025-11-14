// src/pages/ProductsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import { searchProducts } from '@/api/searchProducts'
import type { Product, FilterState } from '@/types'

// Mock data for filter options
const MATERIAL_OPTIONS = ['Concrete', 'Steel', 'Wood', 'Insulation', 'Glass']
const CERTIFICATION_OPTIONS = ['LEED', 'FSC', 'BREEAM', 'C2C']

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState<FilterState>({
        material_type: [],
        certifications: [],
        recycled_content_pct: 0,
    })

    const handleFilterChange = (
        type: keyof FilterState,
        value: string | number
    ) => {
        setFilters((prev) => {
            if (type === 'recycled_content_pct') {
                return { ...prev, [type]: Number(value) }
            }

            const list = (prev[type as keyof Omit<FilterState, 'recycled_content_pct'>] || []) as string[]
            const newList = list.includes(value as string)
                ? list.filter((item) => item !== value)
                : [...list, value as string]

            return { ...prev, [type]: newList }
        })
    }

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const results = await searchProducts(searchQuery, filters)
            setProducts(results)
        } catch (err) {
            const error = err as Error
            console.error('Error fetching products:', error.message)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }, [searchQuery, filters])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Main content rendering
    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            )
        }

        if (error) {
            return (
                <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
                    <h3 className="text-red-800 font-semibold mb-2">Error Loading Products</h3>
                    <p className="text-red-600">{error}</p>
                </div>
            )
        }

        if (products.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow p-12 text-center mt-8">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or filters.
                    </p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                    >
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {product.name}
                            </h3>
                            <div className="flex gap-2 mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {product.category}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {product.material_type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {product.description}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-lg font-bold text-gray-900">
                                    ${product.unit_price}
                                    <span className="text-sm font-normal text-gray-500">
                                        /{product.currency}
                                    </span>
                                </div>
                                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                                    Request Quote
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Sustainable Building Products
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Browse verified sustainable materials from certified suppliers
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters Column */}
                    <aside className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>

                        {/* Material Type */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">Material Type</h4>
                            {MATERIAL_OPTIONS.map((mat) => (
                                <div key={mat} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`mat-${mat}`}
                                        value={mat}
                                        checked={filters.material_type?.includes(mat)}
                                        onChange={() => handleFilterChange('material_type', mat)}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <label htmlFor={`mat-${mat}`} className="ml-2 text-sm text-gray-600">{mat}</label>
                                </div>
                            ))}
                        </div>

                        {/* Certifications */}
                        <div className="mb-6">
                            <h4 className="font-medium mb-2">Certifications</h4>
                            {CERTIFICATION_OPTIONS.map((cert) => (
                                <div key={cert} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`cert-${cert}`}
                                        value={cert}
                                        checked={filters.certifications?.includes(cert)}
                                        onChange={() => handleFilterChange('certifications', cert)}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <label htmlFor={`cert-${cert}`} className="ml-2 text-sm text-gray-600">{cert}</label>
                                </div>
                            ))}
                        </div>

                        {/* Recycled Content */}
                        <div>
                            <h4 className="font-medium mb-2">Min. Recycled Content</h4>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={filters.recycled_content_pct || 0}
                                onChange={(e) => handleFilterChange('recycled_content_pct', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right text-sm text-gray-600 mt-1">
                                {filters.recycled_content_pct || 0}%
                            </div>
                        </div>
                    </aside>

                    {/* Search Results Column */}
                    <main className="lg:col-span-3">
                        <div className="mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products by name or description..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    )
}
