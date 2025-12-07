/**
 * Type definitions for verification provenance
 */

/**
 * Known verification data sources
 */
export type VerificationSource = 
  | 'EPD International'
  | 'IBU'
  | 'UL Environment'
  | 'NSF'
  | 'FSC'
  | 'B Lab'
  | 'USGBC'
  | 'Manual'
  | 'API Import';

/**
 * Payload for saving verification data
 */
export interface VerificationPayload {
  profileId: string;
  epdNumber?: string;
  carbonFootprintA1A3?: number;
  source?: VerificationSource;
  epdVerified?: boolean;
  fscVerified?: boolean;
  bcorpVerified?: boolean;
  leedVerified?: boolean;
  verifiedAt?: Date;
  epdDataSource?: string;
  verificationSource?: string;
}

/**
 * Verification data stored in profiles
 */
export interface VerificationData {
  epd_number: string | null;
  epd_verified: boolean;
  epd_verified_at: string | null;
  epd_data_source: string | null;
  carbon_footprint_a1a3: number | null;
  fsc_verified: boolean;
  bcorp_verified: boolean;
  leed_verified: boolean;
  verification_source: string | null;
}
