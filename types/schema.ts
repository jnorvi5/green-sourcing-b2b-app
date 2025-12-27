import { z } from 'zod';

export interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  tier: 'free' | 'standard' | 'verified';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: 'active' | 'past_due' | 'canceled' | 'trialing';
  certifications: any[] | null; // JSONB
  geographic_coverage: string[] | null;
  total_rfqs_received: number;
  total_rfqs_won: number;
  avg_response_time_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface EPDData {
  id: string;
  epd_number: string;
  product_name: string;
  manufacturer: string;
  gwp_a1a3_kgco2e?: number;
  gwp_total_kgco2e?: number;
  declared_unit: string;
  pcr_reference?: string;
  validity_start: string;
  validity_end: string;
  geographic_scope: string[] | null;
  data_source: string;
  raw_xml?: string;
  created_at: string;
  updated_at: string;
}

export interface LEEDContribution {
  low_carbon_procurement: boolean; // 2 points if GWP < baseline
  sourcing_raw_materials: boolean; // 1 point if regional
  material_transparency: boolean; // 1 point for Verified EPD
  total_points: number;
}

export interface ScorecardData {
  // Risk & Verification
  circularity_recyclable_pct?: number; // % Recyclable at end-of-life
  circularity_recovery_plan?: boolean; // Is there a recovery plan?
  chain_of_custody?: string; // e.g., 'ISCC PLUS', 'FSC'
  chain_of_custody_proof?: string; // URL to certificate
  health_transparency_type?: 'HPD' | 'Declare' | 'Cradle2Cradle' | 'None';
  hpd_url?: string;
  red_list_free?: boolean;

  // LEED v5 specifics
  leed_contribution?: LEEDContribution;

  // Data Trust (Traffic Light Source)
  data_source_gwp?: 'epd' | 'manufacturer' | 'missing';
  data_source_circularity?: 'recovery_plan' | 'manufacturer' | 'missing';
}

export interface Product {
  id: string;
  supplier_id: string;
  product_name: string;
  material_type: 'insulation' | 'flooring' | 'cladding' | 'roofing' | 'structural' | 'glazing' | 'finishes' | 'hvac' | 'plumbing' | 'electrical' | 'other';
  description: string | null;
  images: string[] | null;
  epd_id: string | null;

  // Core Metrics (can be populated from EPDData or manual override)
  carbon_footprint_a1a3?: number;
  carbon_footprint_total?: number;
  recycled_content_pct?: number;
  post_consumer_pct?: number; // [NEW]
  pre_consumer_pct?: number;  // [NEW]
  thermal_conductivity?: number;

  certifications: any[] | null; // Keep generic or type strictly if needed
  sustainability_data: ScorecardData | null; // [UPDATED] Typed Scorecard Data

  price_per_unit?: number;
  unit_type: string;
  lead_time_days?: number;
  min_order_quantity?: number;
  created_at: string;
  updated_at: string;

  // Relations
  suppliers?: Supplier;
  epd_data?: EPDData;
}

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  supplier_id: z.string().uuid(),
  product_name: z.string(),
  material_type: z.enum(['insulation', 'flooring', 'cladding', 'roofing', 'structural', 'glazing', 'finishes', 'hvac', 'plumbing', 'electrical', 'other']),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  epd_id: z.string().uuid().nullable().optional(),

  carbon_footprint_a1a3: z.number().optional(),
  carbon_footprint_total: z.number().optional(),
  recycled_content_pct: z.number().optional(),
  post_consumer_pct: z.number().optional(),
  pre_consumer_pct: z.number().optional(),
  thermal_conductivity: z.number().optional(),

  certifications: z.array(z.any()).nullable().optional(),

  // JSONB validation for ScorecardData
  sustainability_data: z.object({
    circularity_recyclable_pct: z.number().optional(),
    circularity_recovery_plan: z.boolean().optional(),
    chain_of_custody: z.string().optional(),
    chain_of_custody_proof: z.string().optional(),
    health_transparency_type: z.enum(['HPD', 'Declare', 'Cradle2Cradle', 'None']).optional(),
    hpd_url: z.string().optional(),
    red_list_free: z.boolean().optional(),
    leed_contribution: z.object({
      low_carbon_procurement: z.boolean(),
      sourcing_raw_materials: z.boolean(),
      material_transparency: z.boolean(),
      total_points: z.number(),
    }).optional(),
    data_source_gwp: z.enum(['epd', 'manufacturer', 'missing']).optional(),
    data_source_circularity: z.enum(['recovery_plan', 'manufacturer', 'missing']).optional(),
  }).nullable().optional(),

  price_per_unit: z.number().optional(),
  unit_type: z.string(),
  lead_time_days: z.number().optional(),
  min_order_quantity: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
