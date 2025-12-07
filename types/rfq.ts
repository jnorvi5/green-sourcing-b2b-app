/**
 * TypeScript types for RFQ (Request for Quote) system
 */

import { z } from 'zod';

// Database types (matching supabase_production_schema.sql)
export interface RFQ {
  id: string;
  architect_id: string;
  product_id: string | null;
  project_name: string;
  project_location: string;
  material_specs: {
    quantity: number;
    unit: string;
    material_type?: string;
    material_category?: string;
    project_description?: string;
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

export interface RFQWithArchitect extends RFQ {
  architect: {
    id: string;
    email: string;
    full_name: string | null;
    company_name: string | null;
  };
}

export interface RFQResponse {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quote_amount: number;
  lead_time_days: number;
  message: string | null;
  status: 'submitted' | 'accepted' | 'rejected';
  responded_at: string;
  attachment_url?: string;
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
