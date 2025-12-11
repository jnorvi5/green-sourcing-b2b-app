/**
 * ESG Report PDF Export Endpoint
 * GET /api/export/esg-report?productIds=1,2,3
 * 
 * Generates a branded PDF sustainability profile document
 */

import { NextResponse } from 'next/server';
import { generatePdf, generateEsgReportFilename } from '../../../../lib/export/pdf-generator';
import { getProductsByIds, getAllProducts } from '../../../../lib/export/product-data';
import type { MockProduct } from '../../../../lib/export/types';

// Prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Parses and validates product IDs from query string
 * @param productIdsParam Comma-separated product IDs or undefined
 * @returns Array of valid numeric IDs or null if invalid
 */
function parseProductIds(productIdsParam: string | null): number[] | null {
  if (!productIdsParam) {
    return null;
  }

  const ids: number[] = [];
  const parts = productIdsParam.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const id = parseInt(trimmed, 10);
    
    // Validate: must be a positive integer
    if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
      return null; // Invalid ID found
    }
    
    ids.push(id);
  }

  return ids;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    let products: MockProduct[];

    if (productIdsParam) {
      // Parse and validate product IDs
      const productIds = parseProductIds(productIdsParam);

      if (productIds === null) {
        return NextResponse.json(
          { error: 'Invalid product IDs. Must be comma-separated positive integers.' },
          { status: 400 }
        );
      }

      if (productIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid product IDs provided.' },
          { status: 400 }
        );
      }

      // Get products by IDs
      products = getProductsByIds(productIds);

      // Check if any requested products were not found
      if (products.length === 0) {
        return NextResponse.json(
          { error: 'No products found for the specified IDs.' },
          { status: 404 }
        );
      }

      // Log if some IDs weren't found (but still return found ones)
      if (products.length < productIds.length) {
        const foundIds = new Set(products.map(p => p.id));
        const missingIds = productIds.filter(id => !foundIds.has(id));
        console.warn(`Some product IDs not found: ${missingIds.join(', ')}`);
      }
    } else {
      // No product IDs specified - return all products
      products = getAllProducts();

      if (products.length === 0) {
        return NextResponse.json(
          { error: 'No products available for export.' },
          { status: 404 }
        );
      }
    }

    // Generate PDF content
    const pdfBuffer = await generatePdf(products);
    const filename = generateEsgReportFilename();

    // Return PDF response with proper headers
    // Use ArrayBuffer slice for NextResponse compatibility
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset, 
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer;
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { 
        error: 'Failed to generate PDF export',
        details: process.env['NODE_ENV'] === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
