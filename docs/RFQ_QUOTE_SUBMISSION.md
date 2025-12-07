# RFQ Quote Submission Feature

## Overview

This feature allows matched suppliers to view RFQ (Request for Quote) details and submit or edit their quotes through a dedicated page at `/rfq/[id]`.

## Architecture

### Components

1. **Server Component** (`app/rfq/[id]/page.tsx`)
   - Handles authentication and authorization
   - Fetches RFQ data with architect profile
   - Verifies supplier is in `matched_suppliers` array
   - Checks for existing quotes
   - Passes data to client component

2. **Client Component** (`app/rfq/[id]/RFQDetailClient.tsx`)
   - Displays RFQ details
   - Shows existing quote with edit option
   - Provides quote submission form
   - Handles PDF upload to Supabase Storage
   - Manages form state and submission

3. **API Route** (`app/api/rfq/quote/route.ts`)
   - POST endpoint for quote submissions
   - Validates supplier authorization
   - Inserts/updates quotes in `rfq_responses` table
   - Updates RFQ status to 'responded'

### Database Schema

#### Tables Used

**rfqs** (from `supabase_production_schema.sql`)
```sql
- id: UUID (primary key)
- architect_id: UUID (references users)
- project_name: TEXT
- project_location: TEXT
- material_specs: JSONB
- budget_range: TEXT
- delivery_deadline: DATE
- message: TEXT
- status: rfq_status (pending/responded/closed/expired)
- matched_suppliers: UUID[] (array of supplier IDs)
```

**rfq_responses** (from `supabase_production_schema.sql`)
```sql
- id: UUID (primary key)
- rfq_id: UUID (references rfqs)
- supplier_id: UUID (references suppliers)
- quote_amount: NUMERIC
- lead_time_days: INTEGER
- message: TEXT
- status: rfq_response_status (submitted/accepted/rejected)
- responded_at: TIMESTAMPTZ
```

