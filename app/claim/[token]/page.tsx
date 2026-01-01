import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClaimForm from "./ClaimForm";

export default async function ClaimTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();
  const { token } = params;

  // Fetch supplier profile
  const { data: supplier, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      company_name,
      products (id, epd_id)
    `
    )
    .eq("claim_token", token)
    .single();

  if (error || !supplier) {
    console.error("Claim page fetch error:", error);
    return notFound();
  }

  // Calculate counts
  const products = supplier.products || [];
  const productCount = products.length;

  // Count products with EPDs
  const epdCount = products.filter(
    (p: { epd_id: string | null }) => p.epd_id
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="h-2 bg-green-600 w-full"></div>
        <ClaimForm
          supplierName={supplier.company_name || "your company"}
          productCount={productCount}
          epdCount={epdCount}
          token={token}
        />
      </div>
      <p className="mt-8 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} GreenChainz. All rights reserved.
      </p>
    </div>
  );
}
