/**
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
