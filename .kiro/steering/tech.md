# GreenChainz Tech Stack

## Architecture

**API-First, Headless Architecture**: Decoupled frontend from backend for multi-channel flexibility and scalability.

## Frontend

- **Framework**: Next.js 14 (App Router) + React 18
- **Build Tool**: Vite (for frontend/ subdirectory)
- **Styling**: Tailwind CSS 4.x with custom glass-effect utilities
- **UI Components**: Radix UI, Heroicons, Lucide React
- **State Management**: Zustand
- **Routing**: React Router DOM (Vite app), Next.js App Router (Next app)
- **TypeScript**: Strict mode enabled
- **Deployment**: Vercel (auto-deploy from GitHub)

## Backend

- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL) + MongoDB (flexible product data)
- **Authentication**: Supabase Auth + Passport.js (OAuth: Google, GitHub, LinkedIn, Microsoft)
- **API Documentation**: OpenAPI/Swagger
- **Caching**: Redis (ioredis)
- **File Storage**: AWS S3
- **Email**: Nodemailer, Resend, MailerLite
- **Logging**: Winston
- **Security**: Helmet, Lusca, express-rate-limit, CORS

## Database Strategy

**Hybrid SQL + NoSQL**:

- SQL (Supabase/PostgreSQL): Transactional data (users, orders, RFQs)
- NoSQL (MongoDB/JSONB): Flexible sustainability data (EPDs, certifications, product metadata)

## External Integrations

- **Data Providers**: EPD International, WAP Sustainability, Building Transparency, FSC, EC3
- **Cloud Services**: AWS (S3), Azure (Functions, Maps)
- **Analytics**: Google Analytics 4, Vercel Speed Insights
- **Compliance**: CookieYes (GDPR/CCPA)
- **Design Tools**: Autodesk Forge API

## Infrastructure

- **CDN/Security**: Cloudflare (DDoS, WAF, SSL/TLS)
- **Serverless**: Azure Functions, AWS Lambda
- **IaC**: Terraform
- **Containers**: Docker, Docker Compose
- **CI/CD**: GitHub Actions, Vercel

## Common Commands

### Root Project (Next.js API Routes)

```bash
npm run dev          # Start dev server on port 3001
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Frontend (Vite + React)

```bash
cd frontend
npm run dev          # Start dev server on port 5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
npm run seed         # Seed database with test data
npm run seed:bulk    # Bulk seed operation
npm test             # Run Jest tests
```

### Backend (Express API)

```bash
cd backend
npm start            # Start production server
npm run dev          # Start dev server
npm run seed         # Seed database
npm run lint         # Lint code
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm test             # Run Jest tests
npm run test:coverage # Run tests with coverage
npm run test:watch   # Run tests in watch mode
```

### Testing Services

```bash
cd backend
node scripts/test-certifier.js           # Test certification verifier
node scripts/test-compliance-oracle.js   # Test compliance service
node scripts/test-matchmaker.js          # Test supplier matching
node scripts/test-rfq-router.js          # Test RFQ routing
node scripts/test-market-intel.js        # Test market intelligence
node scripts/test-crawler.js             # Test data crawler
node scripts/test-data-scout.js          # Test data scout
```

## Environment Variables

Required variables (see `.env.example` files):

- `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `MONGODB_URI`
- `REDIS_URL`
- OAuth credentials (Google, GitHub, LinkedIn, Microsoft)
- `NEXT_PUBLIC_GA_ID` (Google Analytics)
- `NEXT_PUBLIC_COOKIEYES_KEY`

## Code Style

- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Type Safety**: TypeScript strict mode
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **File Extensions**: `.tsx` for React components, `.ts` for utilities/types, `.js` for backend

## Testing

- **Framework**: Jest
- **Backend Tests**: API tests, security tests, Redis tests, error handler tests
- **Frontend Tests**: Component tests (setup in progress)
