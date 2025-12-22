import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { SustainabilityDataBadge } from "@/components/SustainabilityDataBadge";
import { notFound } from "next/navigation";

// Since this is a server component, we can fetch directly
export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch product details with related info
  const { data: product, error } = await supabase
    .from("Products")
    .select(`
      ProductID,
      ProductName,
      Description,
      SupplierID,
      CategoryID,
      UnitPrice,
      Currency,
      LeadTimeDays,
      Suppliers (
        SupplierID,
        Companies (CompanyName, Address, Website)
      ),
      Product_EPDs (
        EPDNumber,
        GlobalWarmingPotential,
        ReferenceServiceLife,
        EPDDocumentURL,
        IssueDate,
        ExpiryDate
      ),
      Product_Categories (
        CategoryName
      ),
      Product_Materials_Composition (
        MaterialName,
        Percentage,
        IsRecycled
      )
    `)
    .eq("ProductID", id)
    .single();

  if (error || !product) {
    console.error("Error fetching product details:", error);
    notFound();
  }

  // Helper to safely get array data
  const epds = Array.isArray(product.Product_EPDs)
    ? product.Product_EPDs
    : (product.Product_EPDs ? [product.Product_EPDs] : []);

  const mainEpd = epds.length > 0 ? epds[0] : null;

  const compositions = Array.isArray(product.Product_Materials_Composition)
    ? product.Product_Materials_Composition
    : (product.Product_Materials_Composition ? [product.Product_Materials_Composition] : []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        href="/materials"
        className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Materials
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Image & Quick Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="aspect-square w-full bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
             {/* Placeholder for Image */}
             <span className="text-slate-500">No Image</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-4">
            <h3 className="font-semibold text-slate-200">Sustainability Stats</h3>

            {mainEpd && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">GWP</span>
                  <SustainabilityDataBadge
                    value={mainEpd.GlobalWarmingPotential}
                    unit="kg CO2e"
                  />
                </div>
                {mainEpd.ReferenceServiceLife && (
                   <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-400">Service Life</span>
                   <span className="text-slate-200">{mainEpd.ReferenceServiceLife} years</span>
                 </div>
                )}
              </div>
            )}

            {!mainEpd && <p className="text-sm text-slate-500">No EPD data available.</p>}
          </div>

          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
             <h3 className="font-semibold text-slate-200 mb-2">Supplier</h3>
             <p className="text-lg text-slate-300 font-medium">{product.Suppliers?.Companies?.CompanyName}</p>
             <p className="text-sm text-slate-500 mt-1">{product.Suppliers?.Companies?.Address}</p>
             {product.Suppliers?.Companies?.Website && (
               <a
                 href={product.Suppliers.Companies.Website}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-sm text-green-500 hover:text-green-400 mt-2 inline-block"
               >
                 Visit Website
               </a>
             )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-green-500 text-sm font-medium mb-1 block">
                  {product.Product_Categories?.CategoryName || "Material"}
                </span>
                <h1 className="text-3xl font-bold text-white mb-2">{product.ProductName}</h1>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {product.UnitPrice
                    ? `${product.Currency || '$'}${product.UnitPrice.toFixed(2)}`
                    : "Price on Request"}
                </div>
                <div className="text-sm text-slate-500">per unit</div>
              </div>
            </div>

            <p className="text-slate-300 mt-4 leading-relaxed">
              {product.Description || "No description provided."}
            </p>
          </div>

          <div className="flex gap-4">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white flex-1">
              Add to RFQ
            </Button>
            {mainEpd?.EPDDocumentURL && (
              <Button variant="outline" size="lg" asChild className="border-slate-700 hover:bg-slate-800 flex-1">
                <a href={mainEpd.EPDDocumentURL} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  View EPD
                </a>
              </Button>
            )}
          </div>

          {/* Specs / Composition */}
          {compositions.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">
                Material Composition
              </h2>
              <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Material</th>
                      <th className="px-4 py-3 font-medium text-right">Percentage</th>
                      <th className="px-4 py-3 font-medium text-center">Recycled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {compositions.map((comp: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-300">{comp.MaterialName}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {comp.Percentage ? `${comp.Percentage}%` : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {comp.IsRecycled ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900 p-4 rounded border border-slate-800">
               <span className="text-slate-500 text-sm block">Lead Time</span>
               <span className="text-slate-200 font-medium">
                 {product.LeadTimeDays ? `${product.LeadTimeDays} days` : "Unknown"}
               </span>
             </div>
             {mainEpd?.ExpiryDate && (
               <div className="bg-slate-900 p-4 rounded border border-slate-800">
                <span className="text-slate-500 text-sm block">EPD Expiry</span>
                <span className="text-slate-200 font-medium">
                  {new Date(mainEpd.ExpiryDate).toLocaleDateString()}
                </span>
              </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
