# Test Data Example for Quote Comparison Page

## Sample Data Structure

### Sample RFQ
```sql
-- Insert sample RFQ
INSERT INTO rfqs (
  id,
  architect_id,
  product_id,
  project_name,
  project_location,
  material_specs,
  budget_range,
  delivery_deadline,
  required_certifications,
  message,
  status,
  matched_suppliers
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '987e6543-e89b-12d3-a456-426614174999', -- architect user id
  NULL,
  'Green Office Building',
  'Seattle, WA, USA',
  '{"quantity": 5000, "unit": "sqft", "material_type": "insulation"}'::jsonb,
  '$10K-$20K',
  '2025-03-01',
  ARRAY['FSC', 'LEED'],
  'Need FSC certified insulation for LEED Gold project. Must meet R-30 rating. Prefer recycled content.',
  'pending',
  ARRAY[]::uuid[]
);
```

### Sample Suppliers
```sql
-- Supplier 1: Verified tier with best sustainability
INSERT INTO suppliers (
  id,
  user_id,
  company_name,
  tier,
  certifications,
  geographic_coverage,
  total_rfqs_received,
  total_rfqs_won,
  avg_response_time_hours
) VALUES (
  'aaa11111-e89b-12d3-a456-426614174001',
  'user1111-e89b-12d3-a456-426614174001',
  'EcoMaterials Co.',
  'verified',
  '[{"type": "FSC", "cert_number": "FSC-C123456", "expiry": "2025-12-31"}, {"type": "ISO 14001"}]'::jsonb,
  ARRAY['US-WA', 'US-OR', 'US-CA'],
  45,
  23,
  4.5
);

-- Supplier 2: Standard tier with PDF quote
INSERT INTO suppliers (
  id,
  user_id,
  company_name,
  tier,
  certifications,
  geographic_coverage,
  total_rfqs_received,
  total_rfqs_won,
  avg_response_time_hours
) VALUES (
  'bbb22222-e89b-12d3-a456-426614174002',
  'user2222-e89b-12d3-a456-426614174002',
  'GreenSupply Inc.',
  'standard',
  '[{"type": "ISO 9001"}]'::jsonb,
  ARRAY['US-WA'],
  28,
  12,
  8.2
);

-- Supplier 3: Free tier
INSERT INTO suppliers (
  id,
  user_id,
  company_name,
  tier,
  certifications,
  geographic_coverage,
  total_rfqs_received,
  total_rfqs_won,
  avg_response_time_hours
) VALUES (
  'ccc33333-e89b-12d3-a456-426614174003',
  'user3333-e89b-12d3-a456-426614174003',
  'Sustainable Materials',
  'free',
  '[]'::jsonb,
  ARRAY['US-WA', 'US-ID'],
  10,
  3,
  12.0
);
```

### Sample Quotes/Responses
```sql
-- Quote 1: Lowest price, best sustainability (verified tier)
INSERT INTO rfq_responses (
  id,
  rfq_id,
  supplier_id,
  quote_amount,
  lead_time_days,
  message,
  status,
  responded_at
) VALUES (
  'q1111111-e89b-12d3-a456-426614174101',
  '123e4567-e89b-12d3-a456-426614174000',
  'aaa11111-e89b-12d3-a456-426614174001',
  15000.00,
  14,
  'We can meet your requirements with our FSC-certified cellulose insulation made from 85% recycled newsprint. R-30 rating guaranteed. Includes installation within Seattle metro area.',
  'submitted',
  NOW() - INTERVAL '2 days'
);

-- Quote 2: Mid-price, fastest lead time, includes PDF
INSERT INTO rfq_responses (
  id,
  rfq_id,
  supplier_id,
  quote_amount,
  lead_time_days,
  message,
  status,
  responded_at
) VALUES (
  'q2222222-e89b-12d3-a456-426614174102',
  '123e4567-e89b-12d3-a456-426614174000',
  'bbb22222-e89b-12d3-a456-426614174002',
  16500.00,
  10,
  'Fast delivery available! Our fiberglass insulation meets all your specs. See attached PDF for detailed specifications and certifications.',
  'submitted',
  NOW() - INTERVAL '1 day'
);

-- Note: Add pdf_url column to rfq_responses table if needed
-- UPDATE rfq_responses SET pdf_url = 'https://example.com/quotes/q2222222.pdf' 
-- WHERE id = 'q2222222-e89b-12d3-a456-426614174102';

-- Quote 3: Highest price, longest lead time
INSERT INTO rfq_responses (
  id,
  rfq_id,
  supplier_id,
  quote_amount,
  lead_time_days,
  message,
  status,
  responded_at
) VALUES (
  'q3333333-e89b-12d3-a456-426614174103',
  '123e4567-e89b-12d3-a456-426614174000',
  'ccc33333-e89b-12d3-a456-426614174003',
  18200.00,
  21,
  NULL,
  'submitted',
  NOW() - INTERVAL '3 hours'
);
```

