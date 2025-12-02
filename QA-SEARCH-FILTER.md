# Product Search & Filter QA Script

## Steps
1. Go to `/products` or `/search` page.
2. Enter search term (e.g., "insulation").
3. Apply filters:
   - Material type (e.g., insulation, flooring)
   - Certifications (e.g., FSC, LEED)
   - Carbon footprint (e.g., <50 kg CO2e)
4. Combine filters (AND logic).
5. Click "Clear filters".
6. Measure response time (<2s expected).

## Pass/Fail Table
| Test Step                | Pass/Fail | Notes/Screenshot |
|--------------------------|-----------|------------------|
| Search by term           |           |                  |
| Filter by material type  |           |                  |
| Filter by certification  |           |                  |
| Filter by carbon         |           |                  |
| Combine filters (AND)    |           |                  |
| Clear filters            |           |                  |
| Performance <2s          |           |                  |

## If Issues Found
- Add missing DB indexes (see migrations/search indexes SQL)
- Fix frontend filter logic/UI
- Add loading spinner if slow

---

_Fill out this table as you test. Attach screenshots for any failures._
