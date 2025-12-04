# Supabase Production Schema Deployment Guide

## Overview

This guide covers deploying the production-ready PostgreSQL schema to Supabase for GreenChainz.

## Prerequisites

- Supabase project created
- Supabase CLI installed (`npm install -g supabase`)
- Database connection details from Supabase dashboard

## Schema Features

✅ **UUID Primary Keys** - Supabase best practice
✅ **Row Level Security (RLS)** - Secure data access
✅ **Automatic Timestamps** - `updated_at` triggers
✅ **Performance Indexes** - Optimized queries
✅ **Fuzzy Search** - pg_trgm for text matching
✅ **JSONB Fields** - Flexible data storage
✅ **Helper Functions** - Similarity scoring, metrics
✅ **Materialized Views** - Fast common queries

## Deployment Methods

### Method 1: Supabase Dashboard (Recommended for First Deploy)

1. **Open SQL Editor**

   - Go to your Supabase project dashboard
   - Navigate to: **SQL Editor** → **New Query**

2. **Run Schema**

   ```sql
   -- Copy and paste contents of:
   -- database-schemas/supabase_production_schema.sql
   ```

3. **Execute**

   - Click **Run** or press `Ctrl+Enter`
   - Wait for completion (should take 10-30 seconds)

4. **Verify**
   - Go to **Table Editor** to see new tables
   - Check **Database** → **Extensions** for `uuid-ossp` and `pg_trgm`

### Method 2: Supabase CLI

1. **Link Project**

   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Run Migration**

   ```bash
   supabase db push
   ```

3. **Or Apply SQL Directly**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
     -f database-schemas/supabase_production_schema.sql
   ```

### Method 3: Direct PostgreSQL Connection

1. **Get Connection String**

   - Supabase Dashboard → **Settings** → **Database**
   - Copy **Connection string** (Transaction mode)

2. **Connect and Run**
   ```bash
   psql "your-connection-string" -f database-schemas/supabase_production_schema.sql
   ```

## Post-Deployment Verification

### 1. Check Tables

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables:

- `users`
- `suppliers`
- `products`
- `epd_data`
- `rfqs`
- `rfq_responses`
- `email_logs`

### 2. Check Indexes

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Should see indexes like:

- `idx_users_email`
- `idx_products_material_type`
- `idx_epd_number`
- etc.

### 3. Check RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Should see policies for each table.

### 4. Test Functions

```sql
-- Test similarity function
SELECT similarity_score('Recycled Steel Rebar', 'Steel Rebar Recycled');

-- Test EPD expiry check
SELECT is_epd_expired('00000000-0000-0000-0000-000000000000'::uuid);
```

## Seed Data (Optional)

### Create Test Users

```sql
-- Insert test architect
INSERT INTO users (email, role, full_name, company_name)
VALUES ('architect@test.com', 'architect', 'John Architect', 'Green Designs Inc');

-- Insert test supplier
INSERT INTO users (email, role, full_name, company_name)
VALUES ('supplier@test.com', 'supplier', 'Jane Supplier', 'EcoMaterials Co');

-- Create supplier profile
INSERT INTO suppliers (user_id, company_name, tier, geographic_coverage)
SELECT id, 'EcoMaterials Co', 'verified', ARRAY['US-CA', 'US-OR', 'US-WA']
FROM users WHERE email = 'supplier@test.com';
```

### Create Test Products

```sql
-- Insert test product
INSERT INTO products (
  supplier_id,
  product_name,
  material_type,
  description,
  carbon_footprint_a1a3,
  price_per_unit,
  unit_type,
  lead_time_days
)
SELECT
  s.id,
  'Recycled Cellulose Insulation',
  'insulation',
  'High-performance insulation made from 100% recycled paper',
  0.15,
  2.50,
  'sqft',
  14
FROM suppliers s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'supplier@test.com';
```

### Create Test EPD

```sql
INSERT INTO epd_data (
  epd_number,
  product_name,
  manufacturer,
  gwp_a1a3_kgco2e,
  gwp_total_kgco2e,
  declared_unit,
  validity_start,
  validity_end,
  data_source
)
VALUES (
  'EPD-TEST-20240101',
  'Recycled Cellulose Insulation',
  'EcoMaterials Co',
  0.15,
  0.18,
  '1 kg',
  '2024-01-01',
  '2029-01-01',
  'EPD International'
);
```

## Integration with Supabase Auth

### Link Users to Auth

The `users` table is designed to extend Supabase Auth. To link them:

1. **On User Signup** (in your application):

   ```typescript
   // After Supabase auth signup
   const { data: authData } = await supabase.auth.signUp({
     email: "user@example.com",
     password: "password",
   });

   // Create user record
   await supabase.from("users").insert({
     id: authData.user.id, // Use auth user ID
     email: authData.user.email,
     role: "architect",
     full_name: "John Doe",
   });
   ```

2. **RLS Policies Use `auth.uid()`**
   - Policies automatically check `auth.uid()` against `users.id`
   - No additional configuration needed

## Performance Tuning

### Analyze Query Performance

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Refresh Materialized Views

```sql
-- Refresh views periodically (set up cron job)
REFRESH MATERIALIZED VIEW active_suppliers;
REFRESH MATERIALIZED VIEW valid_epds;
REFRESH MATERIALIZED VIEW products_with_epd;
```

### Update Statistics

```sql
-- Run after bulk inserts
ANALYZE users;
ANALYZE suppliers;
ANALYZE products;
ANALYZE epd_data;
```

## Backup and Restore

### Create Backup

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump "your-connection-string" > backup.sql
```

### Restore Backup

```bash
psql "your-connection-string" < backup.sql
```

## Troubleshooting

### Issue: RLS Blocking Queries

**Solution**: Temporarily disable RLS for testing

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Test your queries
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Issue: Slow Queries

**Solution**: Check missing indexes

```sql
-- Find tables without indexes
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_indexes WHERE schemaname = 'public'
);
```

### Issue: Type Conflicts

**Solution**: Drop and recreate types

```sql
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('architect', 'supplier', 'admin');
```

## Monitoring

### Key Metrics to Track

1. **Table Sizes**

   ```sql
   SELECT
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

2. **Index Usage**

   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan AS index_scans
   FROM pg_stat_user_indexes
   ORDER BY idx_scan ASC;
   ```

3. **Active Connections**
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

## Next Steps

1. ✅ Deploy schema
2. ✅ Verify tables and indexes
3. ✅ Test RLS policies
4. ✅ Create seed data
5. ✅ Set up monitoring
6. 🔄 Integrate with application
7. 🔄 Set up automated backups
8. 🔄 Configure pg_cron for scheduled tasks

## Support

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **GreenChainz Schema**: See `supabase_production_schema.sql` for full details
