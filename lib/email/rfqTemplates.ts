/**
 * RFQ Email Template Utilities
 *
 * Reusable inline-styled HTML email templates for RFQ-related notifications.
 * Uses brand colors: Teal (#14b8a6) for buttons and dark background (#0a0a0a).
 * All templates are mobile-responsive with inline CSS compatible with email clients.
 *
 * NO 'any' types - strict TypeScript typing enforced.
 */

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Escapes HTML entities to prevent XSS attacks
 * Converts special characters to HTML entities for safe rendering in email clients
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] ?? char);
}

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * RFQ details for supplier match email
 */
export interface RfqMatchEmailParams {
  supplierName: string;
  rfqDetails: {
    projectName: string;
    category: string;
    deadline: string;
    quantity?: string;
    location?: string;
  };
  rfqUrl: string;
}

/**
 * Quote notification details for architect
 */
export interface NewQuoteEmailParams {
  architectName: string;
  rfqName: string;
  supplierName: string;
  quoteUrl: string;
  quotePreview?: string;
}

/**
 * Quote acceptance details for supplier
 */
export interface QuoteAcceptedEmailParams {
  supplierName: string;
  rfqName: string;
  architectContact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
}

// =============================================================================
// Shared Style Helpers
// =============================================================================

/**
 * Brand colors for consistent theming
 */
const BRAND_COLORS = {
  teal: '#14b8a6',
  tealDark: '#0f766e',
  tealLight: '#5eead4',
  darkBg: '#0a0a0a',
  darkCard: '#1a1a1a',
  darkBorder: '#2a2a2a',
  textPrimary: '#ffffff',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
} as const;

/**
 * Shared inline styles for email components
 * These styles are compatible with major email clients (Gmail, Outlook, Apple Mail)
 */
const EMAIL_STYLES = {
  /**
   * Base body style with dark background
   */
  body: `
    margin: 0;
    padding: 0;
    background-color: ${BRAND_COLORS.darkBg};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `,

  /**
   * Main container with max-width for desktop
   */
  container: `
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  `,

  /**
   * Content card with dark theme
   */
  card: `
    background-color: ${BRAND_COLORS.darkCard};
    border: 1px solid ${BRAND_COLORS.darkBorder};
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 24px;
  `,

  /**
   * Primary heading
   */
  h1: `
    color: ${BRAND_COLORS.textPrimary};
    font-size: 28px;
    font-weight: 700;
    line-height: 1.3;
    margin: 0 0 16px 0;
  `,

  /**
   * Secondary heading
   */
  h2: `
    color: ${BRAND_COLORS.textPrimary};
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
    margin: 0 0 12px 0;
  `,

  /**
   * Body text
   */
  text: `
    color: ${BRAND_COLORS.textSecondary};
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,

  /**
   * Muted/small text
   */
  textSmall: `
    color: ${BRAND_COLORS.textMuted};
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
  `,

  /**
   * Primary CTA button with teal background
   */
  button: `
    display: inline-block;
    background-color: ${BRAND_COLORS.teal};
    color: ${BRAND_COLORS.textPrimary};
    text-decoration: none;
    padding: 16px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    transition: background-color 0.2s ease;
  `,

  /**
   * Info box for highlighting important details
   */
  infoBox: `
    background-color: ${BRAND_COLORS.darkBg};
    border: 1px solid ${BRAND_COLORS.tealDark};
    border-left: 4px solid ${BRAND_COLORS.teal};
    border-radius: 8px;
    padding: 16px 20px;
    margin: 20px 0;
  `,

  /**
   * Table for key-value details
   */
  table: `
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  `,

  tableRow: `
    border-bottom: 1px solid ${BRAND_COLORS.darkBorder};
  `,

  tableCell: `
    padding: 12px 0;
    color: ${BRAND_COLORS.textMuted};
    font-size: 14px;
  `,

  tableCellValue: `
    padding: 12px 0;
    color: ${BRAND_COLORS.textPrimary};
    font-size: 14px;
    font-weight: 500;
    text-align: right;
  `,

  /**
   * Footer styling
   */
  footer: `
    text-align: center;
    color: ${BRAND_COLORS.textMuted};
    font-size: 12px;
    line-height: 1.6;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid ${BRAND_COLORS.darkBorder};
  `,

  /**
   * Link styling
   */
  link: `
    color: ${BRAND_COLORS.teal};
    text-decoration: underline;
  `,
} as const;

/**
 * Media queries for mobile responsiveness
 * Note: Only some email clients support media queries (Gmail on mobile does not)
 * Key: Use fluid widths and conditional display for maximum compatibility
 */
const MEDIA_QUERIES = `
  @media only screen and (max-width: 600px) {
    .email-container {
      width: 100% !important;
      padding: 20px 10px !important;
    }
    
    .email-card {
      padding: 20px !important;
    }
    
    .email-button {
      display: block !important;
      width: 100% !important;
      padding: 14px 20px !important;
      font-size: 14px !important;
    }
    
    .email-h1 {
      font-size: 24px !important;
    }
    
    .email-h2 {
      font-size: 18px !important;
    }
    
    .email-table-cell {
      display: block !important;
      width: 100% !important;
      text-align: left !important;
      padding: 8px 0 !important;
    }
  }
`;

// =============================================================================
// Base Template Wrapper
// =============================================================================

/**
 * Wraps email content in a complete HTML document with proper DOCTYPE and meta tags
 */
function wrapEmailTemplate(content: string, previewText: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>GreenChainz</title>
  <style type="text/css">
    ${MEDIA_QUERIES}
  </style>
  <!--[if mso]>
  <style type="text/css">
    .email-button {
      background-color: ${BRAND_COLORS.teal} !important;
    }
  </style>
  <![endif]-->
</head>
<body style="${EMAIL_STYLES.body}">
  <!-- Preview text (hidden, only shows in inbox preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${previewText}
  </div>
  
  <!-- Main email content -->
  <div class="email-container" style="${EMAIL_STYLES.container}">
    ${content}
    
    <!-- Footer -->
    <div style="${EMAIL_STYLES.footer}">
      <p style="margin: 0 0 8px 0;">
        © ${new Date().getFullYear()} GreenChainz - B2B Green Sourcing Marketplace
      </p>
      <p style="margin: 0 0 8px 0;">
        <a href="https://greenchainz.com" style="${EMAIL_STYLES.link}">Visit Website</a> | 
        <a href="https://greenchainz.com/support" style="${EMAIL_STYLES.link}">Support</a> | 
        <a href="https://greenchainz.com/unsubscribe" style="${EMAIL_STYLES.link}">Unsubscribe</a>
      </p>
      <p style="margin: 0; color: ${BRAND_COLORS.textMuted};">
        Connecting sustainable suppliers with eco-conscious buyers worldwide.
      </p>
    </div>
  </div>
</body>
</html>
`.trim();
}

