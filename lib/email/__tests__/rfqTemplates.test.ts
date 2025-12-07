/**
 * Unit tests for RFQ Email Template Utilities
 *
 * Tests verify:
 * - Type safety (no 'any' types)
 * - HTML structure and completeness
 * - Brand color consistency
 * - Inline CSS compatibility
 * - Mobile responsiveness support
 * - Security (no secret leaks, proper escaping)
 */

import {
  rfqMatchEmail,
  newQuoteEmail,
  quoteAcceptedEmail,
  type RfqMatchEmailParams,
  type NewQuoteEmailParams,
  type QuoteAcceptedEmailParams,
} from '../rfqTemplates';

describe('rfqTemplates', () => {
  describe('rfqMatchEmail', () => {
    const defaultParams: {
      supplierName: string;
      rfqDetails: RfqMatchEmailParams['rfqDetails'];
      rfqUrl: string;
    } = {
      supplierName: 'Green Materials Co.',
      rfqDetails: {
        projectName: 'Downtown Office Complex',
        category: 'Sustainable Insulation',
        deadline: 'Dec 15, 2025',
        quantity: '500 units',
        location: 'Seattle, WA',
      },
      rfqUrl: 'https://greenchainz.com/supplier/rfqs/123',
    };

    it('should generate complete HTML email with DOCTYPE and meta tags', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('<!DOCTYPE html');
      expect(html).toContain('<html xmlns="http://www.w3.org/1999/xhtml"');
      expect(html).toContain('charset=UTF-8');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('</html>');
    });

    it('should include supplier name in greeting', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('Hi Green Materials Co.');
    });

    it('should display all RFQ details in table', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('Downtown Office Complex');
      expect(html).toContain('Sustainable Insulation');
      expect(html).toContain('Dec 15, 2025');
      expect(html).toContain('500 units');
      expect(html).toContain('Seattle, WA');
    });

    it('should include CTA button with correct URL', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('View RFQ &amp; Submit Quote');
      expect(html).toContain('href="https://greenchainz.com/supplier/rfqs/123"');
    });

    it('should use brand teal color (#14b8a6)', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('#14b8a6');
    });

    it('should use dark background color (#0a0a0a)', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('#0a0a0a');
    });

    it('should include mobile responsive media queries', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('@media only screen and (max-width: 600px)');
      expect(html).toContain('email-button');
      expect(html).toContain('email-container');
    });

    it('should handle optional fields gracefully', () => {
      const minimalDetails: RfqMatchEmailParams['rfqDetails'] = {
        projectName: 'Test Project',
        category: 'Test Category',
        deadline: 'Jan 1, 2026',
      };

      const html = rfqMatchEmail(
        'Test Supplier',
        minimalDetails,
        'https://example.com/rfq/1'
      );

      expect(html).toContain('Test Project');
      expect(html).toContain('Test Category');
      expect(html).toContain('Jan 1, 2026');
      // Should not contain table rows for missing optional fields
      expect(html).not.toContain('Quantity</td>');
      expect(html).not.toContain('Location</td>');
    });

    it('should include Outlook MSO conditional comments for button', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('<!--[if mso]>');
      expect(html).toContain('<![endif]-->');
      expect(html).toContain('v:roundrect');
    });

    it('should include preview text for inbox preview', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      expect(html).toContain('display: none');
      expect(html).toContain('max-height: 0px');
      expect(html).toContain('New RFQ Match');
    });

    it('should escape HTML in user-provided content', () => {
      const maliciousDetails: RfqMatchEmailParams['rfqDetails'] = {
        projectName: '<script>alert("xss")</script>',
        category: 'Test Category',
        deadline: 'Jan 1, 2026',
      };

      const html = rfqMatchEmail(
        'Test Supplier',
        maliciousDetails,
        'https://example.com/rfq/1'
      );

      // Content should be present but script tag should be escaped
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert');
    });

    it('should include footer with current year', () => {
      const html = rfqMatchEmail(
        defaultParams.supplierName,
        defaultParams.rfqDetails,
        defaultParams.rfqUrl
      );

      const currentYear = new Date().getFullYear();
      expect(html).toContain(`© ${currentYear} GreenChainz`);
    });
  });

  describe('newQuoteEmail', () => {
    const defaultParams: {
      architectName: string;
      rfqName: string;
      supplierName: string;
      quoteUrl: string;
      quotePreview?: string;
    } = {
      architectName: 'Sarah Johnson',
      rfqName: 'Downtown Office Complex - Sustainable Insulation',
      supplierName: 'Green Materials Co.',
      quoteUrl: 'https://greenchainz.com/architect/rfqs/123/quotes',
      quotePreview: 'Price: $15,000 | Lead Time: 3 weeks',
    };

    it('should generate complete HTML email', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl,
        defaultParams.quotePreview
      );

      expect(html).toContain('<!DOCTYPE html');
      expect(html).toContain('</html>');
    });

    it('should include architect name in greeting', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('Hi Sarah Johnson');
    });

    it('should display RFQ name and supplier name', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('Downtown Office Complex - Sustainable Insulation');
      expect(html).toContain('Green Materials Co.');
    });

    it('should include CTA button to view quotes', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('View &amp; Compare Quotes');
      expect(html).toContain(
        'href="https://greenchainz.com/architect/rfqs/123/quotes"'
      );
    });

    it('should display quote preview when provided', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl,
        'Price: $15,000 | Lead Time: 3 weeks'
      );

      expect(html).toContain('Quote Preview');
      expect(html).toContain('Price: $15,000 | Lead Time: 3 weeks');
    });

    it('should handle missing quote preview gracefully', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).not.toContain('Quote Preview');
    });

    it('should use brand colors', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('#14b8a6');
      expect(html).toContain('#0a0a0a');
    });

    it('should include mobile responsive classes', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('email-button');
      expect(html).toContain('email-card');
    });

    it('should include "New Quote Received" badge', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('📩 New Quote Received');
    });

    it('should include preview text', () => {
      const html = newQuoteEmail(
        defaultParams.architectName,
        defaultParams.rfqName,
        defaultParams.supplierName,
        defaultParams.quoteUrl
      );

      expect(html).toContain('New Quote from');
      expect(html).toContain('Green Materials Co.');
    });
  });

  describe('quoteAcceptedEmail', () => {
    const defaultParams: {
      supplierName: string;
      rfqName: string;
      architectContact: QuoteAcceptedEmailParams['architectContact'];
    } = {
      supplierName: 'Green Materials Co.',
      rfqName: 'Downtown Office Complex - Sustainable Insulation',
      architectContact: {
        name: 'Sarah Johnson',
        email: 'sarah@architectfirm.com',
        phone: '+1 (555) 123-4567',
        company: 'Johnson Architecture',
      },
    };

    it('should generate complete HTML email', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('<!DOCTYPE html');
      expect(html).toContain('</html>');
    });

    it('should include congratulations message', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('Congratulations, Green Materials Co.');
      expect(html).toContain('accepted');
    });

    it('should display RFQ name', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('Downtown Office Complex - Sustainable Insulation');
    });

    it('should include next steps section', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('📋 Next Steps');
      expect(html).toContain('Review and confirm the quote details');
      expect(html).toContain('Prepare product documentation');
      expect(html).toContain('Coordinate delivery timeline');
      expect(html).toContain('Issue a formal purchase order');
    });

    it('should display architect contact information', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('Sarah Johnson');
      expect(html).toContain('sarah@architectfirm.com');
      expect(html).toContain('+1 (555) 123-4567');
      expect(html).toContain('Johnson Architecture');
    });

    it('should include clickable email link', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('href="mailto:sarah@architectfirm.com"');
    });

    it('should include clickable phone link', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('href="tel:+1 (555) 123-4567"');
    });

    it('should handle missing optional contact fields', () => {
      const minimalContact: QuoteAcceptedEmailParams['architectContact'] = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const html = quoteAcceptedEmail(
        'Test Supplier',
        'Test RFQ',
        minimalContact
      );

      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).not.toContain('Phone</td>');
      expect(html).not.toContain('Company</td>');
    });

    it('should include success badge', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('🎉 Quote Accepted');
    });

    it('should include feedback section', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('How was your experience?');
      expect(html).toContain('Share Feedback');
      expect(html).toContain('https://greenchainz.com/feedback');
    });

    it('should use brand colors', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('#14b8a6');
      expect(html).toContain('#0a0a0a');
    });

    it('should include support link', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('Contact Support');
      expect(html).toContain('https://greenchainz.com/support');
    });

    it('should include preview text', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('Congratulations!');
      expect(html).toContain('has been accepted');
    });

    it('should include recommendation for 24-hour follow-up', () => {
      const html = quoteAcceptedEmail(
        defaultParams.supplierName,
        defaultParams.rfqName,
        defaultParams.architectContact
      );

      expect(html).toContain('24 hours');
      expect(html).toContain('reaching out');
    });
  });

  describe('Type Safety', () => {
    it('should enforce strict typing on RfqMatchEmailParams', () => {
      const params: RfqMatchEmailParams = {
        supplierName: 'Test',
        rfqDetails: {
          projectName: 'Test Project',
          category: 'Test Category',
          deadline: 'Jan 1, 2026',
        },
        rfqUrl: 'https://example.com',
      };

      expect(params.supplierName).toBe('Test');
      expect(params.rfqDetails.projectName).toBe('Test Project');
    });

    it('should enforce strict typing on NewQuoteEmailParams', () => {
      const params: NewQuoteEmailParams = {
        architectName: 'Test',
        rfqName: 'Test RFQ',
        supplierName: 'Test Supplier',
        quoteUrl: 'https://example.com',
      };

      expect(params.architectName).toBe('Test');
      expect(params.rfqName).toBe('Test RFQ');
    });

    it('should enforce strict typing on QuoteAcceptedEmailParams', () => {
      const params: QuoteAcceptedEmailParams = {
        supplierName: 'Test',
        rfqName: 'Test RFQ',
        architectContact: {
          name: 'Test Architect',
          email: 'test@example.com',
        },
      };

      expect(params.supplierName).toBe('Test');
      expect(params.architectContact.name).toBe('Test Architect');
    });
  });

  describe('Security', () => {
    it('should not expose secrets or sensitive data in templates', () => {
      const html = rfqMatchEmail(
        'Test Supplier',
        {
          projectName: 'Test Project',
          category: 'Test Category',
          deadline: 'Jan 1, 2026',
        },
        'https://example.com'
      );

      // Should not contain common environment variable patterns
      expect(html).not.toMatch(/API_KEY/i);
      expect(html).not.toMatch(/SECRET/i);
      expect(html).not.toMatch(/PASSWORD/i);
      expect(html).not.toMatch(/TOKEN/i);
      expect(html).not.toMatch(/process\.env/i);
    });

    it('should properly escape HTML entities', () => {
      const htmlWithSpecialChars = rfqMatchEmail(
        'Test & Supplier <script>',
        {
          projectName: 'Project "Name" & <b>Bold</b>',
          category: 'Category',
          deadline: 'Jan 1, 2026',
        },
        'https://example.com'
      );

      // HTML entities should be escaped
      expect(htmlWithSpecialChars).not.toContain('<script>');
      expect(htmlWithSpecialChars).not.toContain('<b>Bold</b>');
    });
  });

  describe('Email Client Compatibility', () => {
    it('should include inline styles (not external stylesheets)', () => {
      const html = rfqMatchEmail(
        'Test Supplier',
        {
          projectName: 'Test',
          category: 'Test',
          deadline: 'Jan 1, 2026',
        },
        'https://example.com'
      );

      // Should have inline styles
      expect(html).toContain('style="');
      // Should not have external stylesheet links
      expect(html).not.toContain('<link rel="stylesheet"');
    });

    it('should include VML for Outlook button rendering', () => {
      const html = rfqMatchEmail(
        'Test Supplier',
        {
          projectName: 'Test',
          category: 'Test',
          deadline: 'Jan 1, 2026',
        },
        'https://example.com'
      );

      expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
      expect(html).toContain('xmlns:w="urn:schemas-microsoft-com:office:word"');
    });

    it('should include max-width container for desktop email clients', () => {
      const html = rfqMatchEmail(
        'Test Supplier',
        {
          projectName: 'Test',
          category: 'Test',
          deadline: 'Jan 1, 2026',
        },
        'https://example.com'
      );

      expect(html).toContain('max-width: 600px');
    });
  });
});
