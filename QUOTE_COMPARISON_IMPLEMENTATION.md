# Quote Comparison Page Implementation

## Overview
This implementation adds a complete quote comparison page for architects to view and compare supplier quotes for their RFQs. The page follows the dark theme design pattern used throughout the GreenChainz application.

## Files Created

### 1. Types (`types/rfq.ts`)
Defines TypeScript interfaces for:
- `RFQ`: Request for Quote data structure
- `Supplier`: Supplier profile data
- `Quote`: Individual quote/response data
- `QuoteWithSupplier`: Quote with embedded supplier information
- `RFQWithQuotes`: Complete RFQ data with all related quotes

All types use strict TypeScript (no `any` types) and match the Supabase database schema.

### 2. Server Actions (`app/actions/quotes.ts`)
Implements three key server-side functions:

#### `getRFQWithQuotes(rfqId: string)`
- Fetches an RFQ and all its associated quotes
- Validates user authentication and authorization
- Returns quotes with embedded supplier data using Supabase joins
- Handles errors gracefully with typed error responses

#### `acceptQuote(input: { quoteId, rfqId })`
- Updates quote status to 'accepted' in the database
- Validates user owns the RFQ before allowing action
- Logs email notification to `email_logs` table for supplier
- Uses Zod schema validation for input safety

#### `exportQuotesToCSV(quotes: Quote[])`
- Converts quote data to CSV format
- Properly escapes CSV fields
- Returns formatted string ready for download

### 3. Quote Comparison Page (`app/architect/rfqs/[id]/quotes/page.tsx`)
A responsive Next.js client component that:

#### Features Implemented:
✅ **RFQ Summary Section**
- Displays project name, material category, and quantity
- Shows RFQ message/details
- Styled with dark theme glass-morphism card

✅ **Responsive Layout**
- Desktop: Full comparison table with all columns
- Mobile: Card-based layout for better UX
- Uses Tailwind's `hidden md:block` and `md:hidden` classes

✅ **Sorting Functionality**
- Sortable "Price" and "Lead Time" columns
- Click column header to toggle sort direction
- Visual indicators (↑/↓) show current sort state
- Default: No sorting, shows quotes in database order

✅ **Smart Badges**
- **Lowest Price Badge** (green): Automatically highlights the cheapest quote
- **Best Sustainability Badge** (teal): Highlights supplier with best tier (verified > standard > free)

✅ **Expandable Notes**
- Notes preview with "Show more/Show less" toggle
- Uses `line-clamp-2` (desktop) and `line-clamp-3` (mobile) for truncation
- Tracks expanded state per quote using Set

✅ **PDF Download**
- Shows PDF download button if `pdf_url` exists on quote
- Uses HTML5 download attribute for direct download

✅ **Accept Quote Action**
- "Accept Quote" button for submitted quotes
- Confirmation dialog before accepting
- Disables button during processing with loading state
- Shows "Accepted" status badge for accepted quotes
- Triggers email notification to supplier via server action

✅ **Export to CSV**
- Button to export all quotes to CSV file
- Downloads as `rfq-{id}-quotes.csv`
- Includes all relevant quote data

✅ **Empty State**
- "No quotes yet" message with icon when no quotes exist
- Friendly message encouraging users to check back later

✅ **Loading State**
- Animated spinner during data fetch
- Prevents rendering until data is loaded

✅ **Error Handling**
- Catches and displays errors gracefully
- Shows error message with back-to-dashboard link
- Validates user permissions server-side

## Design Patterns

### Dark Theme
Follows existing GreenChainz dark theme with:
- `bg-gradient-to-br from-gray-950 via-gray-900 to-black` - Background gradient
- `bg-white/5 backdrop-blur-sm border border-white/10` - Glass-morphism cards
- `text-white` for primary text, `text-gray-400` for secondary text
- `bg-teal-500 hover:bg-teal-400` for primary actions
- `bg-green-500/10 text-green-400` for success badges
- `bg-teal-500/10 text-teal-400` for sustainability badges

### TypeScript Strict Mode
All code uses:
- No `any` types
- Proper null checking with optional chaining
- Zod validation for all server-side inputs
- Type-safe database queries with Supabase

