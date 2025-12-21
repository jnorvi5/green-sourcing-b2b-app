# 🚨 IMPORTANT: Architecture Notice

## This is a Next.js Project (NOT Vite)

**Current Stack (As of December 2025):**
- ✅ **Frontend:** Next.js 14 (App Router)
- ✅ **Backend:** Next.js API Routes + Supabase
- ✅ **Deployment:** Vercel
- ✅ **Styling:** Tailwind CSS
- ❌ **Vite:** REMOVED (see Migration Notes below)

### ⚠️ For Developers & AI Assistants

**DO NOT:**
- ❌ Use `import.meta.env.*` (use `process.env.NEXT_PUBLIC_*`)
- ❌ Create `vite.config.*` files
- ❌ Import from `/frontend-DEPRECATED-VITE-DO-NOT-USE`
- ❌ Use React Router (use Next.js `app/` routing)

**DO:**
- ✅ Put new components in `/components`
- ✅ Put new pages in `/app`
- ✅ Use Next.js `useRouter` from `next/navigation`
- ✅ Use Server Components by default

---

## Migration Notes

**December 11, 2025:** Vite frontend deprecated  
**Legacy code location:** `/frontend-DEPRECATED-VITE-DO-NOT-USE` (reference only)  
**Migration tracking:** [GitHub Issue #232](https://github.com/jnorvi5/green-sourcing-b2b-app/issues/232)  
**Scheduled deletion:** January 15, 2026

---

# GreenChainz - B2B Green Sourcing Marketplace

**Mission**: Build a data-driven B2B marketplace connecting sustainability-minded buyers (architects, contractors, procurement teams) with verified green suppliers.

**Our Moat**: Verifiable sustainability data. We aggregate, standardize, and present EPDs, certifications, and carbon footprints in a single, trusted platform.

---

## **Tech Stack**

| Layer                 | Technology                             | Purpose                                                                                                                        |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**          | Vercel (Next.js/React)                 | Headless, API-first UI with automatic deployments from GitHub                                                                  |
| **Backend**           | Supabase (PostgreSQL + Edge Functions) | Managed database (SQL for transactions) + instant REST/GraphQL APIs                                                            |
| **Authentication**    | Supabase Auth + OAuth 2.0              | Multi-provider authentication (Google, LinkedIn, GitHub) with role-based access control                                        |
| **Database Strategy** | Supabase (PostgreSQL)                  | SQL for transactional data (users, orders); JSONB columns for flexible product/sustainability data |
| **Security & CDN**    | Cloudflare                             | DDoS protection, WAF, SSL/TLS, global CDN for performance                                                                      |
| **Version Control**   | GitHub (Student Developer Pack)        | CI/CD pipeline via Vercel integration                                                                                          |

---

## **Architecture Principles**

1. **API-First**: Every platform function (auth, search, orders) exposed via secure, documented APIs
2. **Headless Commerce**: Decoupled frontend (presentation) from backend (business logic) for multi-channel flexibility
3. **Data as Core Asset**: Sustainability data treated as first-class citizen (dedicated database schema for EPDs, certifications, carbon metrics)

---

## **Current Status: MVP Development**

### **Phase 1: Foundation (Weeks 1-4) - IN PROGRESS**

- [x] Strategic blueprint finalized
- [x] Tech stack selected
- [ ] **IN PROGRESS**: Data provider partnerships (EPD International, WAP Sustainability, Building Transparency, Autodesk, FSC)
- [ ] GitHub Student Developer Pack activated
- [ ] Cloud credits approved (AWS/Google Cloud - pending)
- [ ] Local MVP deployed to Vercel (staging environment)

### **Phase 2: Data Integration (Weeks 5-8)**

- [ ] API integrations with 2-3 core data providers
- [ ] Database schema design (hybrid SQL/NoSQL)
- [ ] Product Information Management (PIM) tool selection

### **Phase 3: Supplier Onboarding (Weeks 9-12)**

- [ ] White-glove onboarding for 10-15 anchor suppliers
- [ ] Tiered integration model (API, file upload, manual entry)

---

## **User Personas**

### **Demand Side (Buyer)**: Sustainability-Minded Architect (Sarah)

- **Goal**: Discover, compare, and de-risk sourcing of green materials
- **Pain Point**: Fragmented research, no "apples-to-apples" comparisons

### **Supply Side (Seller)**: Regional Materials Manufacturer (David)

- **Goal**: Get innovative, sustainable products in front of qualified buyers
- **Pain Point**: High cost, low ROI of traditional marketing

---

## **Key Differentiators**

| **Feature**       | **GreenChainz**                                                           | **Competitors (2050 Materials, Ecomedes)** |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| **Data Moat**     | Verified EPDs, certifications, carbon metrics aggregated from 5+ sources  | Limited or fragmented data                 |
| **Architecture**  | Modern, API-first, headless (scalable, multi-channel)                     | Often monolithic                           |
| **Database**      | Hybrid SQL/NoSQL (transactional integrity + flexible sustainability data) | Typically single-paradigm                  |
| **Target Market** | B2B (architects, contractors, procurement)                                | Often B2C or mixed                         |

---

## **Documentation**

- **Strategic Plan**: `/docs/Greenchainz B2B Marketplace Research Plan.md`
- **Solo Founder Strategy**: `/docs/Solo Tech Business Launch Strategy.pdf`
- **Data Provider Contacts**: `/docs/data-provider-contacts.md`
- **Outreach Templates**: `/docs/outreach-email-template.md`
- **Deployment Checklist**: `/docs/deployment-checklist.md`
- **Cloud Credits Follow-up**: `/docs/cloud-credits-followup-email.md`
- **Admin Dashboard Guide**: See "Admin Features" section below

---

## **Development & Quality**

### Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run check:links  # Check all links in documentation
```

### Link Checking

This repository uses [lychee](https://github.com/lycheeverse/lychee) for automated link checking:

- **Manual check**: `npm run check:links`
- **Offline check**: `npm run check:links -- --offline` (faster, checks only internal links)
- **CI check**: Automated link checking runs on PRs via GitHub Actions

Configuration is in `lychee.toml`.

---

## **Platform Access**

### Homepage (`/`)

Simple status page showing:

- Platform overview with links to buyer, supplier, and admin sections
- System health indicators (API, Database, Automation, Support)
- Quick navigation to key platform areas

### Authentication (`/login`)

Multi-provider authentication system:

- **OAuth Providers**: Google, LinkedIn, GitHub
- **Email/Password**: Traditional authentication
- **Demo Accounts**: Quick-fill for testing (architect/supplier)
- **Role-Based Routing**: Automatic redirect to appropriate dashboard after login

See `/docs/OAUTH_SETUP.md` and `VERCEL-AUTH-SETUP.md` for OAuth configuration.

### Admin Dashboard (`/admin/dashboard`)

Full-featured admin interface for platform management.

**Features:**

- **System Overview**: Real-time stats for users, suppliers, buyers, and RFQs
- **Automation Tools**: One-click automation for common tasks
  - Sync EPD Data: Pull latest EPDs from data providers
  - Run Supplier Matching: Match pending RFQs with qualified suppliers
  - Send Notifications: Process pending notification queue
  - Update Certifications: Verify and update supplier certifications
  - Generate Reports: Create weekly analytics reports
- **User Management**: View and manage platform users (coming soon)
- **Supplier Management**: Approve and monitor suppliers (coming soon)
- **RFQ Management**: Track and manage quote requests (coming soon)

**Access:**

- Development: `http://localhost:3001/admin/dashboard`
- Production: `https://yourdomain.com/admin/dashboard`
- Requires admin authentication via Supabase

**API Endpoints:**

- `POST /api/admin/automation/{type}` - Run automation tasks
- Backend automation routes in `/backend/routes/automation.js`

### Marketing Landing Pages

Full marketing pages are available in `/cloudflare-landing/` for static deployment:

- Main landing: `cloudflare-landing/index.html`
- Architect-focused: `cloudflare-landing/architects/`
- Supplier-focused: `cloudflare-landing/suppliers/`
- Data provider-focused: `cloudflare-landing/data-providers/`

---

## **Compliance & Standards**

Our platform aligns with:

- **ISO 14025**: Type III Environmental Declarations (EPDs)
- **EN 15804**: Sustainability of construction works
- **ISO 21930**: Environmental declarations for building products
- **EPD Hub GPI v1.3**: General Program Instructions for EPD verification

---

## **Next Milestones**

- **November 10, 2025**: Data provider contact list finalized, first outreach emails sent
- **November 17, 2025**: Minimum 2 API partnership responses received
- **December 1, 2025**: Local MVP deployed to Vercel staging
- **January 2026**: First anchor supplier onboarded

---

**Contact**: [Your Email] | [LinkedIn Profile]  
**License**: [Choose appropriate license - MIT, Apache 2.0, or proprietary]

# Nuclear rebuild Fri Dec 5 23:29:50 EST 2025
