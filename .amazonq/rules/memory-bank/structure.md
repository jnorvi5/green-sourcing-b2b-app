# Project Structure

## Architecture Overview
**Pattern:** Next.js 14 App Router with API-first, headless architecture  
**Deployment:** Vercel (frontend + API routes) + Supabase (database + edge functions)  
**Paradigm:** Hybrid SQL/NoSQL for transactional integrity and flexible sustainability data

## Root Directory Organization

### `/app` - Next.js Application (App Router)
Primary application code using Next.js 14 App Router pattern.

**Key Subdirectories:**
- **`/admin`** - Admin dashboard and management interfaces
  - `/dashboard` - System overview and automation controls
  - `/products` - Product approval and management
  - `/certifications` - Certification verification
  - `/analytics` - Platform analytics and reporting
  - `/outreach` - Lead management and email campaigns
  - `/my-rfqs` - RFQ management interface
- **`/architect`** - Buyer/architect-specific interfaces
  - `/dashboard` - Architect project dashboard
  - `/rfq` - RFQ creation and management
  - `/rfqs` - RFQ listing and tracking
- **`/supplier`** - Supplier-specific interfaces
  - `/dashboard` - Supplier analytics and overview
  - `/products` - Product catalog management
  - `/rfqs` - Incoming RFQ management
  - `/certifications` - Certification submission
  - `/subscription` - Subscription and billing
- **`/api`** - Next.js API routes (backend endpoints)
  - `/admin` - Admin operations
  - `/rfq` - RFQ CRUD operations
  - `/auth` - Authentication endpoints
  - `/stripe` - Payment processing
  - `/webhooks` - External service webhooks
  - `/email` - Email sending services
  - `/analytics` - Analytics data endpoints
- **`/actions`** - Server actions for form handling and mutations
- **`/components`** - Shared React components

### `/components` - Reusable UI Components
Shared component library organized by domain.

**Structure:**
- **`/home`** - Landing page components (Hero, HowItWorks, Pricing, Stats)
- **`/layout`** - Layout components (Navbar, Footer)
- **`/ui`** - Base UI primitives (button, card, input, skeleton)
- **`/chat`** - AI assistant chat components

### `/lib` - Business Logic & Utilities
Core business logic, integrations, and utility functions.

**Key Modules:**
- **`/agents`** - AI agents for automation
  - `/assistant` - AI assistant functionality
  - `/email` - Email automation agents
  - `/scraper` - Data scraping agents
  - `/social` - Social media automation
- **`/aws`** - AWS service integrations (S3, SES, CloudFront)
- **`/azure`** - Azure service integrations (OpenAI, email)
- **`/email`** - Email service clients (Resend, MailerLite, Zoho)
- **`/integrations`** - External API integrations
  - `/autodesk` - Autodesk platform integration
  - `/ec3` - EC3 carbon database integration
- **`/stripe`** - Stripe payment processing
- **`/supabase`** - Supabase client configuration
- **`/verification`** - Certification verification logic

### `/types` - TypeScript Type Definitions
Centralized type definitions for the entire application.

**Key Files:**
- `admin-dashboard.ts` - Admin interface types
- `autodesk.ts` - Autodesk integration types
- `certification-verification.ts` - Certification types
- `outreach.ts` - Lead and email campaign types
- `product.ts` - Product and EPD types
- `rfq.ts` - RFQ and quote types
- `stripe.ts` - Payment and subscription types
- `supplier-dashboard.ts` - Supplier interface types

### `/supabase` - Database & Backend
Supabase configuration, migrations, and edge functions.

**Structure:**
- **`/migrations`** - SQL migration files (versioned schema changes)
- **`/functions`** - Supabase Edge Functions (serverless)
  - `/handle-transactional-email` - Email handling
  - `/send-email` - Email sending
  - `/upload-url` - File upload URL generation
- `schema.sql` - Complete database schema
- `seed.ts` - Database seeding scripts
- `rls-policies.sql` - Row Level Security policies

### `/lambda` - AWS Lambda Functions
Serverless functions for specific automation tasks.

**Functions:**
- **`/cost-monitor`** - AWS cost monitoring and alerts
- **`/greenchainz-epd-sync`** - EPD data synchronization
- **`/supabase-backup`** - Automated database backups
- **`/antigravity-editor-sanitizer`** - Content sanitization (Python)

