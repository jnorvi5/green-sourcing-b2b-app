# Admin Certification Verification Feature

## Overview

The Admin Certification Verification feature enables "White Glove" manual review and verification of supplier certifications. This Phase 3 feature allows admin users to review uploaded certification PDFs, verify authentic certifications, and reject invalid submissions with feedback.

## Features

### For Admins

- **Dashboard Access**: `/admin/certifications`
- **Stats Cards**: View Total Pending, Verified Today, and Rejected Today counts
- **Search & Filter**: Search suppliers by company name
- **Certification Queue**: View all suppliers with uploaded certifications
- **Review Actions**:
  - View PDF in new tab
  - Verify certification (sends success email)
  - Reject certification (requires reason, sends rejection email with admin notes)

### Security

- **Admin-only Access**: Protected by both client-side auth check and server-side role verification
- **Row Level Security**: Supabase RLS policies ensure only admins can manage certifications
- **XSS Prevention**: All email content is HTML-escaped to prevent injection attacks

## Database Schema

### New Fields in `suppliers` Table

```sql
cert_pdf_url TEXT                    -- URL to uploaded certification PDF
cert_verified BOOLEAN DEFAULT false  -- Verification status
cert_verification_date TIMESTAMPTZ   -- Date of verification/rejection
cert_type TEXT                       -- Type of certification (FSC, B Corp, ISO 14001)
cert_rejection_reason TEXT           -- Admin notes for rejected certs
cert_uploaded_at TIMESTAMPTZ         -- Upload timestamp
```

### Indexes

- `idx_suppliers_pending_certs`: Fast filtering of pending certifications
- `idx_suppliers_verification_date`: Optimized queries for stats

## Email Templates

### Verification Success Email

- **Subject**: "Your certification has been verified!"
- **Styling**: Teal gradient header, verified badge
- **Content**: Company details, certification type, status badge, next steps
- **CTA**: "View Your Dashboard" button

### Rejection Email

- **Subject**: "Please re-upload your certification"
- **Styling**: Gray gradient header, admin notes section
- **Content**: Submission details, admin feedback, next steps
- **CTA**: "Re-upload Certification" button

Both templates:
- Use Teal (#14b8a6) brand color
- Include HTML escaping for security
- Are mobile-responsive
- Include footer with year and legal links

## API / Server Actions

### `fetchPendingCertifications()`

Fetches all suppliers with uploaded certifications, including:
- Verified certifications
- Pending certifications
- Rejected certifications

Returns: `CertificationPendingSupplier[]`

### `fetchVerificationStats()`

Calculates dashboard statistics:
- Total pending (not verified, not rejected, has cert_pdf_url)
- Verified today (cert_verified = true, today's date)
- Rejected today (has rejection_reason, today's date)

Returns: `VerificationStats`

### `verifyCertification({ supplierId })`

Verifies a certification:
1. Checks admin role
2. Updates supplier record (cert_verified = true)
3. Sends verification email via Resend
4. Returns success/error result

### `rejectCertification({ supplierId, reason })`

Rejects a certification:
1. Checks admin role
2. Validates rejection reason
3. Updates supplier record (cert_pdf_url = null, adds rejection_reason)
4. Sends rejection email with admin notes
5. Returns success/error result

## UI/UX Design

### Dark Theme

- **Background**: Gradient from gray-950 → gray-900 → black
- **Cards**: Glassmorphism with `bg-white/5`, `backdrop-blur-sm`, `border-white/10`
- **Accents**: Teal-500 for primary actions, green for verified, red for rejected
- **Typography**: White for primary text, gray-300/400 for secondary

### Responsive Layout

- **Mobile**: Single column, stacked cards
- **Tablet**: 2-3 column grid for stats
- **Desktop**: Full-width table with horizontal scroll

### Loading States

- Spinner with teal border during initial load
- Disabled buttons with loading spinner during actions
- Processing state prevents duplicate submissions

### Error Handling

- Auth errors redirect to login
- Unauthorized access shows error card
- API errors display via alerts (could be enhanced with toast notifications)

## Testing

### Email Template Tests

Located in `lib/email/__tests__/certificationTemplates.test.ts`:

- ✅ HTML structure validation
- ✅ HTML escaping for XSS prevention
- ✅ Correct content rendering
- ✅ Brand color presence
- ✅ CTA links
- ✅ Edge cases (apostrophes, ampersands, special characters)

**Test Coverage**: 20 passing tests

## Usage Example

### For Suppliers (to be implemented)

```typescript
// Upload certification
await uploadCertification({
  file: pdfFile,
  certType: 'FSC',
});
```

### For Admins

1. Navigate to `/admin/certifications`
2. View pending certifications in the queue
3. Click "View PDF" to review the document
4. Click "Verify" to approve (sends success email)
5. Or click "Reject", provide reason, and submit (sends rejection email)

## Environment Variables

```bash
# Required for email notifications
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@greenchainz.com

# For email links
NEXT_PUBLIC_BASE_URL=https://greenchainz.com
```

## Future Enhancements

- [ ] Toast notifications instead of alerts
- [ ] Bulk verify/reject actions
- [ ] Certification expiry tracking and reminders
- [ ] Integration with Azure AI Document Intelligence for auto-verification
- [ ] Audit log for all verification actions
- [ ] Supplier notification when certification is about to expire
- [ ] Filter by certification type (FSC, B Corp, ISO 14001, etc.)
- [ ] Export certifications list to CSV
- [ ] Advanced search (by date range, status, etc.)

## Related Files

- **Migration**: `supabase/migrations/20251207_add_cert_verification_fields.sql`
- **Types**: `types/certification-verification.ts`
- **Server Actions**: `app/actions/certificationVerification.ts`
- **Email Templates**: `lib/email/certificationTemplates.ts`
- **Admin Page**: `app/admin/certifications/page.tsx`
- **Tests**: `lib/email/__tests__/certificationTemplates.test.ts`
