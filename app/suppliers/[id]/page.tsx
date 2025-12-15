
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaBuilding, FaGlobe, FaCertificate, FaLeaf } from "react-icons/fa";
import { Product } from "@/types/schema";

export default async function SupplierPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch supplier details
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (supplierError || !supplier) {
    console.error("Error fetching supplier:", supplierError);
    notFound();
  }

  // Fetch supplier's products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      *,
      epd_data (
        id,
        gwp_a1a3_kgco2e
      )
    `)
    .eq("supplier_id", id)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  // Parse certifications if needed
  let certifications: any[] = [];
  if (Array.isArray(supplier.certifications)) {
     certifications = supplier.certifications;
  }

  return (
    <main className="min-h-screen bg-gray-50">
       {/* Supplier Header */}
       <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white py-12">
          <div className="container mx-auto px-4 max-w-6xl">
             <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center p-4 shadow-xl text-gray-900">
                    <FaBuilding className="text-5xl text-gray-300" />
                    {/* Placeholder for Logo if we had one */}
                </div>

                <div className="flex-1 text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                       <h1 className="text-4xl font-bold">{supplier.company_name}</h1>
                       {supplier.tier === 'verified' && (
                           <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                               Verified Supplier
                           </span>
                       )}
                   </div>

                   <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-300 mb-6">
                       {supplier.geographic_coverage && supplier.geographic_coverage.length > 0 && (
                           <div className="flex items-center gap-1">
                               <FaGlobe className="text-teal-400" />
                               <span>{supplier.geographic_coverage.join(", ")}</span>
                           </div>
                       )}
                       <div className="flex items-center gap-1">
                           <span className="text-teal-400 font-bold">{supplier.total_rfqs_won}</span> Projects Won
                       </div>
                   </div>

                   <p className="max-w-2xl text-gray-300">
                       Leading supplier of sustainable building materials. Committed to transparency and low-carbon solutions.
                       {/* Description isn't in schema directly but maybe inferred or added later */}
                   </p>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px]">
                    <button className="bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 px-6 rounded-lg transition">
                        Contact Supplier
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition border border-white/20">
                        Request Catalog
                    </button>
                </div>
             </div>
          </div>
       </div>

       <div className="container mx-auto px-4 max-w-6xl py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Sidebar Info */}
             <div className="space-y-6">
                 {/* Certifications */}
                 <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FaCertificate className="text-teal-600" /> Certifications
                    </h3>
                    {certifications.length > 0 ? (
                        <ul className="space-y-3">
                            {certifications.map((cert: any, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                                    {typeof cert === 'string' ? cert : cert.name || JSON.stringify(cert)}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-sm">No certifications listed.</p>
                    )}
                 </div>

                 {/* Stats */}
                 <div className="bg-white rounded-xl shadow-sm border p-6">
                     <h3 className="text-lg font-bold text-gray-900 mb-4">Supplier Stats</h3>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center">
                             <span className="text-gray-600">Response Rate</span>
                             <span className="font-bold text-gray-900">
                                 {supplier.total_rfqs_received > 0
                                    ? `${Math.round((supplier.total_rfqs_won / supplier.total_rfqs_received) * 100)}%`
                                    : "N/A"}
                             </span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-gray-600">Avg Response</span>
                             <span className="font-bold text-gray-900">
                                 {supplier.avg_response_time_hours || "24"} hrs
                             </span>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Right Content - Product List */}
             <div className="lg:col-span-2">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-gray-900">Products ({products?.length || 0})</h2>
                 </div>

                 {!products || products.length === 0 ? (
                     <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
                         No products found for this supplier.
                     </div>
                 ) : (
                     <div className="space-y-4">
                         {products.map((product: Product) => (
                             <Link key={product.id} href={`/products/${product.id}`} className="block bg-white border rounded-xl p-4 hover:shadow-md hover:border-teal-300 transition group">
                                 <div className="flex gap-4">
                                     <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300 relative overflow-hidden">
                                         {product.images && product.images.length > 0 ? (
                                             <Image src={product.images[0]} alt={product.product_name} fill className="object-cover" />
                                         ) : (
                                             <FaLeaf className="text-2xl" />
                                         )}
                                     </div>
                                     <div className="flex-1">
                                         <div className="flex justify-between items-start">
                                             <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-700 transition">{product.product_name}</h3>
                                             {product.price_per_unit && (
                                                 <span className="font-medium text-gray-900">${product.price_per_unit} / {product.unit_type}</span>
                                             )}
                                         </div>
                                         <p className="text-sm text-gray-500 mb-2 line-clamp-1">{product.description}</p>
                                         <div className="flex gap-2">
                                             <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                 {product.material_type}
                                             </span>
                                             {product.epd_id && (
                                                 <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                                                     <FaLeaf size={10} /> EPD
                                                 </span>
                                             )}
                                             {product.carbon_footprint_a1a3 && (
                                                 <span className="text-xs text-gray-500 flex items-center">
                                                     GWP: {product.carbon_footprint_a1a3} kg CO2e
                                                 </span>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             </Link>
                         ))}
                     </div>
                 )}
             </div>
          </div>
       </div>
    </main>
  );
}