## Expected Page Behavior with This Data

### URL
```
http://localhost:3000/architect/rfqs/123e4567-e89b-12d3-a456-426614174000/quotes
```

### RFQ Summary Display
```
Project Name:       Green Office Building
Material Category:  insulation
Quantity:           5000 sqft

Details:
Need FSC certified insulation for LEED Gold project. Must meet R-30 rating. 
Prefer recycled content.
```

### Quotes Table (Unsorted)
```
| Supplier           | Price    | Lead Time | Sustainability | Notes          | Actions      |
|--------------------|----------|-----------|----------------|----------------|--------------|
| EcoMaterials Co.   | $15,000  | 14 days   | Verified       | We can meet... | [Accept]     |
|                    | [Lowest] |           | [Best]         | [Show more]    |              |
| GreenSupply Inc.   | $16,500  | 10 days   | Standard       | Fast delivery..| [PDF][Accept]|
|                    |          |           |                | [Show more]    |              |
| Sustainable Mat... | $18,200  | 21 days   | Free           | No notes       | [Accept]     |
```

### Sorting by Price (Ascending - Default)
Same order as above (already sorted by lowest to highest)

### Sorting by Price (Descending)
```
1. Sustainable Materials - $18,200
2. GreenSupply Inc. - $16,500
3. EcoMaterials Co. - $15,000 [Lowest]
```

### Sorting by Lead Time (Ascending)
```
1. GreenSupply Inc. - 10 days
2. EcoMaterials Co. - 14 days
3. Sustainable Materials - 21 days
```

### Badge Logic
- **Lowest Price Badge**: Appears on EcoMaterials Co. ($15,000)
- **Best Sustainability Badge**: Appears on EcoMaterials Co. (verified tier = score 3)
  - Verified tier = 3 points
  - Standard tier = 2 points
  - Free tier = 1 point

### Mobile View
Each quote displays as a card with all information stacked vertically.

### Accept Quote Action
When clicking "Accept Quote" on EcoMaterials Co. quote:
1. Confirmation dialog: "Are you sure you want to accept this quote?"
2. If confirmed:
   - Database update: `status = 'accepted'` for quote q1111111...
   - Email log inserted:
     ```json
     {
       "to_email": "supplier1@ecomaterials.com",
       "from_email": "noreply@greenchainz.com",
       "subject": "Quote Accepted - RFQ 123e4567-e89b-12d3-a456-426614174000",
       "metadata": {
         "quote_id": "q1111111-e89b-12d3-a456-426614174101",
         "rfq_id": "123e4567-e89b-12d3-a456-426614174000",
         "quote_amount": 15000.00
       }
     }
     ```
   - Success message: "Quote accepted successfully! The supplier has been notified."
   - Page refreshes, button now shows "✓ Accepted"

### CSV Export
Clicking "Export to CSV" downloads file: `rfq-123e4567-e89b-12d3-a456-426614174000-quotes.csv`

Content:
```csv
"Supplier Name","Quote Amount","Lead Time (Days)","Status","Message","Responded At"
"EcoMaterials Co.","15000.00","14","submitted","We can meet your requirements with our FSC-certified cellulose insulation made from 85% recycled newsprint. R-30 rating guaranteed. Includes installation within Seattle metro area.","12/5/2025"
"GreenSupply Inc.","16500.00","10","submitted","Fast delivery available! Our fiberglass insulation meets all your specs. See attached PDF for detailed specifications and certifications.","12/6/2025"
"Sustainable Materials","18200.00","21","submitted","","12/7/2025"
```

## Testing Checklist

### Data Setup
- [ ] Create test architect user in `users` table
- [ ] Create test suppliers in `suppliers` table
- [ ] Create sample RFQ in `rfqs` table
- [ ] Create 3+ sample quotes in `rfq_responses` table
- [ ] Link quotes to RFQ via `rfq_id` foreign key
- [ ] Link quotes to suppliers via `supplier_id` foreign key