### `/database-schemas` - Database Documentation
SQL schemas, migrations, and database documentation.

**Contents:**
- `schema.sql` - Master database schema
- `mvp_schema.sql` - MVP-specific schema
- `performance-indexes.sql` - Performance optimization indexes
- `/migrations` - Historical migration files
- Seed data files for plans and data providers

### `/docs` - Documentation
Comprehensive project documentation.

**Categories:**
- **`/brand`** - Brand guidelines and color palettes
- **`/sales`** - Sales materials and objection handling
- Technical guides (OAuth, Stripe, Sentry, Autodesk integration)
- Deployment and security documentation
- Marketing and outreach templates

### `/emails` - Email Templates
React-based email templates using React Email.

**Structure:**
- **`/components`** - Reusable email components (Header, Footer, Button)
- **`/templates`** - Email templates
  - `WelcomeEmail.tsx` - User welcome
  - `RFQConfirmationEmail.tsx` - RFQ submission confirmation
  - `SupplierQuoteResponse.tsx` - Quote response notification
  - `ProductApprovalEmail.tsx` - Product approval notification

### `/terraform` - Infrastructure as Code
Terraform configurations for AWS infrastructure.

**Structure:**
- **`/aws`** - AWS-specific resources
  - `s3.tf` - S3 bucket configuration
  - `lambda.tf` - Lambda function definitions
  - `ses.tf` - Email service configuration
  - `cloudfront.tf` - CDN configuration
  - `budgets.tf` - Cost monitoring

### `/scripts` - Automation Scripts
Utility scripts for development and operations.

**Key Scripts:**
- `generate_quarterly_report.py` - Analytics report generation
- `scrape-supplier.ts` - Supplier data scraping
- `deploy-vercel.ps1` - Vercel deployment automation
- `quick-deploy.sh` - Quick deployment script
- Various fix and cleanup scripts

### `/tests` - End-to-End Tests
Playwright-based E2E tests for critical user flows.

**Test Suites:**
- `auth.spec.ts` - Authentication flows
- `supplier.spec.ts` - Supplier workflows
- `api.spec.ts` - API endpoint testing
- `verify_architect_dashboard.spec.ts` - Dashboard verification

### `/cloudflare-landing` - Static Marketing Pages
Static HTML landing pages for Cloudflare Pages deployment.

**Pages:**
- `index.html` - Main landing page
- `/architects` - Architect-focused landing
- `/suppliers` - Supplier-focused landing
- `/data-providers` - Data provider landing

### `/campaigns` - Marketing Campaigns
Campaign materials and outreach content.

**Current Campaigns:**
- **`/founding-50`** - Founding member campaign
  - Email outreach templates
  - LinkedIn post content
  - Follow-up sequences

## Core Architectural Patterns

### 1. API-First Design
Every platform function exposed via secure, documented API endpoints in `/app/api`.

### 2. Role-Based Access Control (RBAC)
- User roles: `buyer`, `supplier`, `admin`, `data_provider`
- Role-specific dashboards and permissions
- Supabase RLS policies enforce data access

### 3. Hybrid Data Strategy
- **SQL (Supabase PostgreSQL):** Transactional data (users, orders, RFQs)
- **JSONB Fields:** Flexible sustainability data (EPDs, certifications)
- **Indexes:** Optimized for search and filtering

### 4. Server Components First
- Default to React Server Components for performance
- Client components (`"use client"`) only when needed for interactivity
- Server actions for mutations and form handling

### 5. Type Safety
- Centralized TypeScript types in `/types`
- Strict type checking across frontend and backend
- Zod schemas for runtime validation

## Key Relationships

### Authentication Flow
`/app/login` → Supabase Auth → Role detection → Dashboard redirect (`/admin`, `/architect`, `/supplier`)

### RFQ Workflow
Buyer creates RFQ → `/app/api/rfq` → Supabase → Matching algorithm → Supplier notification → Quote submission → Comparison

### Product Data Flow
Supplier uploads → `/app/api/admin/products` → Verification → EPD sync (`/lambda/greenchainz-epd-sync`) → Search index → Buyer discovery

### Email Flow
Trigger → `/lib/email/resend-client.ts` → Template (`/emails/templates`) → Resend API → Delivery + tracking
