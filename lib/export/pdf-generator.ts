/**
 * PDF Generator Utility for GreenChainz ESG Reports
 * Generates branded sustainability profile documents using PDFKit
 */

import { v4 as uuidv4 } from 'uuid';
import type { MockProduct, ESGReportData, ProductExportData, ESGReportSummary } from './types';

// PDFKit document interface for type safety
interface PDFDoc {
  fillColor(color: string): PDFDoc;
  strokeColor(color: string): PDFDoc;
  rect(x: number, y: number, w: number, h: number): PDFDoc;
  fill(): PDFDoc;
  stroke(): PDFDoc;
  lineWidth(width: number): PDFDoc;
  moveTo(x: number, y: number): PDFDoc;
  lineTo(x: number, y: number): PDFDoc;
  fontSize(size: number): PDFDoc;
  text(text: string, x?: number, y?: number, options?: Record<string, unknown>): PDFDoc;
  addPage(): PDFDoc;
  end(): void;
  on(event: string, callback: (data?: Buffer) => void): void;
  page: { width: number; height: number };
}

// Brand colors from design system
const COLORS = {
  primary: '#4C7D5D',      // Forest green - main brand
  primaryDark: '#1D3D34',  // Deep forest - dark variant
  text: '#13343b',         // Slate - main text
  textSecondary: '#626c71', // Gray - secondary text
  white: '#ffffff',
  border: '#e5e7eb',
};

// Font sizes
const FONT_SIZES = {
  title: 24,
  heading: 16,
  subheading: 14,
  body: 11,
  small: 9,
};

// Page margins
const MARGIN = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
};

/**
 * Converts MockProducts to ProductExportData
 */
export function productsToExportData(products: MockProduct[]): ProductExportData[] {
  return products.map(product => ({
    id: product.id,
    name: product.name,
    supplier: product.supplier,
    carbonFootprint: product.epd?.gwp ?? 0,
    recycledContent: product.recycledContent ?? 0,
    certifications: product.certifications ?? [],
  }));
}

/**
 * Calculates summary statistics for ESG report
 */
export function calculateSummary(products: ProductExportData[]): ESGReportSummary {
  const totalProducts = products.length;
  
  const totalEmbodiedCarbon = products.reduce(
    (sum, p) => sum + (p.carbonFootprint ?? 0), 
    0
  );
  
  const averageRecycledContent = totalProducts > 0
    ? products.reduce((sum, p) => sum + (p.recycledContent ?? 0), 0) / totalProducts
    : 0;

  return {
    totalProducts,
    totalEmbodiedCarbon: Math.round(totalEmbodiedCarbon * 100) / 100,
    averageRecycledContent: Math.round(averageRecycledContent * 100) / 100,
  };
}

/**
 * Prepares complete ESG report data from products
 */
export function prepareReportData(products: MockProduct[]): ESGReportData {
  const exportData = productsToExportData(products);
  const summary = calculateSummary(exportData);

  return {
    products: exportData,
    summary,
    metadata: {
      reportId: uuidv4(),
      generatedAt: new Date(),
    },
  };
}

/**
 * Draws a horizontal line on the PDF
 */
function drawLine(doc: PDFDoc, y: number, width: number): void {
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(MARGIN.left, y)
    .lineTo(MARGIN.left + width, y)
    .stroke();
}

/**
 * Draws the header section of the ESG report
 */