// =============================================================================
// Public Email Template Functions
// =============================================================================

/**
 * Generate supplier match email with RFQ details and CTA button
 *
 * @param supplierName - Name of the supplier receiving the notification
 * @param rfqDetails - RFQ summary details (project, category, deadline)
 * @param rfqUrl - URL to view RFQ and submit quote
 * @returns Complete HTML email string with inline styles
 *
 * @example
 * ```ts
 * const html = rfqMatchEmail(
 *   'Green Materials Co.',
 *   {
 *     projectName: 'Downtown Office Complex',
 *     category: 'Sustainable Insulation',
 *     deadline: 'Dec 15, 2025',
 *     quantity: '500 units',
 *     location: 'Seattle, WA'
 *   },
 *   'https://greenchainz.com/supplier/rfqs/123'
 * );
 * ```
 */
export function rfqMatchEmail(
  supplierName: string,
  rfqDetails: RfqMatchEmailParams['rfqDetails'],
  rfqUrl: string
): string {
  const previewText = `New RFQ Match: ${escapeHtml(rfqDetails.projectName)} - ${escapeHtml(rfqDetails.category)}`;

  const content = `
    <!-- Header Card -->
    <div class="email-card" style="${EMAIL_STYLES.card}">
      <!-- Badge -->
      <div style="margin-bottom: 20px;">
        <span style="
          display: inline-block;
          background-color: ${BRAND_COLORS.teal};
          color: ${BRAND_COLORS.darkBg};
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          🎯 New RFQ Match
        </span>
      </div>

      <!-- Greeting -->
      <h1 class="email-h1" style="${EMAIL_STYLES.h1}">
        Hi ${escapeHtml(supplierName)},
      </h1>
      
      <p style="${EMAIL_STYLES.text}">
        Great news! A new Request for Quote matches your product offerings.
      </p>

      <!-- RFQ Summary -->
      <div style="${EMAIL_STYLES.infoBox}">
        <h2 class="email-h2" style="${EMAIL_STYLES.h2}">
          RFQ Summary
        </h2>
        
        <table style="${EMAIL_STYLES.table}">
          <tbody>
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Project</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(rfqDetails.projectName)}</td>
            </tr>
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Category</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(rfqDetails.category)}</td>
            </tr>
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Deadline</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">⏰ ${escapeHtml(rfqDetails.deadline)}</td>
            </tr>
            ${
              rfqDetails.quantity
                ? `
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Quantity</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(rfqDetails.quantity)}</td>
            </tr>
            `
                : ''
            }
            ${
              rfqDetails.location
                ? `
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Location</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(rfqDetails.location)}</td>
            </tr>
            `
                : ''
            }
          </tbody>
        </table>
      </div>

      <p style="${EMAIL_STYLES.text}">
        Submit your quote quickly to increase your chances of winning this project. 
        Architects value fast and competitive responses.
      </p>

      <!-- CTA Button -->
      <div style="margin: 32px 0; text-align: center;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${rfqUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" stroke="f" fillcolor="${BRAND_COLORS.teal}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">
            View RFQ &amp; Submit Quote
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${rfqUrl}" class="email-button" style="${EMAIL_STYLES.button}">
          View RFQ &amp; Submit Quote →
        </a>
        <!--<![endif]-->
      </div>

      <p style="${EMAIL_STYLES.textSmall}">
        <strong>Tip:</strong> Include competitive pricing, lead times, and highlight your sustainability credentials to stand out.
      </p>
    </div>
  `;

  return wrapEmailTemplate(content, previewText);
}

