# RFQ Email Templates

Reusable TypeScript utilities for generating inline-styled HTML email templates for RFQ-related notifications in the GreenChainz marketplace.

## Features

- ✅ **Strict TypeScript typing** - No `any` types, full type safety
- ✅ **Inline CSS** - Compatible with major email clients (Gmail, Outlook, Apple Mail)
- ✅ **Mobile responsive** - Media queries for optimal mobile display
- ✅ **Brand consistent** - Uses Teal (#14b8a6) and dark theme (#0a0a0a)
- ✅ **Security focused** - HTML entity escaping to prevent XSS
- ✅ **Outlook compatible** - VML markup for button rendering
- ✅ **Well tested** - Comprehensive unit tests with 44 test cases

## Quick Start

```typescript
import { rfqMatchEmail, newQuoteEmail, quoteAcceptedEmail } from '@/lib/email/rfqTemplates';

// Generate a supplier match notification
const supplierEmail = rfqMatchEmail(
  'Green Materials Co.',
  {
    projectName: 'Downtown Office Complex',
    category: 'Sustainable Insulation',
    deadline: 'Dec 15, 2025',
    quantity: '500 units',
    location: 'Seattle, WA',
  },
  'https://greenchainz.com/supplier/rfqs/123'
);

// Send via your email service
await sendEmail({
  to: 'supplier@example.com',
  subject: 'New RFQ Match Available',
  html: supplierEmail,
});
```

## API Reference

### `rfqMatchEmail()`

Generates a supplier match email with RFQ details and CTA button.

**Parameters:**

- `supplierName: string` - Name of the supplier receiving the notification
- `rfqDetails: object` - RFQ summary details
  - `projectName: string` - Name of the project
  - `category: string` - Product category
  - `deadline: string` - Quote submission deadline
  - `quantity?: string` - (Optional) Quantity requested
  - `location?: string` - (Optional) Delivery location
- `rfqUrl: string` - URL to view RFQ and submit quote

**Returns:** `string` - Complete HTML email

**Example:**

```typescript
const html = rfqMatchEmail(
  'EcoSupply Inc.',
  {
    projectName: 'Green Building Renovation',
    category: 'Recycled Steel',
    deadline: 'Jan 10, 2026',
  },
  'https://greenchainz.com/supplier/rfqs/xyz789'
);
```

### `newQuoteEmail()`

Generates a quote notification email for architects.

**Parameters:**

- `architectName: string` - Name of the architect receiving the notification
- `rfqName: string` - Name/title of the RFQ
- `supplierName: string` - Name of the supplier who submitted the quote
- `quoteUrl: string` - URL to view and compare quotes
- `quotePreview?: string` - (Optional) Preview text for the quote

**Returns:** `string` - Complete HTML email

**Example:**

```typescript
const html = newQuoteEmail(
  'Sarah Johnson',
  'Downtown Office - Insulation',
  'Green Materials Co.',
  'https://greenchainz.com/architect/rfqs/123/quotes',
  'Price: $15,000 | Lead Time: 3 weeks'
);
```

### `quoteAcceptedEmail()`

Generates a quote acceptance confirmation email for suppliers.

**Parameters:**

- `supplierName: string` - Name of the supplier whose quote was accepted
- `rfqName: string` - Name/title of the RFQ
- `architectContact: object` - Contact information for next steps
  - `name: string` - Architect's name
  - `email: string` - Architect's email
  - `phone?: string` - (Optional) Architect's phone number
  - `company?: string` - (Optional) Architect's company name

**Returns:** `string` - Complete HTML email

**Example:**

```typescript
const html = quoteAcceptedEmail(
  'Green Materials Co.',
  'Downtown Office - Insulation',
  {
    name: 'Sarah Johnson',
    email: 'sarah@architectfirm.com',
    phone: '+1 (555) 123-4567',
    company: 'Johnson Architecture',
  }
);
```

## Type Definitions

All templates use strict TypeScript types:

```typescript
interface RfqMatchEmailParams {
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

interface NewQuoteEmailParams {
  architectName: string;
  rfqName: string;
  supplierName: string;
  quoteUrl: string;
  quotePreview?: string;
}

interface QuoteAcceptedEmailParams {
  supplierName: string;
  rfqName: string;
  architectContact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
}
```

## Design System

### Brand Colors

- **Teal**: `#14b8a6` - Primary CTA buttons
- **Teal Dark**: `#0f766e` - Borders and accents
- **Teal Light**: `#5eead4` - Badges and highlights
- **Dark Background**: `#0a0a0a` - Body background
- **Dark Card**: `#1a1a1a` - Content cards
- **Dark Border**: `#2a2a2a` - Borders and dividers

### Typography

- **Font Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`
- **Headings**: White (#ffffff) with bold weights
- **Body Text**: Light gray (#d1d5db)
- **Muted Text**: Mid gray (#9ca3af)

### Mobile Responsiveness

Media queries adjust layouts for screens under 600px:

- Containers: Full width with reduced padding
- Buttons: Block-level, full width
- Tables: Stacked layout
- Text: Smaller font sizes

## Security

All user-provided content is automatically escaped using `escapeHtml()` to prevent XSS attacks:

```typescript
// Input: "<script>alert('xss')</script>"
// Output: "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

The templates never expose:

- Environment variables
- API keys or secrets
- Sensitive configuration data

## Email Client Compatibility

Tested and optimized for:

- ✅ Gmail (web, iOS, Android)
- ✅ Outlook (2016+, 365, web)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Thunderbird

### Outlook-Specific Features

- VML markup for button rendering
- Conditional comments for MSO-specific styles
- Inline styles (no external CSS)

## Testing

Run the test suite:

```bash
npm test -- lib/email/__tests__/rfqTemplates.test.ts
```

Test coverage includes:

- HTML structure validation
- Brand color consistency
- Mobile responsiveness
- Security (XSS prevention)
- Type safety enforcement
- Email client compatibility

## Examples

See complete usage examples in:

```
lib/email/examples/rfqTemplateExamples.ts
```

## Integration

### With Zoho Mail (Transactional)

```typescript
import { rfqMatchEmail } from '@/lib/email/rfqTemplates';
import { sendTransactionalEmail } from '@/lib/email/zoho-client';

await sendTransactionalEmail({
  to: 'supplier@example.com',
  subject: 'New RFQ Match Available',
  html: rfqMatchEmail(supplierName, rfqDetails, rfqUrl),
});
```

### With Resend

```typescript
import { rfqMatchEmail } from '@/lib/email/rfqTemplates';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@greenchainz.com',
  to: 'supplier@example.com',
  subject: 'New RFQ Match Available',
  html: rfqMatchEmail(supplierName, rfqDetails, rfqUrl),
});
```

## Best Practices

1. **Subject Lines**: Keep concise and actionable
   - ✅ "New RFQ Match: Downtown Office Complex"
   - ❌ "You have received a new notification"

2. **URLs**: Always use absolute URLs with HTTPS
   - ✅ `https://greenchainz.com/supplier/rfqs/123`
   - ❌ `/supplier/rfqs/123`

3. **Dates**: Format consistently for readability
   - ✅ "December 15, 2025"
   - ❌ "2025-12-15"

4. **Preview Text**: First 40-60 characters appear in inbox preview
   - Already optimized in hidden `<div>` at top of template

5. **Testing**: Always test with real email addresses before production
   - Use [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/) for comprehensive testing

## Troubleshooting

### Images Not Displaying

Ensure images use absolute HTTPS URLs and are hosted on a reliable CDN.

### Button Not Rendering in Outlook

Check that VML markup is present in conditional comments `<!--[if mso]>`.

### Mobile Layout Issues

Verify media queries are in `<style>` tag, not inline. Some email clients strip inline media queries.

### Text Encoding Issues

All templates use UTF-8 charset. Ensure email service preserves encoding.

## Contributing

When modifying templates:

1. Update TypeScript types
2. Add/update unit tests
3. Run linter: `npm run lint`
4. Test in multiple email clients
5. Update this README if adding new features

## License

Internal use only - GreenChainz B2B Marketplace