### Server Actions Pattern
Following Next.js 14 App Router best practices:
- All mutations use Server Actions (not API routes)
- Type-safe with Zod validation
- Proper error handling and user feedback
- Authentication checks on every action

## Database Schema Requirements

The implementation expects these Supabase tables:

### `rfqs` table
- `id` (UUID, primary key)
- `architect_id` (UUID, foreign key to users)
- `product_id` (UUID, nullable)
- `project_name` (TEXT)
- `project_location` (TEXT)
- `material_specs` (JSONB) - includes quantity, unit, material_type
- `message` (TEXT, nullable)
- `status` (ENUM: pending, responded, closed, expired)
- timestamps

### `rfq_responses` table
- `id` (UUID, primary key)
- `rfq_id` (UUID, foreign key to rfqs)
- `supplier_id` (UUID, foreign key to suppliers)
- `quote_amount` (NUMERIC)
- `lead_time_days` (INTEGER)
- `message` (TEXT, nullable)
- `pdf_url` (TEXT, nullable) - for quote PDFs
- `status` (ENUM: submitted, accepted, rejected)
- `responded_at` (TIMESTAMPTZ)

### `suppliers` table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `company_name` (TEXT)
- `tier` (ENUM: free, standard, verified)
- Other fields...

### `email_logs` table
- For logging email notifications when quotes are accepted
- Fields: to_email, from_email, subject, email_type, provider, status, metadata

## Usage

### Accessing the Page
Navigate to: `/architect/rfqs/[rfq-id]/quotes`

Where `[rfq-id]` is the UUID of the RFQ to view quotes for.

### User Flow
1. Architect views their RFQs in the dashboard
2. Clicks on an RFQ to see quotes
3. Views all supplier quotes in comparison table
4. Sorts by price or lead time to find best option
5. Reviews supplier profiles via linked company names
6. Checks sustainability scores and badges
7. Accepts a quote (triggers email to supplier)
8. Optionally exports all quotes to CSV for records

## Security

### Authorization
- All server actions verify user authentication
- RFQ ownership validated before allowing actions
- Row Level Security (RLS) policies should be enabled on Supabase tables

### Input Validation
- All inputs validated with Zod schemas
- UUIDs validated before database queries
- XSS protection via React's built-in escaping

## Future Enhancements

Potential improvements for future iterations:
1. Real-time email sending integration (currently only logs to database)
2. More sophisticated sustainability scoring algorithm
3. Quote comparison charts/visualizations
4. Bulk actions (accept multiple quotes, reject quotes)
5. Quote history and audit trail
6. Negotiation/counter-offer workflow
7. Integration with actual PDF storage service
8. Filters for quote status, price range, etc.
9. Save comparison preferences
10. Print-friendly view

## Testing

To test this implementation:

1. **Prerequisites:**
   - Supabase project with schema deployed
   - Sample RFQ created in database
   - Sample quotes (rfq_responses) created for that RFQ
   - User authenticated as architect who owns the RFQ

2. **Manual Testing:**
   ```
   # Start development server
   npm run dev
   
   # Navigate to quote comparison page
   http://localhost:3000/architect/rfqs/{your-rfq-id}/quotes
   ```

3. **Test Cases:**
   - [ ] Page loads with RFQ summary displayed correctly
   - [ ] Quotes display in table (desktop) and cards (mobile)
   - [ ] Sorting by price works in both directions
   - [ ] Sorting by lead time works in both directions
   - [ ] Lowest price badge appears on correct quote
   - [ ] Best sustainability badge appears on verified tier supplier
   - [ ] Notes expand/collapse correctly
   - [ ] Accept quote updates database and shows success message
   - [ ] CSV export downloads with correct data
   - [ ] Empty state shows when no quotes exist
   - [ ] Error handling works for invalid RFQ IDs
   - [ ] Authorization prevents viewing other users' RFQs

## Code Quality

- ✅ Strict TypeScript (no `any` types)
- ✅ ESLint compliant
- ✅ Follows Next.js 14 App Router conventions
- ✅ Uses Zod for runtime validation
- ✅ Proper error handling throughout
- ✅ Responsive design with Tailwind CSS
- ✅ Accessibility considerations (semantic HTML, proper button types)
- ✅ Performance optimized (memoization where needed)