### Page Load Tests
- [ ] Navigate to `/architect/rfqs/{rfq-id}/quotes` as authenticated architect
- [ ] Verify RFQ summary displays correctly
- [ ] Verify all quotes appear in table/cards
- [ ] Verify supplier names are clickable links
- [ ] Verify prices are formatted with commas and $ sign
- [ ] Verify lead times show "X days" format

### Badge Tests
- [ ] Verify "Lowest" badge appears on quote with minimum price
- [ ] Verify "Best" sustainability badge appears on highest tier supplier
- [ ] Verify only one "Lowest" badge appears even if tie
- [ ] Verify only one "Best" badge appears even if tie

### Sorting Tests
- [ ] Click "Price" header, verify quotes sort by price ascending
- [ ] Click "Price" header again, verify quotes sort descending
- [ ] Verify ↑ or ↓ indicator appears in header
- [ ] Click "Lead Time" header, verify quotes sort by days ascending
- [ ] Click "Lead Time" header again, verify quotes sort descending
- [ ] Verify badges stay with correct quotes after sorting

### Notes Tests
- [ ] Verify long notes are truncated to 2-3 lines
- [ ] Click "Show more", verify full note text appears
- [ ] Click "Show less", verify note collapses back
- [ ] Verify "No notes" displays for quotes without messages
- [ ] Verify multiple notes can be expanded independently

### PDF Tests
- [ ] Verify PDF button appears only for quotes with `pdf_url`
- [ ] Click PDF button, verify download initiates
- [ ] Verify PDF button does not appear for quotes without `pdf_url`

### Accept Quote Tests
- [ ] Click "Accept Quote" button
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel", verify nothing happens
- [ ] Click "OK", verify:
   - Button changes to "Accepting..." with disabled state
   - Success alert appears
   - Quote status changes to "accepted" in database
   - Email log entry created in `email_logs` table
   - Button changes to "✓ Accepted" badge
   - Button is no longer clickable

### CSV Export Tests
- [ ] Click "Export to CSV" button
- [ ] Verify CSV file downloads
- [ ] Verify filename format: `rfq-{id}-quotes.csv`
- [ ] Open CSV, verify all quotes are present
- [ ] Verify CSV headers match expected format
- [ ] Verify CSV data is properly escaped (commas, quotes)

### Empty State Tests
- [ ] Create RFQ with no quotes
- [ ] Navigate to quotes page
- [ ] Verify "No quotes yet" message displays
- [ ] Verify empty state icon (📭) appears
- [ ] Verify friendly message text appears

### Error Handling Tests
- [ ] Try to access non-existent RFQ ID
- [ ] Verify error message displays
- [ ] Verify "Back to Dashboard" link appears
- [ ] Try to access another architect's RFQ
- [ ] Verify authorization error displays

### Responsive Tests
- [ ] View page on desktop (≥768px)
- [ ] Verify table layout displays
- [ ] View page on mobile (<768px)
- [ ] Verify card layout displays
- [ ] Verify all features work on both layouts

### Performance Tests
- [ ] Test with 1 quote
- [ ] Test with 10 quotes
- [ ] Test with 50+ quotes
- [ ] Verify sorting performance is acceptable
- [ ] Verify page load time is reasonable

## Manual Test Script

```bash
# 1. Start development server
npm run dev

# 2. Login as test architect
# Navigate to: http://localhost:3000/login
# Email: test-architect@example.com
# Password: [test password]

# 3. Access quote comparison page
# Navigate to: http://localhost:3000/architect/rfqs/123e4567-e89b-12d3-a456-426614174000/quotes

# 4. Verify RFQ summary displays
# Expected: Project name, material category, quantity visible

# 5. Test sorting
# Click "Price" header - verify sort ascending
# Click "Price" header again - verify sort descending
# Click "Lead Time" header - verify sort works

# 6. Test notes expansion
# Click "Show more" on first quote
# Verify full text appears
# Click "Show less"
# Verify text collapses

# 7. Test accept quote
# Click "Accept Quote" on EcoMaterials Co.
# Confirm dialog
# Verify success message
# Verify button changes to "✓ Accepted"

# 8. Test CSV export
# Click "Export to CSV"
# Verify file downloads
# Open file and verify data

# 9. Test responsive
# Resize browser to mobile width (<768px)
# Verify card layout appears
# Verify all features still work

# 10. Test error handling
# Navigate to: http://localhost:3000/architect/rfqs/invalid-id/quotes
# Verify error message displays
```
