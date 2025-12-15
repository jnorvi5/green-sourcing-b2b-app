
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

export interface Product {
  id: string;
  supplier_id: string;
  product_name: string;
  material_type: 'insulation' | 'flooring' | 'cladding' | 'roofing' | 'structural' | 'glazing' | 'finishes' | 'hvac' | 'plumbing' | 'electrical' | 'other';
  description: string | null;
  images: string[] | null;
  epd_id: string | null;
  carbon_footprint_a1a3?: number;
  carbon_footprint_total?: number;
  recycled_content_pct?: number;
  thermal_conductivity?: number;
  certifications: any[] | null; // JSONB
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