/**
 * Generate new quote notification email for architect
 *
 * @param architectName - Name of the architect receiving the notification
 * @param rfqName - Name/title of the RFQ
 * @param supplierName - Name of the supplier who submitted the quote
 * @param quoteUrl - URL to view and compare quotes
 * @returns Complete HTML email string with inline styles
 *
 * @example
 * ```ts
 * const html = newQuoteEmail(
 *   'Sarah Johnson',
 *   'Downtown Office Complex - Sustainable Insulation',
 *   'Green Materials Co.',
 *   'https://greenchainz.com/architect/rfqs/123/quotes'
 * );
 * ```
 */
export function newQuoteEmail(
  architectName: string,
  rfqName: string,
  supplierName: string,
  quoteUrl: string,
  quotePreview?: string
): string {
  const previewText = `New Quote from ${escapeHtml(supplierName)} for ${escapeHtml(rfqName)}`;

  const content = `
    <!-- Header Card -->
    <div class="email-card" style="${EMAIL_STYLES.card}">
      <!-- Badge -->
      <div style="margin-bottom: 20px;">
        <span style="
          display: inline-block;
          background-color: ${BRAND_COLORS.tealLight};
          color: ${BRAND_COLORS.darkBg};
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          📩 New Quote Received
        </span>
      </div>

      <!-- Greeting -->
      <h1 class="email-h1" style="${EMAIL_STYLES.h1}">
        Hi ${escapeHtml(architectName)},
      </h1>
      
      <p style="${EMAIL_STYLES.text}">
        You've received a new quote for your RFQ.
      </p>

      <!-- Quote Details -->
      <div style="${EMAIL_STYLES.infoBox}">
        <table style="${EMAIL_STYLES.table}">
          <tbody>
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">RFQ</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(rfqName)}</td>
            </tr>
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Supplier</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(supplierName)}</td>
            </tr>
          </tbody>
        </table>
        
        ${
          quotePreview
            ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid ${BRAND_COLORS.darkBorder};">
          <p style="${EMAIL_STYLES.textSmall}">
            <strong style="color: ${BRAND_COLORS.textPrimary};">Quote Preview:</strong><br/>
            ${escapeHtml(quotePreview)}
          </p>
        </div>
        `
            : ''
        }
      </div>

      <p style="${EMAIL_STYLES.text}">
        Review the complete quote details, compare it with other submissions, and make an informed decision for your project.
      </p>

      <!-- CTA Button -->
      <div style="margin: 32px 0; text-align: center;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${quoteUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" stroke="f" fillcolor="${BRAND_COLORS.teal}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">
            View &amp; Compare Quotes
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${quoteUrl}" class="email-button" style="${EMAIL_STYLES.button}">
          View &amp; Compare Quotes →
        </a>
        <!--<![endif]-->
      </div>

      <p style="${EMAIL_STYLES.textSmall}">
        <strong>Tip:</strong> Consider pricing, lead times, certifications, and sustainability metrics when evaluating quotes.
      </p>
    </div>
  `;

  return wrapEmailTemplate(content, previewText);
}

/**
 * Generate quote acceptance confirmation email for supplier
 *
 * @param supplierName - Name of the supplier whose quote was accepted
 * @param rfqName - Name/title of the RFQ
 * @param architectContact - Contact information for next steps
 * @returns Complete HTML email string with inline styles
 *
 * @example
 * ```ts
 * const html = quoteAcceptedEmail(
 *   'Green Materials Co.',
 *   'Downtown Office Complex - Sustainable Insulation',
 *   {
 *     name: 'Sarah Johnson',
 *     email: 'sarah@architectfirm.com',
 *     phone: '+1 (555) 123-4567',
 *     company: 'Johnson Architecture'
 *   }
 * );
 * ```
 */
export function quoteAcceptedEmail(
  supplierName: string,
  rfqName: string,
  architectContact: QuoteAcceptedEmailParams['architectContact']
): string {
  const previewText = `Congratulations! Your quote for ${escapeHtml(rfqName)} has been accepted`;

  const content = `
    <!-- Header Card -->
    <div class="email-card" style="${EMAIL_STYLES.card}">
      <!-- Success Badge -->
      <div style="margin-bottom: 20px;">
        <span style="
          display: inline-block;
          background-color: ${BRAND_COLORS.teal};
          color: ${BRAND_COLORS.darkBg};
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          🎉 Quote Accepted
        </span>
      </div>

      <!-- Congratulations Message -->
      <h1 class="email-h1" style="${EMAIL_STYLES.h1}">
        Congratulations, ${escapeHtml(supplierName)}!
      </h1>
      
      <p style="${EMAIL_STYLES.text}">
        Your quote has been <strong style="color: ${BRAND_COLORS.teal};">accepted</strong> for the following RFQ:
      </p>

      <div style="${EMAIL_STYLES.infoBox}">
        <h2 class="email-h2" style="${EMAIL_STYLES.h2}">
          ${escapeHtml(rfqName)}
        </h2>
      </div>

      <!-- Next Steps -->
      <h2 class="email-h2" style="${EMAIL_STYLES.h2}">
        📋 Next Steps
      </h2>

      <p style="${EMAIL_STYLES.text}">
        The architect will reach out to you shortly to finalize the order details. Here's what to do next:
      </p>

      <ol style="color: ${BRAND_COLORS.textSecondary}; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0; padding-left: 24px;">
        <li style="margin-bottom: 8px;">Review and confirm the quote details</li>
        <li style="margin-bottom: 8px;">Prepare product documentation and certifications</li>
        <li style="margin-bottom: 8px;">Coordinate delivery timeline with the architect</li>
        <li style="margin-bottom: 8px;">Issue a formal purchase order</li>
      </ol>

      <!-- Architect Contact Information -->
      <div style="${EMAIL_STYLES.infoBox}">
        <h2 class="email-h2" style="${EMAIL_STYLES.h2}">
          👤 Architect Contact Information
        </h2>
        
        <table style="${EMAIL_STYLES.table}">
          <tbody>
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Name</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(architectContact.name)}</td>
            </tr>
            ${
              architectContact.company
                ? `
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Company</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">${escapeHtml(architectContact.company)}</td>
            </tr>
            `
                : ''
            }
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Email</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">
                <a href="mailto:${escapeHtml(architectContact.email)}" style="${EMAIL_STYLES.link}">
                  ${escapeHtml(architectContact.email)}
                </a>
              </td>
            </tr>
            ${
              architectContact.phone
                ? `
            <tr style="${EMAIL_STYLES.tableRow}">
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCell}">Phone</td>
              <td class="email-table-cell" style="${EMAIL_STYLES.tableCellValue}">
                <a href="tel:${escapeHtml(architectContact.phone)}" style="${EMAIL_STYLES.link}">
                  ${escapeHtml(architectContact.phone)}
                </a>
              </td>
            </tr>
            `
                : ''
            }
          </tbody>
        </table>
      </div>

      <p style="${EMAIL_STYLES.text}">
        We recommend reaching out within <strong>24 hours</strong> to maintain momentum and ensure a smooth transaction.
      </p>

      <p style="${EMAIL_STYLES.textSmall}">
        <strong>Need Help?</strong> Our support team is available if you have any questions about the next steps.
        <a href="https://greenchainz.com/support" style="${EMAIL_STYLES.link}">Contact Support</a>
      </p>
    </div>

    <!-- Feedback Prompt -->
    <div class="email-card" style="${EMAIL_STYLES.card}">
      <p style="${EMAIL_STYLES.text}">
        <strong>How was your experience?</strong>
      </p>
      <p style="${EMAIL_STYLES.textSmall}">
        We'd love to hear your feedback about the RFQ process.
        <a href="https://greenchainz.com/feedback" style="${EMAIL_STYLES.link}">Share Feedback</a>
      </p>
    </div>
  `;

  return wrapEmailTemplate(content, previewText);
}

// =============================================================================
// Exports
// =============================================================================

const rfqEmailTemplates = {
  rfqMatchEmail,
  newQuoteEmail,
  quoteAcceptedEmail,
};

export default rfqEmailTemplates;
