# Database Schema Documentation

## Overview

This document details the database schema for GreenChainz, including tables, relationships, indexes, and Row-Level Security (RLS) policies. The schema is designed for a multi-tenant marketplace connecting Architects and Suppliers.

## Core Schema

The schema is built on Supabase (PostgreSQL) and uses the following core tables:

### 1. Users & Profiles
*   **`users`**: Extends `auth.users`. Base table for all users.
*   **`suppliers`**: Supplier profiles. Linked to `users`.
    *   Includes `verification_status`, `tier`, `company_name`.
*   **`architects`**: Architect profiles. Linked to `users`.

### 2. Catalog
*   **`catalog_products`**: Base product information managed by suppliers.
    *   Fields: `name`, `category`, `specifications` (JSONB), `images`.
*   **`product_variants`**: Specific SKUs/variations of a product.
    *   Fields: `sku`, `price`, `stock_level`, `attributes` (JSONB).

### 3. Projects & RFQs
*   **`projects`**: Architect projects to organize RFQs.
*   **`rfqs`**: Requests for Quotes.
    *   Status flow: `draft` -> `open` -> `closed` / `awarded`.
*   **`rfq_invitations`**: Tracks which suppliers are invited to an RFQ.
*   **`rfq_quotes`**: Supplier responses to RFQs.

### 4. Transactions
*   **`transactions`**: Financial records for accepted quotes.

## Indexes & Performance

Indexes are applied to optimize common query patterns:

*   **Foreign Keys**: All FK columns are indexed (e.g., `supplier_id`, `rfq_id`).
*   **Text Search**: `pg_trgm` GIN indexes on:
    *   `suppliers.company_name`
    *   `catalog_products.name`
*   **Filtering**: Indexes on status fields (`verification_status`, `rfqs.status`, `transactions.status`).

## Row-Level Security (RLS) Policies

RLS is strictly enforced to ensure data isolation:

| Table | Policy Summary |
| :--- | :--- |
| **Suppliers** | - **Public**: View all profiles.<br>- **Owner**: Update own profile. |
| **Architects** | - **Authenticated**: View profiles.<br>- **Owner**: Update own profile. |
| **Catalog** | - **Public**: View active products.<br>- **Owner**: Manage own products. |
| **RFQs** | - **Owner (Architect)**: Full management.<br>- **Invited Supplier**: View specific RFQs. |
| **Quotes** | - **Owner (Supplier)**: Manage own quotes.<br>- **Recipient (Architect)**: View quotes for their RFQs. |
| **Transactions**| - **Participants**: View own transactions.<br>- **Admin**: View all. |

## Migration

The consolidated schema is located in:
`supabase/migrations/20251216000000_consolidated_schema.sql`

To apply:
1.  Run the migration via Supabase Dashboard or CLI.
2.  Verify tables and policies.

## Example Queries

**Find Active Products by Name:**
```sql
SELECT * FROM catalog_products
WHERE is_active = true
AND name ILIKE '%insulation%';
```

**Get Architect's RFQs:**
```sql
SELECT * FROM rfqs
WHERE architect_id = auth.uid();
```
