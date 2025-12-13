import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MaterialPassportCard from '@/components/MaterialPassportCard';
import { FaArrowLeft, FaIndustry, FaRulerCombined } from 'react-icons/fa';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch product with supplier info
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      suppliers (
        id,
        company_name,
        tier,
        epd_verified,
        verification_source
      ),
      epd_data (
        id,
        data_source,
        gwp_a1a3_kgco2e,
        gwp_total_kgco2e,
        validity_end
      )
    `)
    .eq('id', id)
    .single();

  if (error || !product) {
    console.error('Error fetching product:', error);
    notFound();
  }

  // Determine verification status
  // Note: Schema says `tier` is enum, and `products` has `epd_verified` isn't in products but likely in suppliers or derived.
  // The schema shows `suppliers` table has `tier` (free, standard, verified).
  // `epd_verified` was seen in search page types but not explicitly in schema for suppliers,
  // but let's check `suppliers` table definition again in memory.
  // Ah, schema says `tier` enum. Search page used `epd_verified`.
  // I'll use `tier === 'verified'` for now, or check if EPD exists.

  const isVerified = product.suppliers?.tier === 'verified' || !!product.epd_data;

  // Prepare data for passport
  const carbonFootprint = product.epd_data?.gwp_a1a3_kgco2e ?? product.carbon_footprint_a1a3 ?? null;

  // Certifications might be JSONB, need to handle parsing if it's not automatically done or if it's an object array
  // Schema says `certifications JSONB DEFAULT '[]'::jsonb`.
  // In search page it was string[]. In schema comment it says "JSONB array of certification objects" for suppliers,
  // but "JSONB array of product-specific certifications" for products.
  // Let's assume it's an array of strings or objects. I'll cast safely.

  let certifications: string[] = [];
  if (Array.isArray(product.certifications)) {
    certifications = product.certifications.map((c: unknown) => {
      if (typeof c === 'string') return c;
      if (typeof c === 'object' && c !== null && 'name' in c) return (c as { name: string }).name;
      return JSON.stringify(c);
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <div className="container mx-auto max-w-6xl">
        <Link href="/search" className="inline-flex items-center gap-2 text-gray-400 hover:text-teal-400 transition mb-6">
          <FaArrowLeft /> Back to Search
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm text-teal-300">
                  {product.material_type}
                </span>
                {isVerified && (
                  <span className="bg-emerald-500/20 px-3 py-1 rounded-full text-sm text-emerald-400 border border-emerald-500/30">
                    Verified Product
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.product_name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <FaIndustry />
                <Link href={`/supplier/${product.supplier_id}`} className="hover:text-white transition underline decoration-gray-600 underline-offset-4">
                  {product.suppliers?.company_name || 'Unknown Supplier'}
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-300 leading-relaxed">
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            {/* Specifications */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaRulerCombined className="text-teal-400" />
                Technical Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.thermal_conductivity && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Thermal Conductivity</span>
                    <span>{product.thermal_conductivity}</span>
                  </div>
                )}
                {product.unit_type && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Unit Type</span>
                    <span className="capitalize">{product.unit_type}</span>
                  </div>
                )}
                {product.lead_time_days !== null && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Lead Time</span>
                    <span>{product.lead_time_days} days</span>
                  </div>
                )}
                 {product.min_order_quantity !== null && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Min Order</span>
                    <span>{product.min_order_quantity} {product.unit_type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
             {/* Material Passport */}
             <MaterialPassportCard
               carbonFootprint={carbonFootprint}
               certifications={certifications}
               supplierVerified={isVerified}
               dataSource={product.epd_data?.data_source || 'Self-declared'}
               lastUpdated={product.updated_at}
             />

             {/* Actions */}
             <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {product.price_per_unit ? `$${product.price_per_unit}` : 'Contact for Price'}
                  </span>
                  {product.price_per_unit && <span className="text-gray-400 text-sm ml-2">/ {product.unit_type}</span>}
                </div>
                <button className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-lg transition mb-3">
                  Request Quote
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition">
                  Download EPD
                </button>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
