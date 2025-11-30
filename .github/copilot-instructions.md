# Copilot Instructions for GreenChainz B2B Marketplace

## Overview

GreenChainz is a B2B green sourcing marketplace connecting sustainability-minded buyers (architects, contractors, procurement teams) with verified green suppliers. The platform aggregates, standardizes, and presents EPDs (Environmental Product Declarations), certifications, and carbon footprints.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite + TypeScript | Single-page application with React Router |
| Backend | Express.js (Node.js) | REST API server |
| Database | PostgreSQL (Supabase) | Primary data store with Row Level Security |
| Auth | Supabase Auth | Authentication and authorization |
| Storage | AWS S3 | File/image storage with presigned URLs |
| Styling | Tailwind CSS | Utility-first CSS framework |
| State Management | Zustand | Lightweight state management |
| Root App | Next.js 14 | Landing pages and SSR content |

## Project Structure

```
/
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # Zustand stores
│   │   ├── api/           # API client functions
│   │   ├── types/         # TypeScript types
│   │   └── lib/           # Utility functions
│   └── package.json
├── backend/               # Express.js API
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── config/            # Configuration
│   └── package.json
├── supabase/              # Database layer
│   ├── functions/         # Edge functions
│   ├── migrations/        # SQL migrations
│   ├── schema.sql         # Database schema
│   └── seed.ts            # Seed data
├── app/                   # Next.js pages
├── components/            # Shared components
├── lib/                   # Shared utilities
└── package.json           # Root package.json
```

## Build, Test, and Run Commands

### Root Project (Next.js)
```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run Jest tests
```

### Frontend (React + Vite)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (Express.js)
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm run start        # Start production server
npm run seed         # Seed database
```

### Database (Supabase)
```bash
npm run seed         # Run seed script (from root)
```

## Coding Conventions

### TypeScript
- Use TypeScript for all new code in the frontend
- Define interfaces/types in `src/types/` or `src/types.ts`
- Prefer `interface` over `type` for object shapes
- Use strict null checks

### React Components
- Use functional components with hooks
- Name components in PascalCase
- Place component-specific CSS in adjacent `.css` files or use Tailwind classes
- Use `ErrorBoundary` for error handling

### File Naming
- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAuth.ts`)
- Utilities: `camelCase.ts` (e.g., `analytics.ts`)
- Pages: `PascalCase.tsx` or `index.tsx` in a folder

### Styling
- Use Tailwind CSS utility classes as primary styling approach
- For complex styles, use component-adjacent CSS files
- Design system components are in `frontend/src/components/design-system/`
- UI primitives are in `frontend/src/components/ui/`

### State Management
- Use Zustand for global state (`frontend/src/store/`)
- Use React Context for feature-scoped state
- Use local state (`useState`) for component-specific state

### API Calls
- Place API functions in `frontend/src/api/`
- Use Supabase client for database operations
- Backend API endpoints follow REST conventions

## Database Schema

### Key Tables
- `users` - User accounts with roles (buyer, supplier, admin)
- `suppliers` - Supplier profiles linked to users
- `products` - Product catalog with sustainability data
- `rfqs` - Request for Quotes from buyers to suppliers

### Important Fields
- All tables use UUID primary keys
- `created_at` timestamps are auto-generated
- Sustainability data stored as JSONB in `products.sustainability_data`
- Product certifications stored as TEXT array in `products.certifications`

### Custom Types
- `user_role`: ENUM ('buyer', 'supplier', 'admin')
- `rfq_status`: ENUM ('pending', 'answered', 'closed')

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `AWS_ACCESS_KEY_ID` - AWS credentials for S3
- `AWS_SECRET_ACCESS_KEY` - AWS credentials for S3
- `AWS_REGION` - AWS region
- `AWS_S3_BUCKET` - S3 bucket name

## Testing

### Jest (Root Project)
- Test files are in `__tests__/` directories or named `*.test.ts`
- Uses `ts-jest` preset
- Run with `npm test`

### Frontend
- Tests should be placed adjacent to components
- Use React Testing Library for component tests

## Important Compliance Standards

The platform aligns with:
- ISO 14025: Type III Environmental Declarations (EPDs)
- EN 15804: Sustainability of construction works
- ISO 21930: Environmental declarations for building products
- EPD Hub GPI v1.3: General Program Instructions

## Key User Personas

### Buyer (Architect/Contractor)
- Discovers and compares green materials
- Sends RFQs to suppliers
- Manages projects and saved products

### Supplier (Manufacturer)
- Lists products with sustainability data
- Responds to RFQs
- Manages company profile and certifications

### Admin
- Moderates content
- Verifies suppliers
- Manages platform settings

## Additional Resources

- Architecture diagrams: `ARCHITECTURE-DIAGRAMS.md`
- Business plan: `BUSINESS-PLAN.md`
- Deployment guide: `CLOUD-DEPLOYMENT.md`
- Documentation index: `DOCUMENTATION-INDEX.md`
