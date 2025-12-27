import React from "react";
import { Scorecard } from "@/app/components/Scorecard";
import { Product } from "@/types/schema";

export default function ScorecardDemoPage() {
  const mockPlatinumProduct: Product = {
    id: "123",
    supplier_id: "sup-001",
    product_name: "Low-Carbon Type 1L Cement",
    material_type: "structural",
    description: "High performance green cement for structural applications.",
    images: [],
    epd_id: "epd-123",
    carbon_footprint_a1a3: 140, // kg CO2e
    recycled_content_pct: 35,
    unit_type: "m3",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suppliers: {
      id: "sup-001",
      user_id: "user-001",
      company_name: "GreenBuild Concrete Co.",
      tier: "verified",
      certifications: [],
      geographic_coverage: [],
      total_rfqs_received: 10,
      total_rfqs_won: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    sustainability_data: {
      circularity_recyclable_pct: 90,
      circularity_recovery_plan: true,
      chain_of_custody: "ISCC PLUS Certified",
      chain_of_custody_proof: "https://example.com/iscc.pdf",
      health_transparency_type: "HPD",
      hpd_url: "https://example.com/hpd",
      red_list_free: true,
      data_source_gwp: "epd",
      data_source_circularity: "recovery_plan",
      leed_contribution: {
        low_carbon_procurement: true,
        sourcing_raw_materials: false, // Calculated by ZIP at runtime usually
        material_transparency: true,
        total_points: 3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          GreenChainz Compliance Dashboard Demo
        </h1>
        <Scorecard product={mockPlatinumProduct} />

        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
          <p className="font-semibold">ℹ️ Revit Plugin Simulation</p>
          <p className="mt-1">
            "Current Swap: -12.4 Tons Embodied Carbon | +
            {
              mockPlatinumProduct.sustainability_data?.leed_contribution
                ?.total_points
            }{" "}
            LEED Points toward Certification."
          </p>
        </div>
      </div>
    </div>
  );
}
