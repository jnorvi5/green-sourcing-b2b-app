# RFQ (Request for Quote) End-to-End QA Script

## Steps

1. Architect user clicks 'Request Quote' on a product.
2. Fill out RFQ form: name, email, project details, quantity.
3. Submit form.
4. Check Supabase `rfqs` table for new entry.
5. Check supplier email inbox for notification.
6. Architect sees 'Quote request sent' confirmation.

## Test Cases

| Case                        | Pass/Fail | Notes/Screenshot |
|-----------------------------|-----------|------------------|
| Valid submission            |           |                  |
| Missing required fields     |           |                  |
| Invalid email format        |           |                  |

## Checks

- Form validation errors shown for missing/invalid fields
- Email delivery (SMTP/SendGrid/Resend)
- Database insert errors handled

## Output

- Screenshot: RFQ in Supabase dashboard
- Screenshot: Supplier email notification

---

_Fill out this table as you test. Attach screenshots for any failures._
