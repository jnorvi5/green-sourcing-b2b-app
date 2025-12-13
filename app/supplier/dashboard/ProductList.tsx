'use client'

import type { Product } from '@/types/product'
import Link from 'next/link'

interface ProductListProps {
  products: Product[]
  loading: boolean
}

export function ProductList({ products, loading }: ProductListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse border border-white/10" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Products Listed</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Start building your catalog by adding your sustainable materials. Verified products get 5x more RFQs.
        </p>
        <Link
          href="/supplier/products/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-500 text-black font-semibold hover:bg-teal-400 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add First Product
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">My Products</h2>
        <Link
          href="/supplier/products/new"
          className="px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-teal-500/50 transition flex flex-col">
            {/* Image Area */}
            <div className="relative h-48 bg-gray-800">
              {product.images && product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Verification Badge */}
              {product.verified && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-black text-xs font-bold rounded flex items-center gap-1 shadow-lg">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  VERIFIED
                </div>
              )}

              {/* Status Badges Overlay */}
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                 {/* LEED Eligible Badge - Check if certifications include LEED */}
                 {product.certifications?.some(c => c.includes('LEED')) && (
                     <span className="px-2 py-0.5 bg-black/60 backdrop-blur-sm border border-white/20 text-white text-[10px] font-medium rounded uppercase">
                         LEED Eligible
                     </span>
                 )}
                 {/* Buy Clean Badge - Check if GWP exists (simplified logic for MVP) */}
                 {product.sustainability_data?.gwp && (
                     <span className="px-2 py-0.5 bg-blue-900/80 backdrop-blur-sm border border-blue-500/30 text-blue-100 text-[10px] font-medium rounded uppercase">
                         Buy Clean
                     </span>
                 )}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-4 flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition line-clamp-1">{product.name}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-2">{product.material_type}</p>

                {/* Mini Specs */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    {product.sustainability_data?.gwp && (
                        <div className="flex items-center gap-1">
                            <span className="text-gray-300">{product.sustainability_data.gwp}</span>
                            <span>kg CO2e</span>
                        </div>
                    )}
                    {product.epd_url && (
                        <div className="flex items-center gap-1 text-teal-500/80">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            EPD
                        </div>
                    )}
                </div>
              </div>

              {/* Analytics & Actions Footer */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                 <div>
                    <div className="text-lg font-bold text-white">{product.views_count || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Views</div>
                 </div>
                 <div>
                    <div className="text-lg font-bold text-white">{product.clicks_count || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Clicks</div>
                 </div>
                 <div>
                    <div className="text-lg font-bold text-teal-400">{product.rfq_count || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Inquiries</div>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
