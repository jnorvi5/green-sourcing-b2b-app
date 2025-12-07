/**
 * TypeScript types for Admin Certification Verification
 * Strict typing with no 'any' types
 */

/**
 * Supplier with pending certification
 */
export interface CertificationPendingSupplier {
  id: string;
  company_name: string;
  cert_type: string | null;
  cert_pdf_url: string;
  cert_uploaded_at: string | null;
  cert_verified: boolean;
  cert_verification_date: string | null;
  cert_rejection_reason: string | null;
  user_id: string;
  users: {
    email: string;
    full_name: string | null;
  } | null;
}

/**
 * Verification statistics for dashboard cards
 */
export interface VerificationStats {
  totalPending: number;
  verifiedToday: number;
  rejectedToday: number;
}

/**
 * Action result for verify/reject operations
 */
export interface CertificationActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Input for verification action
 */
export interface VerifyInput {
  supplierId: string;
}

/**
 * Input for rejection action
 */
export interface RejectInput {
  supplierId: string;
  reason: string;
}

/**
 * Email notification data
 */
export interface CertificationEmailData {
  supplierEmail: string;
  supplierName: string;
  companyName: string;
  certType: string;
}

/**
 * Search/filter parameters
 */
export interface CertificationFilters {
  searchTerm: string;
  showVerified: boolean;
  showRejected: boolean;
}
