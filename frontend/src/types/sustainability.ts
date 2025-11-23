// Core definitions for GreenChainz Sustainability Data
export type CertificationType = 'LEED' | 'BREEAM' | 'FSC' | 'GreenCircle' | 'EPD';

export interface Certification {
  id: string;
  type: CertificationType;
  name: string;
  issuing_body: string;
  certificate_number: string;
  expiry_date: string; // ISO Date
  document_url: string;
  verified: boolean;
}

export interface EPDData {
  id: string;
  gwp: number; // Global Warming Potential (kg CO2e)
  recycled_content: number; // Percentage
  water_usage: number; // m3
  functional_unit: string; // e.g., "per m2"
  source_api: 'International EPD System' | 'WAP Sustainability' | 'Manual';
}

// This ensures every product we list has a "Green Data" slot
export interface SustainableProductMetadata {
  certifications: Certification[];
  epd_data?: EPDData;
  audit_trail: string[]; // Blockchain-style verification log
}