function drawHeader(doc: PDFDoc, reportData: ESGReportData, pageWidth: number): number {
  let y = MARGIN.top;

  // Logo placeholder - green rectangle with text
  doc
    .fillColor(COLORS.primary)
    .rect(MARGIN.left, y, 40, 40)
    .fill();

  doc
    .fillColor(COLORS.white)
    .fontSize(FONT_SIZES.small)
    .text('GC', MARGIN.left + 10, y + 14, { width: 20 });

  // Company name
  doc
    .fillColor(COLORS.primaryDark)
    .fontSize(FONT_SIZES.heading)
    .text('GreenChainz', MARGIN.left + 50, y + 12);

  y += 60;

  // Report title
  doc
    .fillColor(COLORS.primary)
    .fontSize(FONT_SIZES.title)
    .text('Sustainability Profile Report', MARGIN.left, y);

  y += 35;

  // Generation date
  const dateStr = reportData.metadata.generatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc
    .fillColor(COLORS.textSecondary)
    .fontSize(FONT_SIZES.body)
    .text(`Generated: ${dateStr}`, MARGIN.left, y);

  y += 20;

  // Report ID
  doc
    .fontSize(FONT_SIZES.small)
    .text(`Report ID: ${reportData.metadata.reportId}`, MARGIN.left, y);

  y += 30;
  drawLine(doc, y, pageWidth - MARGIN.left - MARGIN.right);

  return y + 20;
}

/**
 * Draws the summary section
 */
function drawSummary(doc: PDFDoc, summary: ESGReportSummary, startY: number, pageWidth: number): number {
  let y = startY;

  doc
    .fillColor(COLORS.primaryDark)
    .fontSize(FONT_SIZES.heading)
    .text('Summary', MARGIN.left, y);

  y += 25;

  // Summary boxes
  const boxWidth = (pageWidth - MARGIN.left - MARGIN.right - 40) / 3;
  const boxHeight = 60;
  const boxes = [
    { label: 'Total Products', value: summary.totalProducts.toString() },
    { label: 'Total Embodied Carbon', value: `${summary.totalEmbodiedCarbon} kgCO₂e` },
    { label: 'Avg Recycled Content', value: `${summary.averageRecycledContent}%` },
  ];

  boxes.forEach((box, index) => {
    const x = MARGIN.left + index * (boxWidth + 20);

    // Box background
    doc
      .fillColor('#f0f7f0')
      .rect(x, y, boxWidth, boxHeight)
      .fill();

    // Box border
    doc
      .strokeColor(COLORS.primary)
      .lineWidth(2)
      .rect(x, y, boxWidth, boxHeight)
      .stroke();

    // Value
    doc
      .fillColor(COLORS.primary)
      .fontSize(FONT_SIZES.heading)
      .text(box.value, x + 10, y + 12, { width: boxWidth - 20, align: 'center' });

    // Label
    doc
      .fillColor(COLORS.textSecondary)
      .fontSize(FONT_SIZES.small)
      .text(box.label, x + 10, y + 38, { width: boxWidth - 20, align: 'center' });
  });

  return y + boxHeight + 30;
}

/**
 * Draws the product details table
 */
