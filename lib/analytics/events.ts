/**
 * PostHog Analytics Events for GreenChainz
 * 
 * Tracks key user actions across supplier and architect flows.
 */

import posthog from 'posthog-js';

// ============================================
// SUPPLIER EVENTS
// ============================================

export const trackSupplierClaimStarted = (data: {
  supplier_id?: string;
  company_name?: string;
  source: 'email' | 'search' | 'direct';
}) => {
  posthog.capture('supplier_claim_started', data);
};

export const trackSupplierClaimCompleted = (data: {
  supplier_id: string;
  company_name: string;
  verification_types: string[]; // ['EPD', 'FSC', etc.]
  time_to_complete_seconds?: number;
}) => {
  posthog.capture('supplier_claim_completed', data);
};

export const trackSupplierProfileViewed = (data: {
  supplier_id: string;
  company_name: string;
  viewer_role?: 'architect' | 'supplier' | 'anonymous';
}) => {
  posthog.capture('supplier_profile_viewed', data);
};

// ============================================
// RFQ (REQUEST FOR QUOTE) EVENTS
// ============================================

export const trackRFQSubmitted = (data: {
  rfq_id: string;
  architect_id: string;
  project_type?: string;
  material_categories: string[];
  supplier_count: number;
  budget_range?: string;
}) => {
  posthog.capture('rfq_submitted', data);
};

export const trackRFQResponseReceived = (data: {
  rfq_id: string;
  supplier_id: string;
  response_time_hours: number;
}) => {
  posthog.capture('rfq_response_received', data);
};

export const trackRFQAccepted = (data: {
  rfq_id: string;
  supplier_id: string;
  architect_id: string;
  estimated_value?: number;
}) => {
  posthog.capture('rfq_accepted', data);
};

// ============================================
// PRODUCT AUDIT EVENTS
// ============================================

export const trackProductAuditRequested = (data: {
  product_id: string;
  product_name: string;
  supplier_id?: string;
  audit_type: 'carbon' | 'certifications' | 'full';
}) => {
  posthog.capture('product_audit_requested', data);
};

export const trackProductAuditCompleted = (data: {
  product_id: string;
  audit_score?: number; // 0-100
  issues_found: number;
  certifications_verified: number;
  processing_time_seconds: number;
}) => {
  posthog.capture('product_audit_completed', data);
};

// ============================================
// SEARCH & DISCOVERY EVENTS
// ============================================

export const trackSearch = (data: {
  query: string;
  results_count: number;
  filters_applied?: Record<string, any>;
  search_type: 'supplier' | 'product' | 'material';
}) => {
  posthog.capture('search_performed', data);
};

export const trackSearchResultClick = (data: {
  query: string;
  result_position: number;
  result_type: 'supplier' | 'product';
  result_id: string;
}) => {
  posthog.capture('search_result_clicked', data);
};

// ============================================
// CERTIFICATION EVENTS
// ============================================

export const trackCertificationVerified = (data: {
  supplier_id: string;
  certification_type: string; // 'EPD', 'FSC', 'LEED', etc.
  verification_source: string;
  auto_verified: boolean;
}) => {
  posthog.capture('certification_verified', data);
};

export const trackCertificationFailed = (data: {
  supplier_id: string;
  certification_type: string;
  failure_reason: string;
}) => {
  posthog.capture('certification_verification_failed', data);
};

// ============================================
// SCRAPING EVENTS
// ============================================

export const trackSupplierScraped = (data: {
  url: string;
  success: boolean;
  data_quality_score?: number;
  fields_extracted: string[];
  contact_email_found: boolean;
}) => {
  posthog.capture('supplier_scraped', data);
};

export const trackScrapingError = (data: {
  url: string;
  error_type: string;
  error_message?: string;
}) => {
  posthog.capture('scraping_error', data);
};

// ============================================
// USER IDENTIFICATION
// ============================================

export const identifyUser = (data: {
  id: string;
  email: string;
  role: 'architect' | 'supplier' | 'admin';
  company_name?: string;
  full_name?: string;
}) => {
  posthog.identify(data.id, {
    email: data.email,
    role: data.role,
    company_name: data.company_name,
    full_name: data.full_name,
  });
};

export const resetUser = () => {
  posthog.reset();
};

// ============================================
// FEATURE FLAGS
// ============================================

export const isFeatureEnabled = (flagKey: string): boolean => {
  return posthog.isFeatureEnabled(flagKey) ?? false;
};

export const getFeatureFlagPayload = (flagKey: string) => {
  return posthog.getFeatureFlagPayload(flagKey);
};
