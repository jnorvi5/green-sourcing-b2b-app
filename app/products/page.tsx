
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FaSearch, FaLeaf, FaBuilding } from "react-icons/fa";
import Image from "next/image";
import { Product } from "@/types/schema";

const MASTERFORMAT_CATEGORIES = [
  { id: "03", name: "03 - Concrete" },
  { id: "04", name: "04 - Masonry" },
  { id: "05", name: "05 - Metals" },
  { id: "06", name: "06 - Wood, Plastics, and Composites" },
  { id: "07", name: "07 - Thermal and Moisture Protection" },
  { id: "08", name: "08 - Openings" },
  { id: "09", name: "09 - Finishes" },
  { id: "10", name: "10 - Specialties" },
  { id: "22", name: "22 - Plumbing" },
  { id: "23", name: "23 - HVAC" },
  { id: "26", name: "26 - Electrical" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string; epd?: string };
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const q = params.q || "";
  const category = params.category || "";
  const sort = params.sort || "newest";
  const hasEpd = params.epd === "true";

  let query = supabase
    .from("products")
    .select(
      `
      *,
      suppliers (
        id,
        company_name,
        tier
      ),
      epd_data (
        id,
        gwp_a1a3_kgco2e
      )
    `
    );

  if (q) {
    query = query.ilike("product_name", `%${q}%`);
  }

  const MATERIAL_TYPE_MAPPING: Record<string, string> = {
    "03": "structural",
    "04": "structural",
    "05": "structural",
    "06": "structural",
    "07": "insulation",
    "08": "glazing",
    "09": "flooring",
    "10": "other",
    "22": "plumbing",
    "23": "hvac",
    "26": "electrical",
  };

  if (category) {
      const mappedType = MATERIAL_TYPE_MAPPING[category];
      if (mappedType) {
         query = query.eq("material_type", mappedType);
      }
  }

  if (hasEpd) {
      query = query.not("epd_id", "is", null);
  }

  if (sort === 'price_asc') {
      query = query.order('price_per_unit', { ascending: true });
  } else if (sort === 'price_desc') {
      query = query.order('price_per_unit', { ascending: false });
  } else if (sort === 'gwp_asc') {
      query = query.order('carbon_footprint_a1a3', { ascending: true });
  } else {
      query = query.order('created_at', { ascending: false });
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Search Bar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <form className="flex gap-4 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search products, manufacturers, or keywords..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {/* Preserve other params */}
            {category && <input type="hidden" name="category" value={category} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
            {hasEpd && <input type="hidden" name="epd" value="true" />}

            <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-medium">
              Search
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 container mx-auto px-4 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-lg border p-4 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wide">MasterFormat®</h3>
            <ul className="space-y-1">
              {MASTERFORMAT_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?category=${cat.id}&q=${q}&sort=${sort}&epd=${hasEpd}`}
                    className={`block px-3 py-2 rounded-md text-sm transition ${
                      category === cat.id
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4 uppercase text-sm tracking-wide">Filters</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Sustainability</label>
                        <div className="flex items-center gap-2">
                             <Link
                                href={`/products?category=${category}&q=${q}&sort=${sort}&epd=${!hasEpd}`}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                                    hasEpd ? "bg-teal-600 border-teal-600 text-white" : "border-gray-300 text-transparent hover:border-teal-500"
                                }`}
                             >
                                 <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                             </Link>
                             <Link
                                href={`/products?category=${category}&q=${q}&sort=${sort}&epd=${!hasEpd}`}
                                className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                             >
                                 Has EPD
                             </Link>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {q ? `Search results for "${q}"` : category ? `Category: ${category}` : "All Products"}
              <span className="ml-2 text-base font-normal text-gray-500">({products?.length || 0} items)</span>
            </h1>

            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <form action="/products" method="get">
                    {q && <input type="hidden" name="q" value={q} />}
                    {category && <input type="hidden" name="category" value={category} />}
                    {hasEpd && <input type="hidden" name="epd" value="true" />}
                    <select
                        name="sort"
                        defaultValue={sort}
                        className="border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500 mr-2"
                    >
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="gwp_asc">Lowest Carbon</option>
                    </select>
                    <button type="submit" className="text-sm text-teal-600 font-medium hover:underline">Sort</button>
                </form>
            </div>
          </div>

          {!products || products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                <Link href="/products" className="text-teal-600 hover:underline mt-2 inline-block">Clear filters</Link>
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
    </div>
  );
}
