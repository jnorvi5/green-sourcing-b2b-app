/**
 * Autodesk Platform Services (APS) Manifest Builder
 * Generates APS Data Exchange compatible JSON for Revit integration
 */

import type { 
  MockProduct, 
  APSManifest, 
  APSMaterial, 
  APSSummary,
  APSMaterialProperties,
  APSMaterialMetadata,
} from '../../export/types';

// Constants
const SCHEMA_VERSION = '1.0.0';
const GENERATOR = 'GreenChainz';
const BASE_URL = 'https://greenchainz.com';

/**
 * Generates an EPD number for the product
 * In production, this would come from actual EPD database
 */
function generateEpdNumber(productId: number): string {
  return `EPD-GC-P-${String(productId).padStart(5, '0')}`;
}

/**
 * Converts a MockProduct to APS Material Properties
 */
function buildMaterialProperties(product: MockProduct): APSMaterialProperties {
  return {
    GC_EPD_Number: generateEpdNumber(product.id),
    GC_Carbon_Footprint_A1A3: product.epd?.gwp ?? 0,
    GC_Recycled_Content: product.recycledContent ?? 0,
    GC_Certifications: product.certifications?.join(',') ?? '',
    // Thermal resistance is placeholder - would come from actual product data
    Thermal_Resistance_R: product.name.toLowerCase().includes('insulation') ? 3.7 : undefined,
  };
}

/**
 * Builds metadata for an APS material
 */
function buildMaterialMetadata(productId: number): APSMaterialMetadata {
  const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString().substring(0, 10);
  
  return {
    greenchainzUrl: `${BASE_URL}/products/${productId}`,
    lastVerified: today,
    verificationStatus: 'verified',
  };
}

/**
 * Converts a MockProduct to an APS Material
 */
export function productToApsMaterial(product: MockProduct): APSMaterial {
  return {
    id: `gc-product-${product.id}`,
    name: product.name,
    manufacturer: product.supplier,
    properties: buildMaterialProperties(product),
    metadata: buildMaterialMetadata(product.id),
  };
}

/**
 * Calculates summary statistics for the APS manifest
 */
export function calculateApsSummary(products: MockProduct[]): APSSummary {
  const totalProducts = products.length;
  
  const totalEmbodiedCarbon = products.reduce(
    (sum, p) => sum + (p.epd?.gwp ?? 0), 
    0
  );
  
  const averageRecycledContent = totalProducts > 0
    ? products.reduce((sum, p) => sum + (p.recycledContent ?? 0), 0) / totalProducts
    : 0;

  return {
    totalProducts,
    totalEmbodiedCarbon: Math.round(totalEmbodiedCarbon * 10) / 10,
    averageRecycledContent: Math.round(averageRecycledContent * 10) / 10,
  };
}

/**
 * Builds a complete APS-compatible manifest from products
 */
export function buildApsManifest(products: MockProduct[]): APSManifest {
  const materials = products.map(productToApsMaterial);
  const summary = calculateApsSummary(products);

  return {
    schemaVersion: SCHEMA_VERSION,
    generator: GENERATOR,
    generatedAt: new Date().toISOString(),
    materials,
    summary,
  };
}

/**
 * Validates that a product has the minimum required data for APS export
 */
export function validateProductForAps(product: MockProduct): boolean {
  return Boolean(
    product.id &&
    product.name &&
    product.supplier &&
    product.epd
  );
}

/**
 * Filters products to only include those valid for APS export
 */
export function filterValidProducts(products: MockProduct[]): MockProduct[] {
  return products.filter(validateProductForAps);
}
