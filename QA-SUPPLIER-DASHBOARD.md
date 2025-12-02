# Supplier Dashboard QA Script

## Steps
1. Login as a test supplier account.
2. Check if company profile loads correctly.
3. Add a new product (name, description, image upload, sustainability data).
4. Edit an existing product (e.g., change price).
5. Delete a product (note if soft or hard delete).
6. Upload an image for a product.
7. View incoming RFQs.
8. Check analytics section (view count, RFQ count).

## Test Cases
| Feature                  | Working/Broken | Notes/Screenshot |
|--------------------------|----------------|------------------|
| Company profile loads    |                |                  |
| Add product              |                |                  |
| Edit product             |                |                  |
| Delete product           |                |                  |
| Image upload             |                |                  |
| View incoming RFQs       |                |                  |
| Analytics section        |                |                  |

## Checks
- Image upload: file size, S3/Supabase Storage config
- Form submission errors
- Permissions (RLS policies)

---

_Fill out this table as you test. Attach screenshots for any failures._
