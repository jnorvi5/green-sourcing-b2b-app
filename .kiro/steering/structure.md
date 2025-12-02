# GreenChainz Project Structure

## Repository Organization

This is a **monorepo** containing multiple applications and shared resources.

## Top-Level Structure

```
/                           # Root: Next.js API routes project
├── app/                    # Next.js 14 App Router (API routes, landing pages)
├── frontend/               # Vite + React SPA (main marketplace UI)
├── backend/                # Express.js API server
├── supabase/               # Supabase migrations, functions, schema
├── database-schemas/       # SQL schemas and migrations
├── components/             # Shared React components (root level)
├── lib/                    # Shared utilities and services
├── models/                 # TypeScript data models
├── types/                  # TypeScript type definitions
├── emails/                 # React Email templates
├── docs/                   # Documentation and guides
├── terraform/              # Infrastructure as Code
├── lambda/                 # AWS Lambda functions
├── azure-functions/        # Azure Functions
└── cloudflare-landing/     # Static landing pages
```

## Frontend Application (`/frontend/`)

Vite + React SPA for the main marketplace interface.

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── layout/         # Navbar, Footer, Sidebar
│   │   ├── marketplace/    # Product cards, filters, search
│   │   ├── dashboard/      # Buyer/supplier dashboards
│   │   └── ui/             # Reusable UI components
│   ├── pages/              # Page components (React Router)
│   │   ├── BuyerDashboard/
│   │   ├── SupplierDashboard/
│   │   └── Marketplace/
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── mocks/              # Mock data for development
│   └── App.tsx             # Main app component
├── public/                 # Static assets
│   └── assets/
│       ├── logo/           # Brand logos
│       └── partners/       # Partner/certification logos
└── dist/                   # Build output (gitignored)
```

## Backend API (`/backend/`)

Express.js REST API server.

```
backend/
├── routes/                 # API route handlers
├── services/               # Business logic services
│   ├── certifierService.js
│   ├── matchmakerService.js
│   ├── rfqRouterService.js
│   ├── complianceOracleService.js
│   └── marketIntelService.js
├── providers/              # External data provider integrations
│   ├── ec3.js
│   ├── epdInternational.js
│   ├── ecoPlatform.js
│   └── fsc.js
├── middleware/             # Express middleware
│   ├── auth.js
│   ├── security.js
│   └── errorHandler.js
├── scripts/                # Utility scripts and test runners
├── tests/                  # Jest test files
├── logs/                   # Application logs (gitignored)
└── index.js                # Server entry point
```

## Next.js App (`/app/`)

Next.js 14 App Router for API routes and marketing pages.

```
app/
├── api/                    # API route handlers
│   ├── carbon/
│   ├── email/
│   ├── export/
│   ├── integrations/
│   ├── rfqs/
│   └── upload/
├── admin/                  # Admin pages
├── components/             # Page-specific components
├── layout.tsx              # Root layout
├── page.tsx                # Homepage
└── globals.css             # Global styles
```

## Database (`/database-schemas/`, `/supabase/`)

```
database-schemas/
├── schema.sql              # Main PostgreSQL schema
├── mvp_schema.sql          # MVP-specific schema
├── init.sql                # Initialization script
├── migrations/             # SQL migrations
└── seed-*.sql              # Seed data scripts

supabase/
├── migrations/             # Supabase-managed migrations
├── functions/              # Edge functions
└── schema.sql              # Supabase schema
```

## Shared Resources

```
lib/                        # Shared utilities (root level)
├── supabase/               # Supabase client configs
├── azure/                  # Azure service integrations
├── integrations/           # Third-party integrations
└── *Service.ts             # Shared service modules

models/                     # Data models
├── Product.ts
├── Supplier.ts
├── Buyer.ts
└── Material.ts

types/                      # Type definitions
└── outreach.ts

emails/                     # Email templates
├── components/             # Email component library
└── templates/              # Specific email templates
```

## Documentation (`/docs/`)

```
docs/
├── brand/                  # Brand guidelines and assets
├── sales/                  # Sales materials
├── deployment-checklist.md
├── data-provider-contacts.md
└── outreach-email-template.md
```

## Infrastructure

```
terraform/                  # Terraform IaC
├── main.tf
├── lambda.tf
└── variables.tf

lambda/                     # AWS Lambda functions
└── greenchainz-epd-sync/

azure-functions/            # Azure Functions
└── src/functions/

cloudflare-landing/         # Static landing pages
├── index.html
├── architects/
├── suppliers/
└── data-providers/
```

## Key Conventions

### File Naming

- React components: PascalCase (e.g., `ProductCard.tsx`)
- Utilities/services: camelCase (e.g., `supabase.ts`, `carbonCalculatorService.ts`)
- Backend files: camelCase with `.js` extension
- Types/models: PascalCase (e.g., `Product.ts`)

### Import Paths

- Frontend uses `@/` alias for `src/` directory
- Backend uses relative imports
- Shared `lib/` imported from root

### Environment Files

- `.env.example` - Template (committed)
- `.env.local` - Local development (gitignored)
- `.env` - Production secrets (gitignored)
- Each subdirectory (frontend/, backend/) has its own `.env` files

### Build Outputs (Gitignored)

- `frontend/dist/` - Vite build output
- `frontend/.next/` - Next.js cache
- `backend/node_modules/`
- `.next/` - Root Next.js build
- `node_modules/` - Root dependencies

## Working with Multiple Apps

### Starting Development

```bash
# Root Next.js API (port 3001)
npm run dev

# Frontend SPA (port 5173)
cd frontend && npm run dev

# Backend API (default port from env)
cd backend && npm run dev
```

### Building for Production

```bash
# Root Next.js
npm run build

# Frontend
cd frontend && npm run build

# Backend (no build step, runs directly)
cd backend && npm start
```

## Migration Notes

The project is transitioning from a mixed structure to a cleaner separation:

- Moving shared components from `app/components/` to root `/components/`
- Consolidating assets from `assets/images/` to `frontend/public/assets/`
- Standardizing on Next.js App Router for root-level pages
- Keeping Vite frontend as separate SPA for marketplace UI