function drawProductTable(doc: PDFDoc, products: ProductExportData[], startY: number, pageWidth: number): number {
  let y = startY;

  doc
    .fillColor(COLORS.primaryDark)
    .fontSize(FONT_SIZES.heading)
    .text('Product Details', MARGIN.left, y);

  y += 25;

  // Table column definitions with fixed widths
  const COL_PRODUCT_NAME_WIDTH = 140;
  const COL_SUPPLIER_WIDTH = 100;
  const COL_CARBON_WIDTH = 90;
  const COL_RECYCLED_WIDTH = 70;
  const COL_CERTS_WIDTH = 110;
  
  // Table headers
  const columns = [
    { label: 'Product Name', width: COL_PRODUCT_NAME_WIDTH },
    { label: 'Supplier', width: COL_SUPPLIER_WIDTH },
    { label: 'Carbon (kgCO₂e)', width: COL_CARBON_WIDTH },
    { label: 'Recycled %', width: COL_RECYCLED_WIDTH },
    { label: 'Certifications', width: COL_CERTS_WIDTH },
  ];

  // Header row background
  doc
    .fillColor(COLORS.primary)
    .rect(MARGIN.left, y, pageWidth - MARGIN.left - MARGIN.right, 22)
    .fill();

  // Header text
  let headerX = MARGIN.left + 5;
  doc.fillColor(COLORS.white).fontSize(FONT_SIZES.small);
  columns.forEach(col => {
    doc.text(col.label, headerX, y + 6, { width: col.width - 10 });
    headerX += col.width;
  });

  y += 22;

  // Data rows
  doc.fillColor(COLORS.text).fontSize(FONT_SIZES.small);

  products.forEach((product, rowIndex) => {
    // Check for page break
    if (y > 700) {
      doc.addPage();
      y = MARGIN.top;
    }

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc
        .fillColor('#f9fafb')
        .rect(MARGIN.left, y, pageWidth - MARGIN.left - MARGIN.right, 20)
        .fill();
    }

    let cellX = MARGIN.left + 5;
    doc.fillColor(COLORS.text);

    // Product Name (truncate if too long)
    const name = product.name.length > 22 ? product.name.substring(0, 20) + '...' : product.name;
    doc.text(name, cellX, y + 5, { width: COL_PRODUCT_NAME_WIDTH - 10 });
    cellX += COL_PRODUCT_NAME_WIDTH;

    // Supplier (truncate if too long)
    const supplier = product.supplier.length > 15 ? product.supplier.substring(0, 13) + '...' : product.supplier;
    doc.text(supplier, cellX, y + 5, { width: COL_SUPPLIER_WIDTH - 10 });
    cellX += COL_SUPPLIER_WIDTH;

    // Carbon Footprint
    doc.text(product.carbonFootprint.toString(), cellX, y + 5, { width: COL_CARBON_WIDTH - 10 });
    cellX += COL_CARBON_WIDTH;

    // Recycled Content
    doc.text(`${product.recycledContent}%`, cellX, y + 5, { width: COL_RECYCLED_WIDTH - 10 });
    cellX += COL_RECYCLED_WIDTH;

    // Certifications
    const certs = product.certifications.length > 0 
      ? product.certifications.slice(0, 3).join(', ') 
      : 'None';
    doc.text(certs, cellX, y + 5, { width: COL_CERTS_WIDTH - 10 });

    y += 20;
  });

  return y + 20;
}

/**
 * Draws the footer section
 */
function drawFooter(doc: PDFDoc, reportId: string, pageWidth: number): void {
  const y = 750;

  drawLine(doc, y, pageWidth - MARGIN.left - MARGIN.right);

  doc
    .fillColor(COLORS.textSecondary)
    .fontSize(FONT_SIZES.small)
    .text(
      'Generated by GreenChainz - The Global Trust Layer for Sustainable Commerce',
      MARGIN.left,
      y + 10,
      { align: 'center', width: pageWidth - MARGIN.left - MARGIN.right }
    );

  doc.text(
    `Report ID: ${reportId}`,
    MARGIN.left,
    y + 25,
    { align: 'center', width: pageWidth - MARGIN.left - MARGIN.right }
  );
}

/**
 * Generates a PDF ESG report and returns it as a Buffer
 */
export async function generatePdf(products: MockProduct[]): Promise<Buffer> {
  const reportData = prepareReportData(products);

  // Dynamic import for PDFKit (CommonJS module)
  const PDFDocumentModule = await import('pdfkit');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PDFDocument = (PDFDocumentModule as any).default || PDFDocumentModule;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'A4',
      margins: MARGIN,
      info: {
        Title: 'GreenChainz Sustainability Profile Report',
        Author: 'GreenChainz',
        Subject: 'ESG Report',
        Keywords: 'sustainability, ESG, carbon footprint, green building',
        Creator: 'GreenChainz Export System',
      },
    });

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;

    // Draw sections
    let y = drawHeader(doc, reportData, pageWidth);
    y = drawSummary(doc, reportData.summary, y, pageWidth);
    drawProductTable(doc, reportData.products, y, pageWidth);
    drawFooter(doc, reportData.metadata.reportId, pageWidth);

    doc.end();
  });
}

/**
 * Generates the filename for ESG report export
 */
export function generateEsgReportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `greenchainz-esg-report-${date}.pdf`;
}
