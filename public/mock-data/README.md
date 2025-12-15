
# Mock Data Generation Report

**Generated:** 2025-12-15T23:02:45.176Z

## Summary

- **Suppliers:** 100
  - Verified: 10
  - Standard: 40
  - Free: 50
  - Founding 50: 50

- **Architects:** 50
  - Average trust score: 76.2

- **Products:** 100
  - Average price: $312.71
  - Average carbon: 292 kg CO2e

## Files Generated

- `public/mock-data/suppliers.json`
- `public/mock-data/architects.json`
- `public/mock-data/products.json`

## Usage

Frontend can load this data with:

```typescript
const suppliers = await fetch('/mock-data/suppliers.json').then(r => r.json());
```

This allows frontend development to proceed without database access.

## Next Steps

When database credentials are resolved:
1. Run `scripts/seed-database.ts` to insert into Supabase
2. Update frontend to use Supabase instead of mock data
3. Delete `public/mock-data/` directory
