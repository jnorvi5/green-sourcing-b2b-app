import { createClient } from "@/lib/supabase/server";
import { MaterialCard, MaterialProduct } from "@/components/MaterialCard";
import { MaterialFilters, Category, Certification } from "@/components/MaterialFilters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Materials | GreenChainz",
  description: "Search and filter verified green building materials.",
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // Extract filters from searchParams
  const query = typeof params.query === "string" ? params.query : undefined;
  const categoryId = typeof params.category === "string" ? params.category : undefined;

  // Parse ranges (sliders pass exact values now)
  const minGwp = typeof params.minGwp === "string" ? params.minGwp : undefined;
  const maxGwp = typeof params.maxGwp === "string" ? params.maxGwp : undefined;
  const minPrice = typeof params.minPrice === "string" ? params.minPrice : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : undefined;

  const certParams = params.certifications;
  const certificationsFilter = Array.isArray(certParams) ? certParams : (certParams ? [certParams] : []);

  // Fetch Categories
  const { data: categoriesData } = await supabase
    .from("Product_Categories")
    .select("CategoryID, CategoryName, Description");

  const categories: Category[] = categoriesData?.map(c => ({
    CategoryID: String(c.CategoryID),
    CategoryName: c.CategoryName
  })) || [];

  // Fetch Certifications
  const { data: certificationsData } = await supabase
    .from("Certifications")
    .select("CertificationID, Name")
    .order('Name');

  const certifications: Certification[] = certificationsData?.map(c => ({
    CertificationID: String(c.CertificationID),
    Name: c.Name
  })) || [];

  // Build Product Query
  let productsQuery = supabase
    .from("Products")
    .select(`
      ProductID,
      ProductName,
      Description,
      SupplierID,
      CategoryID,
      UnitPrice,
      Currency,
      Suppliers (
        SupplierID,
        Companies (CompanyName)
      ),
      Product_EPDs (
        GlobalWarmingPotential,
        EPDDocumentURL
      ),
      Product_Categories (
        CategoryName
      )
    `);

  if (query) {
    productsQuery = productsQuery.or(`ProductName.ilike.%${query}%,Description.ilike.%${query}%`);
  }

  if (categoryId) {
    productsQuery = productsQuery.eq("CategoryID", categoryId);
  }

  if (minPrice) {
    productsQuery = productsQuery.gte("UnitPrice", minPrice);
  }
  if (maxPrice) {
    productsQuery = productsQuery.lte("UnitPrice", maxPrice);
  }

  const { data: productsData, error } = await productsQuery;

  if (error) {
    console.error("Error fetching products:", error);
  }

  let filteredProducts = productsData || [];

  // Filter by GWP (In-memory for MVP due to complex join)
  if (minGwp || maxGwp) {
    filteredProducts = filteredProducts.filter((p: any) => {
      const epds = Array.isArray(p.Product_EPDs) ? p.Product_EPDs : (p.Product_EPDs ? [p.Product_EPDs] : []);
      if (epds.length === 0) return false; // If filtering by GWP, product must have EPD

      const gwps = epds.map((epd: any) => epd.GlobalWarmingPotential).filter((g: any) => g !== null);
      if (gwps.length === 0) return false;

      const minProductGwp = Math.min(...gwps);

      // Strict range check
      if (minGwp && minProductGwp < parseFloat(minGwp)) return false;
      if (maxGwp && minProductGwp > parseFloat(maxGwp)) return false;

      return true;
    });
  }

  // Filter by Certifications (In-Memory Logic)
  // Fetch relevant Supplier Certifications to map properly
  if (certificationsFilter.length > 0) {
    const { data: supplierCerts } = await supabase
      .from("Supplier_Certifications")
      .select("SupplierID, CertificationID")
      .in("CertificationID", certificationsFilter);

    if (supplierCerts) {
        // We want products where the supplier has ALL selected certifications?
        // Or ANY? Usually filters are "OR" within same category (checkboxes), but strict for "AND" between categories.
        // Let's assume ANY for now for better result availability.
        const allowedSupplierIds = new Set(supplierCerts.map((sc: any) => sc.SupplierID));
        filteredProducts = filteredProducts.filter((p: any) => allowedSupplierIds.has(p.SupplierID));
    }
  }

  // Optimize: Fetch Certifications for these suppliers to display on card
  // (We can't do it efficiently per row in main query without N+1 or complex join)
  // We will fetch all certs for the suppliers in the result set
  const supplierIds = Array.from(new Set(filteredProducts.map((p:any) => p.SupplierID)));

  let supplierCertMap: Record<string, string[]> = {};

  if (supplierIds.length > 0) {
      const { data: allSupplierCerts } = await supabase
        .from("Supplier_Certifications")
        .select(`
            SupplierID,
            Certifications (Name)
        `)
        .in("SupplierID", supplierIds);

      if (allSupplierCerts) {
          allSupplierCerts.forEach((sc: any) => {
             if (!supplierCertMap[sc.SupplierID]) {
                 supplierCertMap[sc.SupplierID] = [];
             }
             if (sc.Certifications?.Name) {
                 supplierCertMap[sc.SupplierID].push(sc.Certifications.Name);
             }
          });
      }
  }


  // Transform to MaterialProduct interface
  const materials: MaterialProduct[] = filteredProducts.map((p: any) => {
    const epds = Array.isArray(p.Product_EPDs) ? p.Product_EPDs : (p.Product_EPDs ? [p.Product_EPDs] : []);
    const gwp = epds.length > 0 ? epds[0].GlobalWarmingPotential : null;

    // Get certs for this supplier
    const certs = supplierCertMap[p.SupplierID] || [];

    return {
      ProductID: String(p.ProductID),
      ProductName: p.ProductName,
      Description: p.Description,
      SupplierID: String(p.SupplierID),
      SupplierName: p.Suppliers?.Companies?.CompanyName || "Unknown Supplier",
      ImageURL: null, // Placeholder will be used
      GlobalWarmingPotential: gwp,
      UnitPrice: p.UnitPrice,
      Currency: p.Currency,
      Certifications: certs,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Find Materials</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Search and filter verified sustainable building materials. Browse through our catalog of verified suppliers and products.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-72 flex-shrink-0">
          <MaterialFilters
            categories={categories}
            certifications={certifications}
            initialFilters={{
              query,
              category: categoryId,
              minGwp,
              maxGwp,
              minPrice,
              maxPrice,
              certifications: certificationsFilter
            }}
          />
        </aside>

        <main className="flex-grow">
          {materials.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-slate-400">
                Showing {materials.length} results
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material) => (
                  <MaterialCard key={material.ProductID} product={material} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-slate-900 rounded-lg border border-slate-800 border-dashed">
              <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-medium text-slate-300">No materials found</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                We couldn't find any materials matching your filters. Try adjusting your search criteria or clearing some filters.
              </p>
              <a href="/materials" className="mt-6 inline-block text-green-500 hover:text-green-400 font-medium">
                  Clear all filters
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
