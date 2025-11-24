# GreenChainz - Project Structure

## Directory Organization

### Root Level
- **frontend/** - React/TypeScript UI application (Vite + React Router)
- **backend/** - Node.js/Express API server with services and data providers
- **database-schemas/** - PostgreSQL schema definitions and migrations
- **supabase/** - Supabase edge functions and configuration
- **lambda/** - AWS Lambda functions for async processing
- **terraform/** - Infrastructure as Code for AWS resources
- **cloudflare-landing/** - Static landing pages for different user segments
- **docs/** - Strategic documentation, brand guidelines, deployment guides
- **emails/** - React email templates for transactional communications
- **aws/** - AWS CloudFormation templates (S3 bucket configuration)
- **app/** - Next.js app directory (legacy/alternative frontend)

### Frontend Structure (`frontend/src/`)
```
src/
├── api/              # API client functions and hooks
├── components/       # Reusable React components
├── context/          # React context providers
├── data/             # Static data and constants
├── email-templates/  # Email template components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and Supabase client
├── mocks/            # Mock data for testing
├── pages/            # Page components (routing)
├── store/            # Zustand state management
├── styles/           # Global CSS and Tailwind config
├── types/            # TypeScript type definitions
└── assets/           # Images, icons, static files
```

### Backend Structure (`backend/`)
```
backend/
├── config/           # Passport OAuth configuration
├── middleware/       # Express middleware (auth, etc.)
├── providers/        # Data provider integrations (EC3, EPD International, FSC, etc.)
├── routes/           # Express route handlers
├── services/         # Business logic services
├── scripts/          # Utility and seed scripts
├── public/           # Static files (admin dashboard HTML)
├── index.js          # Express server entry point
├── db.js             # PostgreSQL connection
├── eventLogger.js    # Event logging system
└── openapi.yaml      # API documentation
```

### Database Layer (`database-schemas/`)
```
database-schemas/
├── init.sql                    # Initial schema setup
├── mvp_schema.sql              # MVP feature schema
├── schema.sql                  # Main schema definition
├── performance-indexes.sql     # Query optimization indexes
├── seed-data-providers.sql     # Data provider seed data
├── seed-plans.sql              # Subscription plan seed data
└── migrations/                 # Versioned schema migrations
    ├── 20251107_214500_add_rfq_tables.sql
    └── 20251107_214900_add_search_indexes.sql
```

## Core Components & Relationships

### Data Flow Architecture
1. **Frontend** (React/TypeScript) → **Backend API** (Express)
2. **Backend** → **PostgreSQL** (Supabase) for transactional data
3. **Backend** → **Data Providers** (EC3, EPD International, FSC, etc.)
4. **Backend** → **S3** for file uploads/storage
5. **Backend** → **Email Service** (Resend/Nodemailer) for notifications
6. **Lambda** → Async EPD data synchronization

### Key Service Modules

#### Backend Services (`backend/services/`)
- **verificationScore.js** - Supplier verification scoring algorithm
- **certifierService.js** - B-Corp and certification verification
- **dataScoutService.js** - Data provider integration orchestration
- **ec3Service.js** - EC3 carbon data integration
- **epdInternational.js** - EPD International data provider
- **matchmakerService.js** - Supplier-buyer intelligent matching
- **rfqRouterService.js** - RFQ routing and management
- **marketIntelService.js** - Market trends and analytics
- **complianceOracleService.js** - Compliance checking and validation
- **emailService.js** - Email notification system
- **s3.js** - AWS S3 file management
- **bcorpService.js** - B-Corp certification verification

#### Data Providers (`backend/providers/`)
- **baseProvider.js** - Abstract base class for all providers
- **ec3.js** - EC3 carbon data provider
- **epdInternational.js** - EPD International provider
- **ecoPlatform.js** - Eco-Platform provider
- **fscMock.js** - FSC certification mock data

### Frontend Components (`frontend/src/components/`)
- **SupplierProductList.tsx** - Product listing and filtering
- **AdminConsole.tsx** - Admin dashboard and management
- **RFQ Components** - Request for Quote workflow
- **Search Components** - Product search and filtering
- **Auth Components** - Login and registration flows
- **Dashboard Components** - User dashboards and analytics

## Architectural Patterns

### API-First Design
- All platform functions exposed via REST/GraphQL APIs
- Swagger/OpenAPI documentation (`backend/openapi.yaml`)
- Decoupled frontend and backend for multi-channel flexibility

### Headless Commerce
- Presentation layer (frontend) completely decoupled from business logic (backend)
- Enables multi-channel deployment (web, mobile, third-party integrations)

### Service-Oriented Architecture
- Modular services handling specific business domains
- Each service has clear responsibility and interface
- Services communicate via well-defined APIs

### Data Provider Pattern
- Abstract base provider class for extensibility
- Multiple provider implementations (EC3, EPD International, FSC, etc.)
- Standardized data transformation and validation

### Authentication & Authorization
- Passport.js OAuth integration (GitHub, Google, LinkedIn, Microsoft)
- JWT token-based API authentication
- Session-based web authentication

## Technology Stack Integration

### Frontend Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS + PostCSS
- **UI Components**: Radix UI, Heroicons, Lucide React
- **HTTP Client**: Axios
- **Database Client**: Supabase JS SDK
- **Analytics**: React GA4
- **Email Rendering**: React Email

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Passport.js (OAuth)
- **File Storage**: AWS S3
- **Email**: Nodemailer, Resend
- **API Documentation**: Swagger UI + OpenAPI
- **Data Parsing**: Cheerio, CSV Parser

### Infrastructure
- **Frontend Hosting**: Vercel (Next.js/React deployment)
- **Backend Hosting**: Docker containers
- **Database**: Supabase (PostgreSQL managed)
- **CDN/Security**: Cloudflare (DDoS, WAF, SSL/TLS)
- **File Storage**: AWS S3
- **Async Processing**: AWS Lambda
- **IaC**: Terraform

## Database Schema Highlights

### Core Tables
- **users** - User accounts and profiles
- **suppliers** - Supplier company information
- **products** - Product listings with sustainability data
- **epds** - Environmental Product Declarations
- **certifications** - Product and supplier certifications
- **rfqs** - Request for Quote records
- **quotes** - Supplier quote responses
- **orders** - Purchase orders
- **compliance_records** - Compliance verification data

### Relationships
- Users → Suppliers (one-to-many)
- Suppliers → Products (one-to-many)
- Products → EPDs (one-to-many)
- Products → Certifications (many-to-many)
- RFQs → Quotes (one-to-many)
- Users → RFQs (one-to-many)