**suppliers**
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- company_name: TEXT
```

## Access Control

### Authorization Flow

1. **Authentication Check**: User must be logged in (verified via Supabase Auth)
2. **Supplier Profile Check**: User must have a supplier profile
3. **Match Verification**: Supplier ID must be in RFQ's `matched_suppliers` array
4. **Status Check**: RFQ must not be 'closed' or 'expired'

### Error Responses

- **401 Unauthorized**: User not logged in → Redirect to `/auth/login`
- **403 Forbidden**: User is not a supplier or not matched to RFQ
- **404 Not Found**: RFQ doesn't exist
- **400 Bad Request**: RFQ is closed/expired or invalid data

## Features

### RFQ Details Display

The page shows comprehensive RFQ information:

- **Project Information**
  - Project name
  - Location
  - Status badge
  - Creation date
  - Delivery deadline

- **Material Requirements**
  - Material category/type
  - Quantity and unit
  - Project description

- **Additional Details**
  - Budget range
  - Custom message from architect
  - Required certifications

- **Architect Profile**
  - Full name
  - Company name
  - Email address

### Quote Submission Form

**Fields:**

1. **Quoted Price** (required)
   - Number input with USD currency
   - Validation: Must be positive number

2. **Lead Time** (required)
   - Text input accepting various formats
   - Examples: "2-3 weeks", "5 days", "1 month"
   - Automatically parsed to days for storage

3. **Additional Notes** (optional)
   - Textarea for detailed quote information
   - Max 2000 characters
   - Character counter displayed

4. **PDF Attachment** (optional)
   - File upload accepting .pdf only
   - Uploads to Supabase Storage bucket 'quotes'
   - Displays selected file name and size

### Quote Display (Existing Quote)

When a quote already exists:

- Shows quoted price (formatted as USD)
- Displays lead time in days
- Shows quote status badge
- Displays additional notes
- Shows submission timestamp
- Provides "Edit Quote" button

### UI/UX Features

- **Dark Theme**: Consistent with app's Tailwind dark theme
  - Gray-950 background
  - Gray-900 cards with gray-800 borders
  - Green-600 accent color for CTAs
  - Status badges with appropriate colors

- **Responsive Design**
  - Mobile-first approach
  - Grid layouts adapt to screen size
  - Touch-friendly buttons and inputs

- **Loading States**
  - Button disables during submission
  - Loading text replaces button label
  - Form prevents double submission

- **Error Handling**
  - Inline error messages in red alert boxes
  - Success messages in green alert boxes
  - Validation errors from API displayed clearly

## API Endpoint

### POST /api/rfq/quote

**Request Body:**
```json
{
  "rfq_id": "uuid",
  "price": 5000.00,
  "lead_time": "2-3 weeks",
  "notes": "Optional additional information",
  "pdf_url": "https://storage.url/path/to/pdf.pdf"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Quote submitted successfully",
  "quote": {
    "id": "uuid",
    "rfq_id": "uuid",
    "supplier_id": "uuid",
    "quote_amount": 5000.00,
    "lead_time_days": 17,
    "message": "Optional additional information",
    "status": "submitted",
    "responded_at": "2025-12-07T12:00:00Z"
  }
}
```

**Error Responses:**
- 401: Unauthorized
- 403: Forbidden (not matched to RFQ)
- 404: RFQ not found
- 400: Invalid data or RFQ closed
- 500: Internal server error

## Lead Time Parsing

The system automatically converts human-readable lead times to days:

| Input | Parsed Days |
|-------|-------------|
| "2-3 weeks" | 17 (average of 14-21) |
| "1 week" | 7 |
| "5 days" | 5 |
| "1 month" | 30 |
| "2-4 months" | 90 (average of 60-120) |

**Default:** If no valid time unit is found, the system assumes days.

## Storage Setup

### Supabase Storage Bucket: `quotes`

**Configuration:**
- Bucket name: `quotes`
- Public access: No (private)
- Allowed MIME types: `application/pdf`
- Max file size: 10 MB

**Setup Instructions:**

1. Via Supabase Dashboard:
   ```
   1. Go to Storage in Supabase Dashboard
   2. Click "Create bucket"
   3. Name: quotes
   4. Public: Unchecked
   5. Click "Create bucket"
   ```

2. Via Supabase CLI:
   ```bash
   supabase storage create quotes --public=false
   ```

**RLS Policies:**

See `supabase/migrations/20251207_rfq_quotes_storage.sql` for detailed RLS policies.

## TypeScript Types

All types are strictly typed with no `any` types used.

**Location:** `types/rfq.ts`

**Key Interfaces:**
- `RFQ`: Base RFQ type
- `RFQWithArchitect`: RFQ with nested architect profile
- `RFQResponse`: Supplier quote response
- `QuoteSubmission`: Form data type
- `QuoteApiRequest`: API request payload

**Zod Schemas:**
- `QuoteSubmissionSchema`: Client-side validation
- `QuoteApiRequestSchema`: Server-side validation

## Testing

### Manual Testing Steps

1. **As a Supplier:**
   ```
   1. Log in with supplier account
   2. Navigate to /rfq/{rfq-id}
   3. Verify RFQ details display correctly
   4. Fill out quote form
   5. (Optional) Upload PDF
   6. Submit quote
   7. Verify success message
   8. Verify quote displays correctly
   9. Click "Edit Quote"
   10. Update quote values
   11. Submit again
   12. Verify updated quote displays
   ```

2. **Authorization Testing:**
   ```
   1. Try accessing RFQ as non-matched supplier → Should see "Not Matched" error
   2. Try accessing as architect → Should see "Access Denied" error
   3. Try accessing without login → Should redirect to /auth/login
   ```

3. **Edge Cases:**
   ```
   1. Submit quote for closed RFQ → Should see error
   2. Submit with invalid price (negative) → Should see validation error
   3. Submit with empty required fields → Should see validation error
   4. Submit without PDF → Should work fine
   5. Submit with large PDF (>10MB) → Should see error
   ```

## Future Enhancements

1. **Email Notifications**
   - Notify architect when quote is submitted
   - Notify supplier when quote is accepted/rejected

2. **Quote Comparison**
   - Allow architects to see all quotes side-by-side
   - Highlight best value

3. **Quote Expiration**
   - Add expiration date to quotes
   - Automatically mark expired quotes

4. **Communication Thread**
   - Allow back-and-forth messaging between architect and supplier
   - Quote clarifications and negotiations

5. **Document Management**
   - Support multiple PDF attachments
   - Version control for quote PDFs
   - Download all attachments as ZIP

## Maintenance Notes

### Dependencies

- `@supabase/ssr`: For server-side Supabase client
- `zod`: For validation schemas
- Next.js 14 App Router
- React Icons (if used for icons)

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Code Locations

- Page: `app/rfq/[id]/page.tsx`
- Client Component: `app/rfq/[id]/RFQDetailClient.tsx`
- API Route: `app/api/rfq/quote/route.ts`
- Types: `types/rfq.ts`
- Migration: `supabase/migrations/20251207_rfq_quotes_storage.sql`

## Troubleshooting

### Common Issues

1. **"Not Matched" error for valid supplier**
   - Check that supplier ID is in RFQ's `matched_suppliers` array
   - Verify supplier profile exists and is linked to correct user

2. **PDF upload fails**
   - Verify 'quotes' bucket exists in Supabase Storage
   - Check RLS policies are correctly configured
   - Ensure file is under 10MB and is a PDF

3. **Quote submission fails with 500 error**
   - Check API route logs in Vercel/console
   - Verify database schema matches expected structure
   - Check Supabase connection and permissions

4. **Page shows "Access Denied"**
   - User must have a supplier profile
   - Verify `suppliers` table has entry for user
   - Check `user_id` foreign key is correct

## Security Considerations

1. **Row Level Security (RLS)**
   - All database queries are subject to RLS policies
   - Suppliers can only see RFQs they're matched to
   - Suppliers can only insert/update their own quotes

2. **Input Validation**
   - All inputs validated with Zod schemas
   - Price must be positive number
   - Notes limited to 2000 characters
   - Lead time validated as non-empty string

3. **File Upload Security**
   - Only PDF files allowed
   - Files stored in private bucket
   - File size limited (enforced by Supabase)
   - RLS policies control access

4. **Authentication**
   - All routes require authentication
   - Server components verify auth before rendering
   - API routes check auth on every request

## Performance

- Server components fetch data on server (no client-side loading)
- Dynamic route with ISR could be enabled if needed
- PDF uploads are direct to Supabase Storage (no server intermediary)
- Form submission is client-side with optimistic UI updates
