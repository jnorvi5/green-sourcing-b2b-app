
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";
import { Product } from "@/types/schema";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const ids = params.ids ? params.ids.split(",") : [];

  if (ids.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No products selected</h1>
        <p className="text-gray-600 mb-6">Select products from the catalog to compare them.</p>
        <Link href="/products" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition">
          Go to Catalog
        </Link>
      </div>
    );
  }

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      suppliers (company_name),
      epd_data (gwp_a1a3_kgco2e, validity_end)
    `)
    .in("id", ids);

  if (error || !products) {
    console.error("Error fetching products for comparison:", error);
    return <div>Error loading comparison.</div>;
  }

  // Build a Map for O(1) lookup instead of O(n) find() calls
  const productMap = new Map(products.map((p) => [p.id, p]));
  
  // Ensure order matches the requested IDs using Map lookup (O(n) instead of O(n²))
  const orderedProducts = ids
    .map((id) => productMap.get(id))
    .filter((p): p is Product => !!p);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
            <Link href="/products" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition">
                <FaArrowLeft /> Back to Catalog
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Product Comparison</h1>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/50">
                <th className="p-4 border-b border-r min-w-[200px] font-semibold text-gray-500 uppercase text-xs tracking-wider">Feature</th>
                {orderedProducts.map((product) => (
                  <th key={product.id} className="p-4 border-b min-w-[300px] relative">
                    <Link href={`/products/${product.id}`} className="hover:text-teal-600 transition block mb-2">
                        <span className="text-lg font-bold text-gray-900 block line-clamp-2 h-14">
                            {product.product_name}
                        </span>
                    </Link>
                    <div className="text-sm text-gray-500 font-normal mb-2">
                         {product.suppliers?.company_name}
                    </div>
                    {/* Image placeholder */}
                    <div className="h-32 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                        {product.images?.[0] ? (
                            <Image
                                src={product.images[0]}
                                alt={product.product_name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-gray-300 text-xs">No Image</span>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Price */}
              <tr>
                <td className="p-4 border-r font-medium text-gray-700">Price</td>
                {orderedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.price_per_unit ? (
                        <span className="font-bold text-gray-900">${product.price_per_unit} / {product.unit_type}</span>
                    ) : (
                        <span className="text-gray-500 italic">Contact for Price</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Sustainability Group */}
              <tr className="bg-emerald-50/50">
                <td colSpan={orderedProducts.length + 1} className="p-2 px-4 font-bold text-emerald-800 text-sm uppercase tracking-wider">
                    Sustainability
                </td>
              </tr>
              <tr>
                <td className="p-4 border-r font-medium text-gray-700">GWP (A1-A3)</td>
                {orderedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.epd_data?.gwp_a1a3_kgco2e || product.carbon_footprint_a1a3 ? (
                        <span className="font-bold text-emerald-700">
                            {product.epd_data?.gwp_a1a3_kgco2e ?? product.carbon_footprint_a1a3} kg CO2e
                        </span>
                    ) : (
                        <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-r font-medium text-gray-700">Recycled Content</td>
                {orderedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.recycled_content_pct !== null ? `${product.recycled_content_pct}%` : "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                 <td className="p-4 border-r font-medium text-gray-700">EPD</td>
                 {orderedProducts.map((product) => (
                   <td key={product.id} className="p-4">
                     {product.epd_id ? (
                         <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-bold">
                             Verified
                         </span>
                     ) : (
                         <span className="text-gray-400 text-sm">None</span>
                     )}
                   </td>
                 ))}
              </tr>

              {/* Specs Group */}
              <tr className="bg-gray-50/50">
                <td colSpan={orderedProducts.length + 1} className="p-2 px-4 font-bold text-gray-800 text-sm uppercase tracking-wider">
                    Technical Specs
                </td>
              </tr>
              <tr>
                <td className="p-4 border-r font-medium text-gray-700">Material Type</td>
                {orderedProducts.map((product) => (
                  <td key={product.id} className="p-4 capitalize">
                    {product.material_type}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-r font-medium text-gray-700">Thermal Cond.</td>
                {orderedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.thermal_conductivity ?? "N/A"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-r font-medium text-gray-700">Lead Time</td>
                {orderedProducts.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.lead_time_days ? `${product.lead_time_days} days` : "N/A"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
