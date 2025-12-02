/**
 * TypeScript types for Autodesk Platform Services (APS) integration
 */

// ============================================
// Database Types
// ============================================

export interface AutodeskConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  autodesk_user_id?: string;
  autodesk_email?: string;
  created_at: string;
  updated_at: string;
}

export interface AutodeskExport {
  id: string;
  user_id: string;
  product_id?: string;
  revit_project_urn: string;
  revit_material_id?: string;
  material_name: string;
  export_status: 'pending' | 'success' | 'failed';
  error_message?: string;
  exported_at: string;
}

export interface BIMAnalysis {
  id: string;
  user_id: string;
  model_urn: string;
  model_name?: string;
  total_carbon_kg?: number;
  analysis_status: 'processing' | 'completed' | 'failed';
  analysis_data?: AnalysisData;
  alternatives?: CarbonAlternative[];
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface MaterialExportRequest {
  product_id: string;
  revit_project_urn: string;
}

export interface MaterialExportResponse {
  success: boolean;
  material_id?: string;
  export_id: string;
  error?: string;
}

export interface BIMAnalysisRequest {
  model_urn: string;
  model_name?: string;
}

export interface BIMAnalysisResponse {
  analysis_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_carbon_kg?: number;
  materials?: MaterialAnalysis[];
  alternatives?: CarbonAlternative[];
  error?: string;
}

export interface ConnectionStatusResponse {
  connected: boolean;
  autodesk_user_id?: string;
  autodesk_email?: string;
  expires_at?: string;
}

// ============================================
// Material Export Types
// ============================================

export interface MaterialProperties {
  name: string;
  manufacturer: string;
  epd_number?: string;
  carbon_footprint: number; // kg CO2e per declared unit
  carbon_footprint_unit: string; // e.g., "kg CO2e/kg"
  thermal_conductivity?: number; // W/m·K
  r_value?: number; // m²·K/W
  recycled_content_percent?: number;
  certifications: string[];
  density?: number; // kg/m³
  compressive_strength?: number; // MPa
  description?: string;
}

export interface RevitMaterialData {
  name: string;
  category: string;
  properties: MaterialProperties;
  appearance?: {
    color?: string;
    texture?: string;
  };
}

// ============================================
// BIM Analysis Types
// ============================================

export interface AnalysisData {
  materials: MaterialAnalysis[];
  breakdown: CarbonBreakdown;
  metadata: ModelMetadata;
}

export interface MaterialAnalysis {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  carbon_per_unit: number; // kg CO2e per unit
  total_carbon: number; // kg CO2e
  matched_product_id?: string;
  match_confidence?: number; // 0-1
  match_type?: 'exact' | 'fuzzy' | 'category' | 'none';
}

export interface CarbonBreakdown {
  total_kg: number;
  by_category: Record<
    string,
    {
      carbon_kg: number;
      percentage: number;
    }
  >;
  top_contributors: Array<{
    material_name: string;
    carbon_kg: number;
    percentage: number;
  }>;
}

export interface CarbonAlternative {
  original_material: string;
  original_carbon_kg: number;
  alternative_name: string;
  alternative_carbon_kg: number;
  carbon_reduction_kg: number;
  carbon_reduction_percent: number;
  product_id: string;
  cost_impact?: 'lower' | 'similar' | 'higher';
}

export interface ModelMetadata {
  model_urn: string;
  model_name?: string;
  file_type?: string;
  total_elements?: number;
  extracted_materials_count: number;
  matched_materials_count: number;
  unmatched_materials_count: number;
}

// ============================================
// Autodesk API Types
// ============================================

export interface AutodeskTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

export interface AutodeskUserInfo {
  userId: string;
  userName: string;
  emailId: string;
  firstName: string;
  lastName: string;
}

export interface ModelDerivativeManifest {
  urn: string;
  derivatives: Array<{
    name: string;
    hasThumbnail: string;
    status: string;
    progress: string;
    outputType: string;
    children?: Array<{
      guid: string;
      type: string;
      role: string;
      name: string;
    }>;
  }>;
}

export interface ModelProperties {
  data: {
    type: string;
    collection: Array<{
      objectid: number;
      name: string;
      externalId: string;
      properties: Record<string, unknown>;
    }>;
  };
}

// ============================================
// Material Matching Types
// ============================================

export interface MaterialMatch {
  product_id: string;
  product_name: string;
  category: string;
  carbon_footprint: number;
  confidence_score: number; // 0-1
  match_type: 'exact' | 'fuzzy' | 'category';
  match_reasons: string[];
}

export interface FuzzySearchOptions {
  threshold?: number; // 0-1, default 0.6
  max_results?: number; // default 3
  category_filter?: string;
  max_carbon?: number;
}

// ============================================
// OAuth Types
// ============================================

export interface OAuthState {
  user_id: string;
  redirect_uri: string;
  timestamp: number;
}

export interface OAuthCallbackParams {
  code: string;
  state: string;
}

// ============================================
// Error Types
// ============================================

export class AutodeskAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public autodeskError?: unknown
  ) {
    super(message);
    this.name = 'AutodeskAPIError';
  }
}

export class TokenExpiredError extends Error {
  constructor(message = 'Autodesk access token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class MaterialMatchError extends Error {
  constructor(
    message: string,
    public materialName?: string
  ) {
    super(message);
    this.name = 'MaterialMatchError';
  }
}
