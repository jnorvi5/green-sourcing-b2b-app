/**
 * CSV Generator Utility for GreenChainz Project Spec Exports
 * Generates Revit/Excel compatible CSV files with proper escaping
 */

import type { MockProduct, ProjectSpecRow } from './types';

// CSV injection prevention - escape formulas that start with dangerous characters
const CSV_INJECTION_CHARS = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Escapes a value for safe CSV inclusion
 * - Handles special characters (commas, quotes, newlines)
 * - Prevents CSV injection attacks using defense-in-depth approach
 * 
 * Security measures:
 * 1. Prefix dangerous characters with a single quote (Excel/Sheets will treat as literal)
 * 2. Always quote values that contain dangerous characters to prevent formula execution
 * 3. Double-escape any existing quotes
 */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);

  // Check if value starts with dangerous characters that could trigger formula execution
  const needsInjectionProtection = CSV_INJECTION_CHARS.some(char => 
    stringValue.startsWith(char)
  );

  if (needsInjectionProtection) {
    // Defense-in-depth: prefix with space and single quote
    // The space prevents formula execution in most spreadsheet apps
    // The single quote tells Excel/Sheets to treat as literal text
    stringValue = " '" + stringValue;
  }

  // Escape existing quotes by doubling them
  stringValue = stringValue.replace(/"/g, '""');

  // Always wrap in quotes if contains dangerous chars, commas, quotes, or newlines
  // This provides additional protection layer as quoted values are less likely to be executed
  const needsQuoting = needsInjectionProtection || /[",\n\r]/.test(stringValue);

  if (needsQuoting) {
    // Wrap in quotes
    stringValue = `"${stringValue}"`;
  }

  return stringValue;
}

/**
 * Generates a SKU from product ID if not available
 */
export function generateSku(productId: number, productName: string): string {
  // Create SKU: GC-{ID}-{First 3 chars of name uppercase}
  const namePrefix = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  return `GC-${productId}-${namePrefix || 'PRD'}`;
}

/**
 * Generates an EPD URL placeholder based on product ID
 * In production, this would come from actual EPD database
 */
export function generateEpdLink(productId: number): string | null {
  // Placeholder URL - in production would link to actual EPD document
  return `https://greenchainz.com/epd/product-${productId}`;
}

/**
 * Converts a MockProduct to a ProjectSpecRow for CSV export
 */
export function productToSpecRow(product: MockProduct): ProjectSpecRow {
  return {
    productName: product.name,
    supplier: product.supplier,
    sku: generateSku(product.id, product.name),
    epdLink: generateEpdLink(product.id),
    carbonFootprint: product.epd?.gwp ?? null,
    certificationStatus: product.certifications?.length > 0 
      ? product.certifications.join(', ') 
      : 'None',
  };
}

/**
 * CSV header row matching the required columns
 */
const CSV_HEADERS = [
  'Product Name',
  'Supplier',
  'SKU',
  'EPD Link',
  'Carbon Footprint (kgCO₂e)',
  'Certification Status',
];

/**
 * Converts a ProjectSpecRow to a CSV row string
 */
function specRowToCsvLine(row: ProjectSpecRow): string {
  const values = [
    escapeCsvValue(row.productName),
    escapeCsvValue(row.supplier),
    escapeCsvValue(row.sku),
    escapeCsvValue(row.epdLink),
    escapeCsvValue(row.carbonFootprint),
    escapeCsvValue(row.certificationStatus),
  ];
  return values.join(',');
}

/**
 * Generates complete CSV content from an array of products
 */
export function generateCsv(products: MockProduct[]): string {
  // Convert products to spec rows
  const specRows = products.map(productToSpecRow);

  // Build CSV content
  const headerLine = CSV_HEADERS.map(h => escapeCsvValue(h)).join(',');
  const dataLines = specRows.map(specRowToCsvLine);

  // Combine with newlines (use \r\n for better Excel compatibility)
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Generates the filename for project spec export
 */
export function generateProjectSpecFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `greenchainz-project-specs-${date}.csv`;
}
