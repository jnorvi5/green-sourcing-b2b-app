/**
 * Type definitions for Unified Admin Dashboard
 */

export type UserRole = 'admin' | 'supplier' | 'architect';

export interface AdminStats {
  totalUsers: number;
  totalSuppliers: number;
  totalArchitects: number;
  totalRfqs: number;
  pendingVerifications: number;
}

export interface SupplierDashboardStats {
  totalRfqMatches: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  profileCompleteness: number;
}

export interface ArchitectDashboardStats {
  totalRfqs: number;
  pendingResponses: number;
  acceptedQuotes: number;
  savedSuppliers: number;
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

export interface ArchitectRfq {
  id: string;
  project_name: string;
  material_specs: Record<string, unknown>;
  delivery_deadline: string | null;
  created_at: string;
  status: string;
  matched_suppliers: string[];
  response_count: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  role: UserRole;
  email?: string;
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
}

export interface Product {
  id: string;
  supplier_id: string;
  product_name: string;
  material_type: string;
  description: string | null;
}
