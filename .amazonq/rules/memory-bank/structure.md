# Project Structure & Architecture

## Directory Organization

### Root Level
```
green-sourcing-b2b-app/
├── frontend/          # React/Vite frontend application
├── backend/           # Node.js/Express API server
├── supabase/          # Supabase edge functions
├── database-schemas/  # SQL schemas and migrations
├── emails/            # React Email templates
├── cloudflare-landing/ # Static landing pages
├── docs/              # Documentation and guides
├── assets/            # Shared images and logos
└── app/               # Next.js components (legacy)
```

## Core Components & Relationships

### Frontend Architecture (`/frontend/`)
- **Framework**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM for SPA navigation
- **Styling**: Tailwind CSS + custom CSS modules
- **State Management**: React Context (AuthContext)
- **API Client**: Axios + Supabase client

#### Key Directories:
- `src/pages/` - Route components (Admin, Auth, Dashboard, etc.)
- `src/components/` - Reusable UI components
- `src/lib/` - API utilities and Supabase configuration
- `src/types/` - TypeScript type definitions
- `src/context/` - React context providers

### Backend Architecture (`/backend/`)
- **Framework**: Node.js + Express.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: Passport.js with OAuth strategies
- **API Documentation**: OpenAPI/Swagger

#### Key Directories:
- `services/` - Business logic (FSC, B-Corp, EC3 integrations)
- `providers/` - Data provider integrations and mocks
- `middleware/` - Authentication and request processing
- `config/` - Passport OAuth configuration
- `scripts/` - Database seeding and utilities

### Database Layer (`/database-schemas/`)
- **Primary**: Supabase PostgreSQL
- **Schema Management**: SQL migrations with versioning
- **Data Strategy**: Hybrid SQL (transactions) + JSONB (flexible sustainability data)

#### Key Files:
- `schema.sql` - Complete database schema
- `migrations/` - Versioned schema changes
- `seed-*.sql` - Initial data population

### Email System (`/emails/`)
- **Framework**: React Email + Tailwind
- **Templates**: Transactional email components
- **Delivery**: Resend integration

### Deployment Infrastructure
- **Frontend**: Vercel (Next.js/React deployment)
- **Backend**: Docker containerization
- **Database**: Supabase managed PostgreSQL
- **CDN**: Cloudflare for static assets and security
- **Landing Pages**: Cloudflare Pages

## Architectural Patterns

### API-First Design
- RESTful endpoints with consistent response formats
- OpenAPI specification for documentation
- Separation of concerns between frontend and backend
- Stateless authentication with JWT tokens

### Headless Commerce
- Decoupled presentation layer (React) from business logic (Express)
- Multi-channel capability (web, mobile, API consumers)
- Independent scaling of frontend and backend

### Data-Centric Architecture
- Sustainability data as first-class citizen
- Flexible JSONB storage for varying EPD formats
- Normalized relational data for transactions
- External API integrations for real-time verification

### Component-Based Frontend
- Modular React components with TypeScript
- Shared design system components
- Context-based state management
- Route-based code splitting

### Microservices Approach
- Dedicated services for different data providers
- Modular email template system
- Separate authentication middleware
- Independent deployment units (frontend/backend/functions)