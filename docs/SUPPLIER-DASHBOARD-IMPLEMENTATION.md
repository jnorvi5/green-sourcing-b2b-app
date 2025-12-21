# Supplier Dashboard Implementation

## Overview
This document describes the comprehensive Supplier Dashboard implementation for the GreenChainz B2B marketplace platform.

## Location
- **Main File**: `app/supplier/dashboard/page.tsx`
- **Type Definitions**: `types/supplier-dashboard.ts`

## Features Implemented

### 1. Stats Cards Grid (4 cards, responsive)
Four key metric cards that provide at-a-glance insights:

- **Total RFQ Matches**: Shows total number of RFQ opportunities (incoming RFQs + submitted quotes)
- **Pending Quotes**: Number of quotes with status 'submitted' awaiting response
- **Accepted Quotes**: Number of quotes with status 'accepted' - successful wins
- **Profile Completeness**: Percentage score (0-100%) based on:
  - Company name (20 points)
  - Description > 50 chars (20 points)
  - At least one certification (30 points)
  - At least one product listed (30 points)

### 2. Incoming RFQs Table
Displays RFQs where the supplier has been matched but hasn't submitted a quote yet.

**Data Source**: 
- `rfqs` table where `supplier.id` is in the `matched_suppliers` array
- Filtered to exclude RFQs that already have responses in `rfq_responses`
- Only shows RFQs with status 'pending'

**Columns**:
- Project Name (with architect/company name)
- Material Type (from material_specs JSONB)
- Deadline (formatted date or "No deadline")
- Match Score (placeholder at 85%, would need actual matching algorithm)
- Submit Quote button (links to `/rfq/[rfq_id]`)

**Special Features**:
- "NEW" badge for RFQs created within last 24 hours
- Responsive table hides less critical columns on smaller screens
- Empty state with helpful message and icon

### 3. My Quotes Table
Shows all quotes the supplier has submitted.

**Data Source**:
- `rfq_responses` table joined with `rfqs` table
- Ordered by `responded_at` descending (most recent first)

**Columns**:
- Project Name (from joined rfqs table)
- Price (formatted with locale currency)
- Status (color-coded badge: yellow=pending, green=accepted, red=rejected)
- Submitted Date (formatted)

**Special Features**:
- Color-coded status badges for quick visual scanning
- Responsive table hides less critical columns on mobile
- Empty state encouraging suppliers to respond to RFQs

### 4. Quick Actions Panel
Three primary action buttons for common supplier tasks:

- **Add Product**: Links to `/supplier/products/new`
  - Icon: Plus symbol
  - Color: Teal accent
  
- **Upload Certification**: Links to `/supplier/certifications/upload`
  - Icon: Cloud upload
  - Color: Blue accent
  
- **Edit Profile**: Links to `/supplier/profile`
  - Icon: Pencil/edit
  - Color: Purple accent

**Additional Widget**:
- Profile Completeness progress bar (shown if < 100%)
- Visual progress indicator with percentage
- Motivational message about increased RFQ matches

## Design System

### Color Palette
- **Background**: Gradient from gray-950 via gray-900 to black
- **Primary Accent**: Teal (teal-400, teal-500)
- **Cards**: White/5 with backdrop blur
- **Borders**: White/10 for subtle separation
- **Status Colors**:
  - Pending/Warning: Yellow (yellow-400, yellow-500)
  - Success/Accepted: Green (green-400, green-500)
  - Error/Rejected: Red (red-400, red-500)
  - Info: Blue (blue-400, blue-500)
  - Secondary: Purple (purple-400, purple-500)

### Typography
- **Headings**: Bold, large (text-2xl to text-3xl on desktop)
- **Body**: Regular weight, text-sm to text-base
- **Labels**: Gray-400 for secondary text
- **Numbers/Stats**: Bold, large, accent colors

