/**
 * Server-side helper for saving verification data to profiles
 * 
 * This module provides a typed interface for updating supplier verification
 * data in Supabase. It uses the service role client to bypass RLS policies.
 */

import { createClient } from '@supabase/supabase-js';
import type { VerificationPayload } from './types';

/**
 * Creates a Supabase client with service role key for admin operations
 * This bypasses Row Level Security policies
 */
function createServiceClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Saves verification data to a supplier profile
 * 
 * @param payload - Verification data to save
 * @returns Promise that resolves when save is complete
 * @throws Error if validation fails or database operation fails
 */
export async function saveVerification(payload: VerificationPayload): Promise<void> {
  // Validate required fields
  if (!payload.profileId) {
    throw new Error('profileId is required');
  }

  // Create service client
  const supabase = createServiceClient();

  // Build update object with only provided fields
  const updateData: Record<string, string | number | boolean | null> = {};

  if (payload.epdNumber !== undefined) {
    updateData['epd_number'] = payload.epdNumber;
  }

  if (payload.carbonFootprintA1A3 !== undefined) {
    // Validate carbon footprint is a positive number
    if (payload.carbonFootprintA1A3 < 0) {
      throw new Error('carbonFootprintA1A3 must be a positive number');
    }
    updateData['carbon_footprint_a1a3'] = payload.carbonFootprintA1A3;
  }

  if (payload.epdVerified !== undefined) {
    updateData['epd_verified'] = payload.epdVerified;
  }

  if (payload.fscVerified !== undefined) {
    updateData['fsc_verified'] = payload.fscVerified;
  }

  if (payload.bcorpVerified !== undefined) {
    updateData['bcorp_verified'] = payload.bcorpVerified;
  }

  if (payload.leedVerified !== undefined) {
    updateData['leed_verified'] = payload.leedVerified;
  }

  if (payload.epdDataSource !== undefined) {
    updateData['epd_data_source'] = payload.epdDataSource;
  }

  if (payload.verificationSource !== undefined) {
    updateData['verification_source'] = payload.verificationSource;
  }

  // Set verified_at timestamp if verifiedAt is provided
  if (payload.verifiedAt !== undefined) {
    updateData['epd_verified_at'] = payload.verifiedAt.toISOString();
  } else if (payload.epdVerified) {
    // Auto-set verified_at if epdVerified is true and verifiedAt not provided
    updateData['epd_verified_at'] = new Date().toISOString();
  }

  // Perform update
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', payload.profileId);

  if (error) {
    throw new Error(`Failed to save verification data: ${error.message}`);
  }
}
