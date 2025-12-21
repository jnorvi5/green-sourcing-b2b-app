
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/schema";
import { FaLeaf, FaBuilding, FaSearch, FaMapMarkerAlt } from "react-icons/fa";

type Props = {
  params: {
    category: string;
    location: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Helper to format strings (e.g. "new-york" -> "New York")
const formatString = (str: string) => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, location } = params;
  const formattedCategory = formatString(category);
  const formattedLocation = formatString(location);

  return {
    title: `Top Verified Low-Carbon ${formattedCategory} Suppliers in ${formattedLocation} | GreenChainz`,
    description: `Find verified sustainable ${formattedCategory} suppliers in ${formattedLocation}. Compare low-carbon materials, view EPDs, and source green building products on GreenChainz.`,
  };
}

export default async function MaterialLocationPage({ params, searchParams }: Props) {
  const { category, location } = params;

  // Consume searchParams to avoid unused variable warning
  // await searchParams; // searchParams is object in Next 14, no need to await

  const formattedCategory = formatString(category);
  const formattedLocation = formatString(location);

  const supabase = await createClient();

  // Map URL category to database material_type if possible, or use as is if it matches
  // The schema defines specific material types. We should try to match loosely or direct.
  // Schema: 'insulation' | 'flooring' | 'cladding' | 'roofing' | 'structural' | 'glazing' | 'finishes' | 'hvac' | 'plumbing' | 'electrical' | 'other'

  // If the category in URL matches one of the schema types (case insensitive), we use it.
  // Otherwise we might default to 'other' or search.
  // For now, let's assume the user uses the correct slug or we fallback to partial match.

  let query = supabase
    .from("products")
    .select(
      `
      *,
      suppliers!inner (
        id,
        company_name,
        tier,
        geographic_coverage
      ),
      epd_data (
        id,
        gwp_a1a3_kgco2e
      )
    `
    );

  // Filter by category (material_type)
  // We use ilike to allow for some flexibility, e.g. "Insulation" vs "insulation"
  // Note: If the URL category is "concrete", but material_type is "structural", this might miss.
  // Ideally we would have a mapping.

  const MATERIAL_TYPE_MAPPING: Record<string, string> = {
    "concrete": "structural",
    "steel": "structural",
    "wood": "structural",
    // Add more if needed, otherwise rely on direct match
  };

  const dbCategory = MATERIAL_TYPE_MAPPING[category.toLowerCase()] || category;

  // We'll try to filter by material_type.
  // Since material_type is an enum in DB, if we send something invalid it might fail or return nothing.
  // However, Supabase (Postgres) text columns often handle string comparison.
  // If 'material_type' is an enum type in Postgres, we must cast or be exact.
  // Assuming it's text or we can just query.

  // If it's a known mapped type, use it.
  query = query.ilike("material_type", dbCategory);

  const { data: productsData, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    // You might want to throw error or show empty state
  }

  // Client-side filtering for location (safer for loose matching)
  // Explicitly typing product as Product, but suppliers might be missing from type if not joined.
  // The Product type in schema usually has optional suppliers.
  const products = (productsData || []).filter((product: Product) => {
    const coverage = product.suppliers?.geographic_coverage || [];
    // Check if any coverage area matches the requested location loosely
    return coverage.some((area: string) =>
      area.toLowerCase().includes(formattedLocation.toLowerCase()) ||
      area.toLowerCase().includes(location.toLowerCase()) ||
      "United States".toLowerCase().includes(formattedLocation.toLowerCase()) // Fallback for national suppliers? Maybe too broad.
    );
  });

  // JSON-LD Breadcrumb
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Materials",
        "item": "https://greenchainz.com/materials" // Assuming this exists or redirects
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": formattedCategory,
        "item": `https://greenchainz.com/materials/${category}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": formattedLocation,
        "item": `https://greenchainz.com/materials/${category}/${location}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header with Title */}
      <div className="bg-teal-900 text-white py-12">
        <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Top Verified Low-Carbon {formattedCategory} Suppliers in {formattedLocation}
            </h1>
            <p className="text-teal-100 text-lg max-w-2xl">
                Compare verified sustainable {formattedCategory.toLowerCase()} products available in {formattedLocation}.
                Filter by carbon footprint, certifications, and more.
            </p>

             {/* Breadcrumbs UI */}
            <nav className="flex mt-6 text-sm text-teal-200" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                    <Link href="/" className="hover:text-white">
                        Home
                    </Link>
                    </li>
                    <li>
                    <div className="flex items-center">
                        <span className="mx-2">/</span>
                        <Link href="/products" className="hover:text-white">
                        Materials
                        </Link>
                    </div>
                    </li>
                    <li aria-current="page">
                    <div className="flex items-center">
                        <span className="mx-2">/</span>
                        <span className="text-white">{formattedCategory} - {formattedLocation}</span>
                    </div>
                    </li>
                </ol>
            </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-1">
        {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border shadow-sm">
                <FaSearch className="mx-auto text-4xl text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No suppliers found in {formattedLocation}</h2>
                <p className="text-gray-600 mb-6">
                    We couldn&apos;t find any {formattedCategory} suppliers specifically listing {formattedLocation} coverage yet.
                </p>
                <Link href="/products" className="btn bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 transition">
                    View All Products
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {products.map((product: Product) => (
                <div key={product.id} className="group bg-white rounded-xl border hover:shadow-lg hover:border-teal-200 transition overflow-hidden flex flex-col relative">
                  <Link href={`/products/${product.id}`} className="block relative h-48 bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={product.images[0]}
                            alt={product.product_name}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <FaLeaf className="text-4xl" />
                        </div>
                    )}

                    {product.epd_id && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-emerald-700 shadow-sm flex items-center gap-1 z-10">
                            <FaLeaf /> EPD Verified
                        </div>
                    )}
                  </Link>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <Link href={`/products/${product.id}`} className="font-bold text-lg text-gray-900 group-hover:text-teal-700 transition line-clamp-2">
                            {product.product_name}
                        </Link>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                        <FaBuilding className="text-gray-400" />
                        {product.suppliers?.company_name}
                    </div>

                    {/* Location Badge for Relevance */}
                    <div className="flex items-center gap-1 text-xs text-teal-600 mb-2 font-medium bg-teal-50 w-fit px-2 py-1 rounded">
                        <FaMapMarkerAlt /> Available in {formattedLocation}
                    </div>

                    <div className="mt-auto space-y-3">
                        {product.carbon_footprint_a1a3 && (
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Carbon (A1-A3)</span>
                                <span className="font-medium text-gray-900">{product.carbon_footprint_a1a3} kg CO2e</span>
                            </div>
                        )}

                        <div className="pt-3 border-t flex justify-between items-center">
                             <span className="font-bold text-gray-900">
                                 {product.price_per_unit ? `$${product.price_per_unit}` : "Contact"}
                                 {product.price_per_unit && <span className="text-gray-400 text-xs font-normal"> / {product.unit_type}</span>}
                             </span>
                             <div className="flex gap-2">
                                <Link href={`/products/${product.id}`} className="text-teal-600 text-sm font-medium hover:underline">Details</Link>
                                <Link href={`/compare?ids=${product.id}`} className="text-gray-500 text-sm hover:text-teal-600">Compare</Link>
                             </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}
      </main>
    </div>
  );
}
