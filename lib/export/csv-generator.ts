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
 * - Prevents CSV injection attacks
 */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Prevent CSV injection by prefixing with single quote if starts with dangerous char
  const needsInjectionProtection = CSV_INJECTION_CHARS.some(char => 
    stringValue.startsWith(char)
  );

  let escapedValue = stringValue;

  if (needsInjectionProtection) {
    // Prefix with single quote to treat as literal text in Excel/Sheets
    escapedValue = "'" + escapedValue;
  }

  // Check if value needs quoting (contains comma, quote, or newline)
  const needsQuoting = /[",\n\r]/.test(escapedValue);

  if (needsQuoting) {
    // Escape existing quotes by doubling them
    escapedValue = escapedValue.replace(/"/g, '""');
    // Wrap in quotes
    escapedValue = `"${escapedValue}"`;
  }

  return escapedValue;
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
