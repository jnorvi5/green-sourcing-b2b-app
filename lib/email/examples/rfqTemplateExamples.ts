/**
 * Usage Examples for RFQ Email Templates
 *
 * This file demonstrates how to use the RFQ email template utilities.
 * These examples can be used for testing or as reference implementations.
 */

import { rfqMatchEmail, newQuoteEmail, quoteAcceptedEmail } from '../rfqTemplates';

// =============================================================================
// Example 1: Supplier RFQ Match Notification
// =============================================================================

export function exampleRfqMatchEmail(): string {
  return rfqMatchEmail(
    'Green Materials Co.',
    {
      projectName: 'Downtown Office Complex',
      category: 'Sustainable Insulation',
      deadline: 'December 15, 2025',
      quantity: '500 units',
      location: 'Seattle, WA',
    },
    'https://greenchainz.com/supplier/rfqs/abc123'
  );
}

// =============================================================================
// Example 2: New Quote Notification for Architect
// =============================================================================

export function exampleNewQuoteEmail(): string {
  return newQuoteEmail(
    'Sarah Johnson',
    'Downtown Office Complex - Sustainable Insulation',
    'Green Materials Co.',
    'https://greenchainz.com/architect/rfqs/abc123/quotes',
    'Price: $15,000 | Lead Time: 3 weeks | Includes installation support'
  );
}

// =============================================================================
// Example 3: Quote Accepted Notification for Supplier
// =============================================================================

export function exampleQuoteAcceptedEmail(): string {
  return quoteAcceptedEmail(
    'Green Materials Co.',
    'Downtown Office Complex - Sustainable Insulation',
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@architectfirm.com',
      phone: '+1 (555) 123-4567',
      company: 'Johnson Architecture LLC',
    }
  );
}

// =============================================================================
// Example 4: Minimal RFQ Match (Optional Fields Omitted)
// =============================================================================

export function exampleMinimalRfqMatchEmail(): string {
  return rfqMatchEmail(
    'EcoSupply Inc.',
    {
      projectName: 'Green Building Renovation',
      category: 'Recycled Steel',
      deadline: 'January 10, 2026',
      // quantity and location are optional - omitted here
    },
    'https://greenchainz.com/supplier/rfqs/xyz789'
  );
}

// =============================================================================
// Example 5: Quote Accepted with Minimal Contact Info
// =============================================================================

export function exampleMinimalQuoteAcceptedEmail(): string {
  return quoteAcceptedEmail(
    'Sustainable Solutions Ltd.',
    'Hospital Wing Construction - Green Concrete',
    {
      name: 'Michael Chen',
      email: 'michael.chen@contractor.com',
      // phone and company are optional - omitted here
    }
  );
}

// =============================================================================
// Testing Helper: Generate All Examples
// =============================================================================

/**
 * Generates all example emails for testing purposes
 * @returns Object containing all example emails with descriptive keys
 */
export function generateAllExamples(): Record<string, string> {
  return {
    rfqMatch: exampleRfqMatchEmail(),
    newQuote: exampleNewQuoteEmail(),
    quoteAccepted: exampleQuoteAcceptedEmail(),
    minimalRfqMatch: exampleMinimalRfqMatchEmail(),
    minimalQuoteAccepted: exampleMinimalQuoteAcceptedEmail(),
  };
}

// =============================================================================
// Usage in Application Code
// =============================================================================

/**
 * Example integration with email sending service
 *
 * @example
 * ```typescript
 * import { rfqMatchEmail } from '@/lib/email/rfqTemplates';
 * import { sendEmail } from '@/lib/email/email-service';
 *
 * async function notifySupplierOfMatch(
 *   supplierEmail: string,
 *   supplierName: string,
 *   rfq: RFQ
 * ) {
 *   const htmlContent = rfqMatchEmail(
 *     supplierName,
 *     {
 *       projectName: rfq.projectName,
 *       category: rfq.category,
 *       deadline: formatDate(rfq.deadline),
 *       quantity: `${rfq.quantity} ${rfq.unit}`,
 *       location: rfq.deliveryLocation,
 *     },
 *     `${process.env.NEXT_PUBLIC_BASE_URL}/supplier/rfqs/${rfq.id}`
 *   );
 *
 *   await sendEmail({
 *     to: supplierEmail,
 *     subject: `New RFQ Match: ${rfq.projectName}`,
 *     html: htmlContent,
 *   });
 * }
 * ```
 */
export function usageExample(): void {
  // This function serves as documentation and is not meant to be executed
  console.log('See JSDoc comments for usage examples');
}
