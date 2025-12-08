/**
 * Zod validation schemas for EPD International API sync
 */

import { z } from 'zod';

/**
 * Schema for EPD International API response (XML or JSON)
 * Supporting both ILCD/EPD XML and JSON formats
 */
export const epdApiResponseSchema = z.object({
  uuid: z.string().optional(),
  epd_number: z.string().optional(),
  registrationNumber: z.string().optional(),
  registration_number: z.string().optional(),
  
  name: z.string().optional(),
  product_name: z.string().optional(),
  productName: z.string().optional(),
  
  manufacturer: z.union([
    z.string(),
    z.object({
      name: z.string().optional(),
    }),
  ]).optional(),
  
  // Carbon footprint data (various naming conventions)
  gwp_a1a3: z.number().optional(),
  gwp_fossil_a1a3: z.number().optional(),
  gwpA1A3: z.number().optional(),
  impacts: z.object({
    gwp: z.object({
      a1a3: z.number().optional(),
      fossil: z.object({
        a1a3: z.number().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
  
  // Recycled content
  recycled_content_pct: z.number().min(0).max(100).optional(),
  recycledContent: z.number().min(0).max(100).optional(),
  recycled_content: z.number().min(0).max(100).optional(),
  
  // Certifications
  certifications: z.union([
    z.array(z.string()),
    z.array(z.object({
      name: z.string(),
      level: z.string().optional(),
    })),
  ]).optional(),
  
  // Validity dates
  valid_from: z.string().optional(),
  validFrom: z.string().optional(),
  validity_start: z.string().optional(),
  validityStart: z.string().optional(),
  publishedDate: z.string().optional(),
  
  valid_until: z.string().optional(),
  validUntil: z.string().optional(),
  validity_end: z.string().optional(),
  validityEnd: z.string().optional(),
  
  // Additional fields
  declared_unit: z.string().optional(),
  declaredUnit: z.union([
    z.string(),
    z.object({
      value: z.number().optional(),
      unit: z.string().optional(),
    }),
  ]).optional(),
  
  pcr_reference: z.string().optional(),
  pcr: z.union([
    z.string(),
    z.object({
      name: z.string().optional(),
      version: z.string().optional(),
    }),
  ]).optional(),
  
  geographic_scope: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional(),
  geographicScope: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional(),
});

export type EPDApiResponse = z.infer<typeof epdApiResponseSchema>;

/**
 * Schema for normalized EPD data to insert into database
 */
export const normalizedEpdSchema = z.object({
  epd_number: z.string(),
  product_name: z.string(),
  manufacturer: z.string(),
  gwp_fossil_a1a3: z.number().nullable(),
  recycled_content_pct: z.number().min(0).max(100).nullable(),
  certifications: z.array(z.string()),
  valid_from: z.string(), // ISO date string
  valid_until: z.string(), // ISO date string
  declared_unit: z.string().nullable(),
  pcr_reference: z.string().nullable(),
  geographic_scope: z.array(z.string()),
  data_source: z.string(),
  raw_data: z.record(z.unknown()),
});

export type NormalizedEPD = z.infer<typeof normalizedEpdSchema>;

/**
 * Schema for EPD sync API response
 */
export const epdSyncResponseSchema = z.object({
  total_fetched: z.number(),
  new_inserts: z.number(),
  updates: z.number(),
  errors: z.array(z.string()),
});

export type EPDSyncResponse = z.infer<typeof epdSyncResponseSchema>;
