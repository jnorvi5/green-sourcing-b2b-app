# RFQ API Implementation Guide

## Overview

This document describes the implementation of the RFQ (Request for Quote) creation API endpoint, which handles architect-initiated RFQs with automated supplier matching and email notifications.

## API Endpoint

**POST /api/rfqs**

Creates a new RFQ, matches it with relevant suppliers, and sends notification emails.

## Features Implemented

### 1. Authentication & Authorization
- ✅ Verifies user is authenticated via Supabase auth
- ✅ Checks user has `architect` role from `profiles` table
- ✅ Returns appropriate status codes:
  - `401` if not authenticated
  - `403` if user is not an architect
  - `404` if user profile not found

### 2. Request Validation (Zod Schema)
- ✅ Validates required fields:
  - `project_name` (string, 1-200 chars)
  - `project_location` (string, 1-200 chars)
  - `material_specs.material_type` (enum of valid material types)
- ✅ Validates optional fields:
  - `material_specs.quantity` (positive number)
  - `material_specs.unit` (string)
  - `budget_range` (string)
  - `delivery_deadline` (ISO 8601 datetime)
  - `required_certifications` (array of strings)
  - `message` (string, max 2000 chars)
  - `product_id` (UUID)
- ✅ Returns `400` with field-specific errors if validation fails

### 3. RFQ Creation
- ✅ Inserts RFQ into `rfqs` table with status `pending`
- ✅ Associates with authenticated architect's user ID
- ✅ Returns `500` if database insertion fails

### 4. Supplier Matching Algorithm
- ✅ Queries `products` table for items matching `material_type`
- ✅ Joins with `suppliers` table to get supplier details
- ✅ Deduplicates suppliers (one supplier may have multiple products)
- ✅ Creates `rfq_matches` records with:
  - `match_score`: 100 for exact material category match
  - `match_reason`: Human-readable explanation
  - `notification_sent`: Initially `false`

### 5. Email Notifications via Resend
- ✅ Sends professional HTML email to each matched supplier
- ✅ Email includes:
  - Subject: "New RFQ Match: [project_name]"
  - Project details (name, location, material type, quantity, budget, deadline)
  - Architect information (name, company if available)
  - Additional requirements/message
  - Direct link to RFQ: `/rfq/[rfq_id]`
- ✅ Updates `rfq_matches` on successful send:
  - Sets `notification_sent` to `true`
  - Records `notification_sent_at` timestamp
  - Stores `notification_email` address
- ✅ Gracefully handles email failures (logs error but doesn't fail RFQ creation)

### 6. Response Format
Success response (201):
```json
{
  "success": true,
  "rfq_id": "uuid-here",
  "matched_suppliers_count": 3,
  "message": "RFQ created successfully. Matched with 3 supplier(s)."
}
```

Error responses follow standard format:
```json
{
  "error": "Error message",
  "details": { /* field-specific errors or additional info */ }
}
```

## Database Schema

### New Table: `rfq_matches`

```sql
CREATE TABLE rfq_matches (
  id UUID PRIMARY KEY,
  rfq_id UUID REFERENCES rfqs(id),
  supplier_id UUID REFERENCES suppliers(id),
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  CONSTRAINT unique_rfq_supplier_match UNIQUE (rfq_id, supplier_id)
);
```

### Row Level Security (RLS)
- Architects can view matches for their RFQs
- Suppliers can view their own matches
- Admins can view all matches

## Environment Variables Required

Add to `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@greenchainz.com

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3001  # or production URL
```

## Material Types Supported

The API validates `material_type` against these enum values:
- `insulation`
- `flooring`
- `cladding`
- `roofing`
- `structural`
- `glazing`
- `finishes`
- `hvac`
- `plumbing`
- `electrical`
- `other`

## Example Request

```bash
curl -X POST http://localhost:3001/api/rfqs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "project_name": "Green Office Building",
    "project_location": "Seattle, WA, USA",
    "material_specs": {
      "material_type": "insulation",
      "quantity": 5000,
      "unit": "sqft"
    },
    "budget_range": "$50K-$75K",
    "delivery_deadline": "2024-12-31T00:00:00Z",
    "message": "Need eco-friendly materials with low carbon footprint",
    "required_certifications": ["LEED", "FSC"]
  }'
```

## Testing

Comprehensive unit tests are located in:
`app/api/rfqs/__tests__/route.test.ts`

Run tests:
```bash
npm test -- app/api/rfqs/__tests__/route.test.ts
```

Test coverage includes:
- ✅ Authentication checks
- ✅ Authorization (architect role requirement)
- ✅ Input validation (required and optional fields)
- ✅ RFQ creation success/failure scenarios
- ✅ Supplier matching logic
- ✅ Email notification sending

## Error Handling

The API implements robust error handling:
1. **Validation Errors (400)**: Returns specific field errors
2. **Authentication Errors (401)**: User not logged in
3. **Authorization Errors (403)**: User lacks required role
4. **Not Found Errors (404)**: User profile missing
5. **Server Errors (500)**: Database or unexpected errors

All errors are logged to console with `[RFQ]` prefix for easy filtering.

## Future Enhancements

Potential improvements for future iterations:

1. **Partial Matching**: Implement score of 50 for related but not exact material types
2. **Geographic Matching**: Factor in supplier location vs project location
3. **Certification Matching**: Boost match score for suppliers with required certifications
4. **Capacity Checks**: Consider supplier's current workload and capacity
5. **Historical Performance**: Weight matches by past successful quotes/orders
6. **Async Processing**: Move matching and notifications to background queue for large supplier lists
7. **Batch Notifications**: Consolidate multiple RFQ notifications into digest emails
8. **Real-time Notifications**: Add WebSocket support for instant supplier notifications

## Files Modified/Created

1. **Created**: `app/api/rfqs/route.ts` - Main API endpoint
2. **Created**: `lib/email/resend.ts` - Email service utility
3. **Created**: `supabase/migrations/20251207_create_rfq_matches.sql` - Database migration
4. **Created**: `app/api/rfqs/__tests__/route.test.ts` - Unit tests
5. **Modified**: `.env.example` - Added Resend configuration
6. **Modified**: `package.json` - Fixed syntax error, added Resend dependency

## Related Documentation

- [Supabase Authentication](../SUPABASE-OAUTH-SETUP.md)
- [Database Schema](../database-schemas/supabase_production_schema.sql)
- [Email Notification System](../NOTIFICATION-SYSTEM.md)

## Support

For questions or issues with the RFQ API:
1. Check the console logs for `[RFQ]` prefixed messages
2. Verify environment variables are set correctly
3. Ensure database migrations have been run
4. Check Resend API key is valid and domain is verified
5. Review test cases for expected behavior examples
