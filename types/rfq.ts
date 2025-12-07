/**
 * TypeScript types for RFQ and Quote data structures
 */

export interface RFQ {
  id: string;
  architect_id: string;
  product_id: string | null;
  project_name: string;
  project_location: string;
  material_specs: {
    quantity?: number;
    unit?: string;
    material_type?: string;
    [key: string]: unknown;
  };
  budget_range: string | null;
  delivery_deadline: string | null;
  required_certifications: string[];
  message: string | null;
  status: 'pending' | 'responded' | 'closed' | 'expired';
  matched_suppliers: string[];
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  tier: 'free' | 'standard' | 'verified';
  certifications: Array<{
    type: string;
    cert_number?: string;
    expiry?: string;
    [key: string]: unknown;
  }>;
  geographic_coverage: string[];
  total_rfqs_received: number;
  total_rfqs_won: number;
  avg_response_time_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quote_amount: number;
  lead_time_days: number;
  message: string | null;
  status: 'submitted' | 'accepted' | 'rejected';
  responded_at: string;
  supplier?: Supplier;
  pdf_url?: string | null;
}

export interface QuoteWithSupplier extends Quote {
  supplier: Supplier;
}

export interface RFQWithQuotes extends RFQ {
  quotes: QuoteWithSupplier[];
}
