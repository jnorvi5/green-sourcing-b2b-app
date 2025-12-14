/**
 * Type definitions for Supplier Dashboard
 */

export interface DashboardStats {
  totalRfqMatches: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  profileCompleteness: number;
}

export interface IncomingRfq {
  id: string;
  project_name: string;
  material_type: string;
  delivery_deadline: string | null;
  match_score: number;
  created_at: string;
  architect: {
    full_name: string | null;
    company_name: string | null;
  };
}

export interface SupplierQuote {
  id: string;
  rfq_id: string;
  quote_amount: number;
  status: 'submitted' | 'accepted' | 'rejected';
  responded_at: string;
  rfq: {
    project_name: string;
  };
}

export interface SupplierProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  description: string | null;
  certifications: Array<{
    type: string;
    cert_number?: string;
    expiry?: string;
  }>;
  geographic_coverage: string[];
  scraped_data?: Array<{
    id: string;
    url: string;
    data_type: string;
    data: any;
    scraped_at: string;
  }>;
}

export interface Product {
  id: string;
  supplier_id: string;
  product_name: string;
  material_type: string;
  description: string | null;
}
