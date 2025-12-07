/**
 * RFQ (Request for Quote) Type Definitions
 * 
 * Types for RFQ data structures used throughout the application.
 * Based on supabase_production_schema.sql
 */

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
 * Type definitions for RFQ (Request for Quote) system
 */

export type MaterialCategory = 
  | 'Lumber'
  | 'Insulation'
  | 'Concrete'
  | 'Steel'
  | 'Flooring'
  | 'Other';

export type UnitType = 
  | 'sqft'
  | 'linear ft'
  | 'tons'
  | 'units';

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