### Responsive Design
- **Mobile (< 640px)**: Single column layout, 2-column stats grid
- **Tablet (640px - 1024px)**: 2-column layouts
- **Desktop (> 1024px)**: 3-column grid with 2/3 + 1/3 split for main content

## Database Schema

### Tables Used

#### `suppliers`
```sql
- id: UUID (primary key)
- user_id: UUID (references users)
- company_name: TEXT
- description: TEXT
- certifications: JSONB (array of certification objects)
- geographic_coverage: TEXT[]
```

#### `rfqs`
```sql
- id: UUID (primary key)
- architect_id: UUID (references users)
- project_name: TEXT
- material_specs: JSONB (contains material_type, quantity, etc.)
- delivery_deadline: DATE
- status: rfq_status ('pending', 'responded', 'closed', 'expired')
- matched_suppliers: UUID[] (array of supplier IDs)
- created_at: TIMESTAMPTZ
```

#### `rfq_responses` (aka "quotes")
```sql
- id: UUID (primary key)
- rfq_id: UUID (references rfqs)
- supplier_id: UUID (references suppliers)
- quote_amount: NUMERIC(12,2)
- status: rfq_response_status ('submitted', 'accepted', 'rejected')
- responded_at: TIMESTAMPTZ
```

#### `products`
```sql
- id: UUID (primary key)
- supplier_id: UUID (references suppliers)
- product_name: TEXT
- material_type: material_type (enum)
- description: TEXT
```

## Type Safety

All components use strict TypeScript with no `any` types:

```typescript
interface DashboardStats {
  totalRfqMatches: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  profileCompleteness: number;
}

interface IncomingRfq {
  id: string;
  project_name: string;
  material_type: string;
  delivery_deadline: string | null;
  match_score: number;
  created_at: string;
  architect: {
    full_name: string | null;
    company_name: string | null;
  };
}

interface SupplierQuote {
  id: string;
  rfq_id: string;
  quote_amount: number;
  status: 'submitted' | 'accepted' | 'rejected';
  responded_at: string;
  rfq: {
    project_name: string;
  };
}
```

## Error Handling

The dashboard implements comprehensive error handling:

1. **Authentication Check**: Redirects to login if user not authenticated
2. **Supplier Profile Check**: Shows error message if supplier profile missing
3. **Query Error Handling**: Logs errors and continues with empty data
4. **Error State UI**: Red-themed error card with retry button
5. **Loading State**: Animated spinner with "Loading dashboard..." message

## Performance Considerations

1. **Efficient Queries**: 
   - Uses Supabase select with specific columns
   - Joins are done at database level
   - Filters applied in SQL, not in application code

2. **Loading States**: 
   - Shows loading spinner immediately
   - Graceful degradation if data fails to load

3. **Responsive Images**: 
   - SVG icons for scalability
   - No heavy image assets

## Future Enhancements

1. **Real Match Scoring**: Implement actual matching algorithm instead of placeholder 85%
2. **Pagination**: Add pagination for RFQs and quotes tables
3. **Filters**: Add filtering by status, date range, material type
4. **Search**: Add search functionality for projects
5. **Analytics**: Add charts showing quote acceptance rate over time
6. **Notifications**: Badge showing count of new RFQs
7. **Quick Quote**: Allow submitting quotes directly from table row
8. **Export**: Allow exporting quote history as CSV/PDF

## Testing

To test the dashboard:

1. Ensure Supabase is configured with proper environment variables
2. Create a test supplier account in the `users` and `suppliers` tables
3. Add sample data to `rfqs` with the supplier in `matched_suppliers`
4. Add sample quotes in `rfq_responses`
5. Navigate to `/supplier/dashboard`

## Notes

- The dashboard follows the existing pattern used in the architect dashboard
- Uses Next.js 14 App Router with client-side components ('use client')
- Follows the custom repository instructions for TypeScript strict mode
- Uses Tailwind CSS utility classes exclusively (no custom CSS)
- Mobile-first responsive design approach
