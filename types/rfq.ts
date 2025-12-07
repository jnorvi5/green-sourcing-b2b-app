/**
 * RFQ (Request for Quote) Type Definitions
 * 
 * Types for RFQ data structures used throughout the application.
 * Based on supabase_production_schema.sql
 */

import { z } from 'zod';

/**
 * RFQ status enum matching database type
 */
export type RfqStatus = 'pending' | 'responded' | 'closed' | 'expired';

/**
 * RFQ response status enum matching database type
 */
export type RfqResponseStatus = 'submitted' | 'accepted' | 'rejected';

/**
 * Material type enum matching database type
 */
export type MaterialType = 
  | 'insulation'
  | 'flooring'
  | 'cladding'
  | 'roofing'
  | 'structural'
  | 'glazing'
  | 'finishes'
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'other';

/**
 * Material specifications stored in RFQ material_specs JSONB field
 */
export interface MaterialSpecs {
  quantity: number;
  unit: string;
  material_type: MaterialType;
  material_category?: string;
  project_description?: string;
  [key: string]: unknown; // Allow additional custom fields
}

/**
 * User profile (architect/buyer) data
 */
export interface UserProfile {
  id: string;
  email: string;
  role: 'architect' | 'supplier' | 'admin';
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * RFQ data from database
 */
export interface Rfq {
  id: string;
  architect_id: string;
  product_id: string | null;
  project_name: string;
  project_location: string;
  material_specs: MaterialSpecs;
  budget_range: string | null;
  delivery_deadline: string | null; // ISO date string
  required_certifications: string[];
  message: string | null;
  status: RfqStatus;
  matched_suppliers: string[]; // Array of supplier UUIDs
  created_at: string;
  updated_at: string;
}

/**
 * Supplier data
 */
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

/**
 * RFQ with joined user profile data
 */
export interface RfqWithArchitect extends Rfq {
  users: UserProfile | null;
}

/**
 * RFQ response data
 */
export interface RfqResponse {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quote_amount: number;
  lead_time_days: number;
  message: string | null;
  status: RfqResponseStatus;
  responded_at: string;
  supplier?: Supplier;
  pdf_url?: string | null;
}

/**
 * Extended RFQ data with response information for supplier view
 */
export interface RfqWithResponse extends RfqWithArchitect {
  rfq_response: RfqResponse | null;
  is_new: boolean;
  match_score?: number;
}

/**
 * Filter options for RFQ list
 */
export type RfqFilter = 'all' | 'new' | 'quoted' | 'closed';

/**
 * Sort options for RFQ list
 */
export type RfqSort = 'newest' | 'deadline' | 'match_score';

/**
 * Types for compatibility with older code
 */
export interface RFQ extends Rfq {}

export interface RFQWithArchitect extends Rfq {
  architect: {
    id: string;
    email: string;
    full_name: string | null;
    company_name: string | null;
  };
}

export interface RFQResponse extends RfqResponse {}

export interface Quote extends RfqResponse {}

export interface QuoteWithSupplier extends RfqResponse {
  supplier: Supplier;
}

export interface RFQWithQuotes extends RFQ {
  quotes: QuoteWithSupplier[];
  attachment_url?: string;
}

/**
 * Material category options for form
 */
export type MaterialCategory = 
  | 'Lumber'
  | 'Insulation'
  | 'Concrete'
  | 'Steel'
  | 'Flooring'
  | 'Other';

/**
 * Unit type options for form
 */
export type UnitType = 
  | 'sqft'
  | 'linear ft'
  | 'tons'
  | 'units';

/**
 * Budget range options for form
 */
export type BudgetRange = 
  | '<$10k'
  | '$10k-50k'
  | '$50k-100k'
  | '$100k+';

/**
 * RFQ Form Data structure
 */
export interface RFQFormData {
  project_name: string;
  project_description: string;
  material_category: MaterialCategory;
  quantity: number;
  unit: UnitType;
  budget_range?: BudgetRange;
  deadline: string; // ISO date string
  location: string;
}

/**
 * API Response for RFQ creation
 */
export interface RFQCreateResponse {
  success: boolean;
  rfq_id?: string;
  message?: string;
  error?: string;
}

// Zod validation schemas
export const QuoteSubmissionSchema = z.object({
  rfq_id: z.string().uuid('Invalid RFQ ID'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  lead_time: z.string().min(1, 'Lead time is required'),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  pdf_file: z.instanceof(File).optional(),
});

export type QuoteSubmission = z.infer<typeof QuoteSubmissionSchema>;

export const QuoteApiRequestSchema = z.object({
  rfq_id: z.string().uuid(),
  price: z.number().positive(),
  lead_time: z.string().min(1),
  notes: z.string().max(2000).optional(),
  pdf_url: z.string().url().optional(),
});

export type QuoteApiRequest = z.infer<typeof QuoteApiRequestSchema>;
