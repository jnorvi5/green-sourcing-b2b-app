/**
 * Export-related types for GreenChainz Reporting & Export Layer
 */

// Source product interface (from mock data)
export interface MockProduct {
  id: number;
  name: string;
  supplier: string;
  description: string;
  imageUrl: string;
  certifications: string[];
  epd: {
    gwp: number; // Global Warming Potential in kg CO2e
  };
  recycledContent: number; // Percentage
  price?: number;
  priceUnit?: string;
}

// CSV Export types
export interface ProjectSpecRow {
  productName: string;
  supplier: string;
  sku: string;
  epdLink: string | null;
  carbonFootprint: number | null;
  certificationStatus: string;
}

// PDF/ESG Report types
export interface ProductExportData {
  id: number;
  name: string;
  supplier: string;
  carbonFootprint: number;
  recycledContent: number;
  certifications: string[];
}

export interface ESGReportSummary {
  totalProducts: number;
  totalEmbodiedCarbon: number;
  averageRecycledContent: number;
}

export interface ESGReportMetadata {
  reportId: string;
  generatedAt: Date;
}

export interface ESGReportData {
  products: ProductExportData[];
  summary: ESGReportSummary;
  metadata: ESGReportMetadata;
}

// Autodesk APS types
export interface APSMaterialProperties {
  GC_EPD_Number: string;
  GC_Carbon_Footprint_A1A3: number;
  GC_Recycled_Content: number;
  GC_Certifications: string;
  Thermal_Resistance_R?: number;
}

export interface APSMaterialMetadata {
  greenchainzUrl: string;
  lastVerified: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export interface APSMaterial {
  id: string;
  name: string;
  manufacturer: string;
  properties: APSMaterialProperties;
  metadata: APSMaterialMetadata;
}

export interface APSSummary {
  totalProducts: number;
  totalEmbodiedCarbon: number;
  averageRecycledContent: number;
}

export interface APSManifest {
  schemaVersion: string;
  generator: string;
  generatedAt: string;
  materials: APSMaterial[];
  summary: APSSummary;
}

// Export request/response types
export interface ExportError {
  error: string;
  details?: string;
}
