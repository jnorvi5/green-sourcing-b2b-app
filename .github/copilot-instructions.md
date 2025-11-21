# Copilot Instructions for GreenChainz B2B Platform


GreenChainz is a B2B sustainable sourcing marketplace connecting verified green suppliers with sustainability-focused buyers. The platform features a **full-stack containerized architecture** with Node.js/Express backend, React/TypeScript frontend (Vite), PostgreSQL database, OAuth authentication, event sourcing, and external data provider integrations.

## Architecture and Source of Truth

### Stack at a Glance
- **Backend**: Node.js + Express REST API (port 3001) with JWT auth, OAuth (Google/GitHub/LinkedIn/Microsoft), and Supabase Edge Function integration
- **Frontend**: React 19 + TypeScript + Vite dev server (port 5173) with Tailwind CSS
- **Database**: PostgreSQL 15 with event sourcing architecture (Product_Events, Certification_Events, Supply_Chain_Events)
- **Container Orchestration**: Docker Compose with 3 services (db, backend, frontend)
- **Key Pattern**: Monolithic backend with modular service layer (`services/`, `providers/`, `middleware/`)

### Critical Directory Structure

- **`backend/`** - Express API server (fully implemented)
  - `index.js` - Main entry point with ~1400 lines of route definitions
  - `db.js` - PostgreSQL connection pooling with `pg` library
  - `middleware/auth.js` - JWT authentication and role-based authorization
  - `services/` - Business logic (verificationScore, mailer, errorMonitoring, bcorpService)
  - `providers/` - External data integrations (baseProvider.js abstract class, fscMock.js)
  - `config/passport.js` - OAuth strategies for 4 providers
  - `eventLogger.js` - Blockchain-ready immutable event logging with SHA-256 hashing
  - `scripts/seed.js` - Database seeding for demo data

- **`frontend/`** - React + TypeScript SPA (Vite)
  - `src/main.tsx` - Entry point with React Router and AuthContext
  - `src/lib/api.ts` - Axios client with JWT interceptor for `http://localhost:3001/api`
  - `src/lib/supabaseClient.ts` - Supabase client for OAuth and edge functions
  - `src/context/AuthContext.tsx` - Supabase-based authentication state management
  - `src/pages/` - Full page components (LandingPage, SupplierDashboard, BuyerDashboard, Admin)
  - Dev server proxies to backend at `localhost:3001`

- **`database-schemas/`** - PostgreSQL schemas and migrations
  - `schema.sql` - Main schema with event sourcing tables (~610 lines)
  - `mvp_schema.sql` - Simplified schema for MVP
  - `init.sql`, `seed-*.sql` - Initialization and seeding scripts
  - **Key tables**: Users, Companies, Suppliers, Certifications, FSC_Certifications, Product_Events, Certification_Events, Supply_Chain_Events

- **`docker-compose.yml`** - Three-service stack
  - `db` service: PostgreSQL 15 on port 5432 (container: `greenchainz-db`)
  - `backend` service: Express API on port 3001 (container: `greenchainz-backend`)
  - `frontend` service: Vite dev server on port 5173 (container: `greenchainz-frontend`)
  - Environment variables: `POSTGRES_HOST=db` for inter-container communication

⚠️ **Gotcha**: Empty `green-sourcing-b2b-app/` directory at root is a structural artifact - ignore it.

## Critical Patterns and Conventions

### Authentication & Authorization
- **JWT-based auth**: `middleware/auth.js` exports `authenticateToken` and `authorizeRoles(...roles)`
- **OAuth providers**: Google, GitHub, LinkedIn, Microsoft via Passport.js (`config/passport.js`)
- **Supabase integration**: Frontend uses Supabase Auth for OAuth flows; backend validates JWTs
- **Token storage**: Frontend stores JWT in `localStorage` under key `greenchainz-token`
- **Role system**: Users have roles ('Admin', 'Buyer', 'Supplier') - check with `authorizeRoles('Admin', 'Supplier')`

### Database Access Pattern
- **Always use the connection pool**: `const { pool } = require('./db');`
- **Environment-driven config**: `backend/db.js` reads `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` from `.env`
- **Containerized host**: Use `POSTGRES_HOST=db` in docker-compose (not `localhost`)
- **Parameterized queries**: Always use `$1, $2` placeholders to prevent SQL injection
- **Event sourcing**: Log all state changes via `eventLogger.js` functions (immutable, hash-chained)

### External Provider Integration
- **Abstract base class**: All providers extend `providers/baseProvider.js`
- **Workflow**: `fetch()` → `transform()` → `validate()` → `insertRecords()`
- **Example**: `providers/fscMock.js` reads JSON, transforms to schema, validates FSC cert numbers
- **Registration**: Providers tracked in `Data_Providers` table with status, API costs, last sync timestamp

### Frontend-Backend Communication
- **Base URL**: Frontend uses `http://localhost:3001/api` (see `frontend/src/lib/api.ts`)
- **JWT injection**: Axios interceptor adds `Authorization: Bearer <token>` header automatically
- **CORS**: Backend allows `http://localhost:5173` (frontend dev server) in `cors()` middleware
- **Supabase Edge Functions**: Used for transactional emails (password reset, welcome emails)

## Developer Workflows

### Full Stack Startup (Docker Compose)

**Start all services** (db, backend, frontend):
```bash
docker compose up -d

This repository contains the GreenChainz B2B platform - a verified sustainable sourcing platform that serves as the global trust layer for sustainable commerce. The stack uses Node.js/Express backend, React/Vite frontend with TypeScript, and PostgreSQL database orchestrated via Docker Compose.

## Architecture and Source of Truth

### Primary Working Tree
**Always prefer these top-level directories** when making changes:

- **`backend/`** - Node.js + Express API server
  - Entry point: `backend/index.js`
  - **Current state**: Fully functional Express server with comprehensive REST API
  - **Tech stack**: Express 4.18, PostgreSQL (via `pg`), JWT auth, Passport.js OAuth
  - **Key dependencies**: 
    - Authentication: `bcrypt`, `jsonwebtoken`, `passport`, `express-session`
    - OAuth providers: `passport-google-oauth20`, `passport-github2`, `passport-linkedin-oauth2`, `passport-microsoft`
    - Database: `pg` (PostgreSQL client)
    - Email: `nodemailer`
    - API docs: `swagger-ui-express`, OpenAPI 3.0 spec in `openapi.yaml`
    - Data providers: FSC mock integration, verification scoring
  - **Structure**:
    ```
    backend/
    ├── index.js           # Main Express app entry point
    ├── db.js              # PostgreSQL connection pool
    ├── openapi.yaml       # OpenAPI 3.0 API specification
    ├── config/            # Configuration (passport strategies)
    ├── middleware/        # Auth middleware (JWT, role-based access)
    ├── providers/         # External data provider integrations (FSC)
    ├── services/          # Business logic (verification scores, mailer, error monitoring)
    ├── scripts/           # Database seeding scripts
    └── public/            # Static admin dashboard files
    ```

- **`frontend/`** - React + Vite + TypeScript application
  - **Current state**: Fully scaffolded modern React SPA with TypeScript
  - **Tech stack**: 
    - Build tool: Vite 7.x
    - Framework: React 19.x with TypeScript
    - Routing: React Router DOM 6.x
    - Styling: Tailwind CSS 3.x with autoprefixer
    - Icons: Heroicons
    - API client: Axios
    - Backend integration: Supabase client (`@supabase/supabase-js`)
  - **Dev server**: Runs on port 5173 (Vite default)
  - **Build command**: `npm run build` (outputs to `dist/`)
  - **Linting**: ESLint with React hooks and TypeScript support
  - **Structure**:
    ```
    frontend/
    ├── src/
    │   ├── main.tsx       # App entry point
    │   ├── App.tsx        # Root component
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Route pages
    │   ├── api/           # API client utilities
    │   ├── context/       # React context providers
    │   ├── types/         # TypeScript type definitions
    │   ├── lib/           # Utility functions
    │   └── mocks/         # Mock data for development
    ├── public/            # Static assets
    └── index.html         # HTML entry point
    ```

- **`database-schemas/`** - PostgreSQL schema definitions and migrations
  - **Current state**: Contains production schema with migrations
  - **Files**:
    - `schema.sql` - Full database schema (26KB+)
    - `init.sql` - Database initialization script
    - `mvp_schema.sql` - MVP-specific schema
    - `seed-data-providers.sql` - Seed data for sustainability data providers
    - `seed-plans.sql` - Subscription plan seeding
    - `migrations/` - Migration scripts with timestamps
  - **Pattern**: Raw SQL files with manual migration tracking

- **`docker-compose.yml`** - Infrastructure orchestration
  - **Current state**: Defines all three services: database, backend, and frontend
  - **Services**:
    - `db` (PostgreSQL 15) - Port 5432
    - `backend` (Node.js/Express) - Port 3001
    - `frontend` (Vite dev server) - Port 5173
  - **Networking**: Services communicate via Docker network, backend connects to `db:5432`
  - **Volumes**: Persistent PostgreSQL data in `greenchainz-db-data` volume

### Repository Structure Gotcha
⚠️ **Important**: There is an empty nested directory `green-sourcing-b2b-app/` at the repository root. This is a structural artifact - **always work in the top-level directories** (`backend/`, `frontend/`, `database-schemas/`) to avoid confusion and drift between duplicate structures.

## Runtime Configuration and Ports

### Database (PostgreSQL 15)
Managed via `docker-compose.yml`:
- **Service name**: `db`
- **Container name**: `greenchainz-db`
- **Image**: `postgres:15`
- **Environment variables** (from `.env` or defaults):
  - `POSTGRES_USER=${DB_USER:-user}`
  - `POSTGRES_PASSWORD=${DB_PASSWORD:-password}`
  - `POSTGRES_DB=${DB_NAME:-greenchainz_dev}`
- **Port mapping**: `5432:5432` (host:container)
- **Volume**: `greenchainz-db-data` (persistent storage)
- **Connection strings**:
  - From host: `postgres://user:password@localhost:5432/greenchainz_dev`
  - From backend container: `postgres://user:password@db:5432/greenchainz_dev`

### Backend API Server
Fully containerized and managed via Docker Compose:
- **Service name**: `backend`
- **Container name**: `greenchainz-backend`
- **Port**: `3001`
- **Start command**: `npm start` (runs `node index.js`)
- **Environment variables**:
  - `NODE_ENV=development`
  - `PORT=3001`
  - `POSTGRES_HOST=db` (Docker network hostname)
  - Database credentials (DB_USER, DB_PASSWORD, DB_NAME)
  - OAuth credentials (GOOGLE_CLIENT_ID, GITHUB_CLIENT_ID, etc.)
  - JWT_SECRET for authentication
  - SMTP settings for email notifications
  - FRONTEND_URL for CORS configuration
- **Dependencies**: Depends on `db` service
- **API Documentation**: Available at `http://localhost:3001/api-docs` (Swagger UI)

### Frontend Dev Server
Containerized Vite development server:
- **Service name**: `frontend`
- **Container name**: `greenchainz-frontend`
- **Port**: `5173` (Vite default)
- **Start command**: `npm run dev`
- **Environment variables**:
  - `NODE_ENV=development`
  - `VITE_API_BASE_URL=http://localhost:3001` (backend API)
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- **Dependencies**: Depends on `backend` service
- **HMR (Hot Module Replacement)**: Enabled for instant UI updates

## Developer Workflows

### Initial Setup

1. **Copy environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials (database, OAuth, SMTP, etc.)
   ```

2. **Start all services with Docker Compose**:
   ```bash
   docker compose up -d
   ```
   This starts all three services: PostgreSQL, backend, and frontend.

3. **Verify services are running**:
   ```bash
   docker ps
   # Should show: greenchainz-db, greenchainz-backend, greenchainz-frontend
   ```

4. **View logs (if needed)**:
   ```bash
   docker compose logs -f backend   # Backend logs
   docker compose logs -f frontend  # Frontend logs
   docker compose logs -f db        # Database logs
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs
   - Database: localhost:5432

### Alternative: Local Development (without Docker)

For faster development iteration, you can run services locally:

1. **Start only the database in Docker**:
   ```bash
   docker compose up -d db
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Update .env for local development**:
   ```bash
   # Change POSTGRES_HOST from 'db' to 'localhost'
   POSTGRES_HOST=localhost
   ```

4. **Start backend locally**:
   ```bash
   cd backend
   npm start
   # Or for development: npm run dev
   ```

5. **Install frontend dependencies** (in new terminal):
   ```bash
   cd frontend
   npm install
   ```

6. **Start frontend dev server**:
   ```bash
   cd frontend
   npm run dev
   ```

### Making Code Changes

**Backend changes**:
```bash
# Docker approach: rebuild and restart
docker compose up -d --build backend

# Local approach: restart process
# Backend doesn't have hot reload, so you need to restart manually
```

**Frontend changes**:
- Vite has hot module replacement (HMR) - changes appear instantly
- No restart needed in either Docker or local mode

**Database changes**:
1. Create migration file in `database-schemas/migrations/`:
   ```bash
   cd database-schemas/migrations
   # Use naming: YYYYMMDD_HHMMSS_description.sql
   ```

2. Apply migration:
   ```bash
   docker exec -i greenchainz-db psql -U user -d greenchainz_dev < database-schemas/migrations/your-migration.sql
   ```

3. Or connect and run manually:
   ```bash
   docker exec -it greenchainz-db psql -U user -d greenchainz_dev
   ```

### Database Access and Management

**Connect to PostgreSQL using psql**:
```bash
docker exec -it greenchainz-db psql -U user -d greenchainz_dev

```

**Verify containers are running**:
```bash
docker ps
# Should see: greenchainz-db, greenchainz-backend, greenchainz-frontend
```

**View logs** (all services):
```bash
docker compose logs -f
```

**Stop all services**:
```bash
docker compose down
```

### Backend Development

**Run backend standalone** (for development):
```bash
cd backend
npm install              # Install dependencies
npm run dev              # Starts backend on port 3001
```

**Seed database** with demo data:
```bash
npm run seed             # Runs backend/scripts/seed.js

**Useful psql commands**:
```sql
\dt              -- List all tables
\d table_name    -- Describe table structure
\dt+             -- List tables with sizes
\dn              -- List schemas
\df              -- List functions
\l               -- List databases
\q               -- Quit psql
```

**Reset database** (⚠️ destroys all data):
```bash
docker compose down -v
docker compose up -d db
# Then re-apply schema and migrations

```

**Access API documentation**:
- OpenAPI/Swagger UI: `http://localhost:3001/docs`
- Raw YAML spec: `http://localhost:3001/api/docs`


**Test endpoints**:
```bash
# Health check
curl http://localhost:3001/

# Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123","role":"Buyer"}'
```

### Frontend Development

**Run frontend standalone**:
```bash
cd frontend
npm install
npm run dev              # Starts Vite dev server on port 5173
```

**Build for production**:
```bash
npm run build            # Creates optimized build in frontend/dist/
```

### Database Management

**Connect to PostgreSQL**:
```bash
docker exec -it greenchainz-db psql -U user -d greenchainz_dev
```

**Apply schema changes**:
```bash
docker exec -i greenchainz-db psql -U user -d greenchainz_dev < database-schemas/schema.sql
```

**Check event sourcing integrity**:
```sql
-- Verify Product_Events chain
SELECT EventID, ProductID, EventType, EventHash, PreviousEventHash 
FROM Product_Events 
WHERE ProductID = 1 
ORDER BY Timestamp ASC;
```

1. **Make code changes**:
   - Backend: Edit files in `backend/` (routes, services, middleware)
   - Frontend: Edit files in `frontend/src/` (components, pages, API calls)
   - Database: Create migration in `database-schemas/migrations/`

2. **Test changes**:
   - Backend: Restart service (`docker compose restart backend` or local restart)
   - Frontend: Hot reload automatically shows changes
   - API: Test with `curl`, Postman, or Swagger UI at `/api-docs`

3. **Run linter** (frontend only currently):
   ```bash
   cd frontend
   npm run lint
   ```

4. **Build for production** (test build integrity):
   ```bash
   cd frontend
   npm run build
   ```

5. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: descriptive message"
   git push
   ```


## Coding Patterns and Conventions

### Backend Route Structure

Routes are defined directly in `backend/index.js` (~1400 lines). Major route groups:


```javascript
// Auth routes (register, login, OAuth callbacks)
app.post('/api/v1/auth/register', async (req, res) => { /* bcrypt + JWT */ });
app.post('/api/v1/auth/login', async (req, res) => { /* validate + token */ });
app.get('/auth/:provider/callback', passport.authenticate(...), (req, res) => {});

// Protected routes (use authenticateToken middleware)
app.get('/api/v1/auth/me', authenticateToken, async (req, res) => {});

// Admin-only routes (use authorizeRoles)
app.post('/api/v1/suppliers/:id/certifications', 
  authenticateToken, authorizeRoles('Admin'), 
  async (req, res) => {}
);
```

**Pattern**: Inline route handlers with direct `pool.query()` calls. For complex logic, use `services/` modules.

### Service Layer Pattern

**Verification Score Service** (`services/verificationScore.js`):
```javascript
const { computeSupplierScore, persistSupplierScore } = require('./services/verificationScore');

// Compute score based on certifications
const scoreData = await computeSupplierScore(pool, supplierId);
// Score formula: BASE_SCORE + (distinctBodies * 5) + (nonExpired * 3) - (expired * 2)
```

**Mailer Service** (`services/mailer.js`):
```javascript
const { sendEmail } = require('./services/mailer');

await sendEmail({
  to: user.email,
  subject: 'Welcome to GreenChainz',
  text: 'Thank you for registering...',
  notificationType: 'welcome_email'
});
```

### Data Provider Integration

**Create a new provider** by extending `BaseProvider`:
```javascript
// providers/myProvider.js
const BaseProvider = require('./baseProvider');

class MyProvider extends BaseProvider {
  constructor() {
    super('My Provider', 'certification');
  }

  async fetch(options) {
    // Fetch data from external API or file
    return rawData;
  }

  async transform(rawData) {
    // Convert to GreenChainz schema
    return transformedData.map(record => ({
      certificateNumber: record.cert_id,
      certificateHolder: record.company,
      // ... map other fields
    }));
  }

  validateRecord(record) {
    const errors = [];
    if (!record.certificateNumber) errors.push('Missing certificate number');
    return { isValid: errors.length === 0, errors };
  }

  async insertRecords(validRecords, dbPool) {
    // Insert into database with UPSERT pattern
    // Return { inserted, updated, errors }
  }
}
```

**Run provider sync**:
```javascript
const provider = new MyProvider();
const stats = await provider.sync({}, pool);
// Returns: { fetched, transformed, valid, invalid, inserted, updated, errors }
```

### Event Sourcing Pattern

**Log events** for audit trail and blockchain readiness:
```javascript
const { logCertificationEvent } = require('./eventLogger');

await logCertificationEvent(
  pool,
  certificationId,
  supplierId,
  'API_VERIFIED',
  { verifiedBy: 'FSC API', confidence: 0.95 },
  'FSC_API',
  userId,
  req.ip
);
// Creates hash-chained immutable event record

**Current Pattern** - Routes defined in `backend/index.js`:
```javascript
// Authentication required for protected routes
app.get('/api/v1/suppliers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // Query database using pool from db.js
  const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
  res.json(result.rows[0]);
});

// Role-based authorization
app.post('/api/v1/admin/users', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  // Admin-only endpoint logic
});
```

**API Structure**:
- All API routes use `/api/v1/` prefix
- RESTful conventions: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
- OpenAPI documentation in `backend/openapi.yaml` - keep this updated!
- Swagger UI auto-generated from OpenAPI spec

**Database Access**:
- Use connection pool from `backend/db.js`:
  ```javascript
  const { pool } = require('./db');
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  ```
- Always use parameterized queries ($1, $2, etc.) to prevent SQL injection
- Handle errors gracefully with try-catch

**Authentication & Authorization**:
- JWT tokens for API authentication
- Middleware: `authenticateToken` (verify JWT), `authorizeRoles(['role'])` (check permissions)
- OAuth supported: Google, GitHub, LinkedIn, Microsoft (via Passport.js)
- Session-based auth for OAuth flows

**Services Pattern**:
```
backend/services/
├── verificationScore.js  # Supplier verification scoring
├── mailer.js             # Email notifications
└── errorMonitoring.js    # Error tracking
```

### Frontend Development

**React + TypeScript Patterns**:
```tsx
// Use functional components with TypeScript
interface ProductProps {
  id: string;
  name: string;
}

const ProductCard: React.FC<ProductProps> = ({ id, name }) => {
  const [loading, setLoading] = useState(false);
  
  // API calls using axios
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/products/${id}`)
      .then(response => setProduct(response.data))
      .catch(error => console.error(error));
  }, [id]);
  
  return <div>{name}</div>;
};
```

**Styling**:
- Use Tailwind CSS utility classes
- Common patterns:
  ```tsx
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
    Click Me
  </button>
  ```

**Routing** (React Router v6):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/suppliers" element={<SuppliersList />} />
  <Route path="/suppliers/:id" element={<SupplierDetails />} />
</Routes>
```

**API Communication**:
- Base URL configured via `VITE_API_BASE_URL` environment variable
- Use axios for HTTP requests
- Create API utility functions in `frontend/src/api/`

**State Management**:
- React Context for global state (see `frontend/src/context/`)
- Local state with `useState` for component-specific state
- `useEffect` for side effects and data fetching

**Icons**: Use Heroicons from `@heroicons/react`
```tsx
import { UserIcon } from '@heroicons/react/24/outline';
<UserIcon className="h-6 w-6" />

```

### Frontend Authentication

**Protected routes** with AuthContext:
```typescript
// frontend/src/pages/SupplierDashboard.tsx
import { useAuth } from '../context/AuthContext';

const SupplierDashboard = () => {
  const { user, session, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <div>Dashboard for {user.email}</div>;
};
```


**API calls** with JWT:
```typescript
// frontend/src/lib/api.ts
import api from '../lib/api';

// Token automatically added by Axios interceptor
const response = await api.get('/v1/suppliers');
const suppliers = response.data;
```

## Integration Points and Dependencies

### Backend Dependencies (`backend/package.json`)
- **Core**: `express`, `pg` (PostgreSQL client), `dotenv`, `cors`
- **Authentication**: `bcrypt`, `jsonwebtoken`, `passport`, `passport-google-oauth20`, `passport-github2`, `passport-linkedin-oauth2`, `passport-microsoft`
- **Session**: `express-session`
- **Email**: `nodemailer`
- **API Docs**: `swagger-ui-express`, `yaml`
- **Web Scraping**: `cheerio` (for provider data extraction)
- **CSV Processing**: `csv-parser`
- **Supabase**: `@supabase/supabase-js`

### Frontend Dependencies (`frontend/package.json`)
- **Core**: `react@19`, `react-dom@19`, `react-router-dom`
- **HTTP Client**: `axios`
- **UI**: `@heroicons/react`, `tailwindcss`
- **Supabase**: `@supabase/supabase-js`
- **Build Tool**: `vite`
- **TypeScript**: Full TypeScript support with type definitions

### Root Dependencies (`package.json`)
- **Email Templates**: `@react-email/components`, `@react-email/render`, `@react-email/tailwind`
- **Email Service**: `resend`
- **Supabase**: `@supabase/supabase-js`
- **Analytics**: `@vercel/speed-insights`

### External Integrations
- **Supabase**: OAuth authentication, Edge Functions for transactional emails
- **Data Providers**: FSC Mock (file-based), future: B Corp API, EPD databases
- **Future**: Stripe for payments, AWS S3 for file storage
=======
**Environment variables are managed via `.env` file** (never commit this file!):

1. **Copy the template**:
   ```bash
   cp .env.example .env
   ```

2. **Required variables** (see `.env.example` for full list):
   - `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database credentials
   - `JWT_SECRET` - Secret for JWT token signing
   - `SESSION_SECRET` - Secret for session management (min 32 chars)
   - `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
   - OAuth credentials: `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, etc.
   - Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

3. **Environment-specific configs**:
   - Development: Use `.env` with localhost URLs
   - Docker Compose: Use `POSTGRES_HOST=db` (service name)
   - Production: Set all variables in hosting platform (Vercel, Railway, etc.)

4. **Frontend variables**:
   - Must be prefixed with `VITE_` to be accessible in browser
   - Access via `import.meta.env.VITE_API_BASE_URL`
   - Embedded at build time, not runtime

5. **Backend variables**:
   - Loaded via `dotenv` in `backend/index.js`
   - Access via `process.env.VARIABLE_NAME`
   - Available at runtime

## Integration Points and Dependencies

### Current Dependencies

**Backend** (`backend/package.json`):
- **Core**: Express 4.18, Node.js (CommonJS)
- **Database**: `pg` 8.11 (PostgreSQL client with connection pooling)
- **Authentication**: `jsonwebtoken`, `bcrypt`, `passport` with OAuth strategies
- **OAuth Providers**: Google, GitHub, LinkedIn, Microsoft (via passport strategies)
- **Email**: `nodemailer` for transactional emails
- **API Documentation**: `swagger-ui-express`, `yaml` parser
- **Utilities**: `dotenv`, `cors`, `express-session`, `csv-parser`, `cheerio`
- **External Integrations**: FSC mock provider, Supabase client

**Frontend** (`frontend/package.json`):
- **Core**: React 19.x, TypeScript, Vite 7.x (ES modules)
- **Routing**: React Router DOM 6.x
- **Styling**: Tailwind CSS 3.x, PostCSS, Autoprefixer
- **HTTP Client**: Axios
- **Backend Integration**: Supabase client
- **Icons**: Heroicons
- **Dev Tools**: ESLint, TypeScript ESLint, Vite plugins

**Infrastructure**:
- **Database**: PostgreSQL 15 (Docker image)
- **Container orchestration**: Docker Compose
- **Build Tools**: Vite (frontend), Node.js (backend)

### Active Integrations

1. **Supabase** - Backend-as-a-Service
   - Authentication (OAuth, email)
   - Realtime subscriptions
   - Storage (file uploads)
   - Environment: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

2. **OAuth Providers** (via Passport.js)
   - Google OAuth 2.0
   - GitHub OAuth
   - LinkedIn OAuth 2.0
   - Microsoft OAuth 2.0
   - Callback URLs: `http://localhost:3001/auth/{provider}/callback`

3. **Email Service** (Nodemailer)
   - SMTP configuration (Gmail, SendGrid, Mailgun, etc.)
   - Transactional emails (user notifications, admin alerts)
   - Environment: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

4. **Data Providers**
   - FSC (Forest Stewardship Council) - Mock implementation
   - Verification scoring system
   - Future: EC3, B Corp, other sustainability databases

### Future Integration Points
- **Search**: Full-text search for products/suppliers (PostgreSQL full-text or Elasticsearch)
- **File Storage**: Product images, certifications (Supabase Storage or S3)
- **Analytics**: Usage tracking, sustainability metrics
- **Payment Processing**: Stripe/PayPal for transactions
- **Message Queue**: Background jobs (Bull/Redis)


## Cross-Cutting Conventions

### Version Control
- **Branch strategy**: Feature branches, pull requests for review
- **Commit messages**: Use conventional commits (feat:, fix:, docs:, etc.)
- **Never commit**: `.env` files, `node_modules/`, build artifacts

### Code Style
- **JavaScript**: Use ES6+ features, async/await over callbacks
- **Indentation**: 2 spaces (matches existing `backend/index.js`)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **API routes**: RESTful conventions (`/api/resources`, use HTTP verbs correctly)

### Docker and Infrastructure
- **docker-compose.yml is the source of truth** for all service configuration
- When adding new services, use `depends_on` to define service dependencies
- Use named volumes for persistence (like `postgres_data`)
- Pin image versions (e.g., `postgres:15` not `postgres:latest`)

### Testing Strategy

**Current State**: No test framework configured yet

**When adding tests**:

**Backend Testing**:
- Unit tests: `jest` or `mocha` + `chai`
- API integration tests: `supertest`
- Add scripts to `backend/package.json`:
  ```json
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
  ```
- Place tests: `backend/__tests__/` or alongside files as `*.test.js`

**Frontend Testing**:
- Unit/Component tests: `vitest` (native Vite integration)
- React component tests: `@testing-library/react`
- E2E tests: `playwright` or `cypress`
- Add scripts to `frontend/package.json`:
  ```json
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  }
  ```
- Place tests: `frontend/src/**/*.test.tsx` or `frontend/tests/`

**Database Testing**:
- Create test database: `greenchainz_test`
- Use transactions in tests (rollback after each test)
- Seed test data in `database-schemas/test-data.sql`

## Key Files Reference Guide

| File | Purpose | Current State |
|------|---------|---------------|
| `docker-compose.yml` | Infrastructure definition | Defines 3 services: db, backend, frontend |
| `backend/index.js` | Express API entry point | Full REST API with auth, OAuth, database |
| `backend/db.js` | PostgreSQL connection pool | Database connection configuration |
| `backend/openapi.yaml` | API specification | OpenAPI 3.0 spec for all endpoints |
| `backend/middleware/auth.js` | Auth middleware | JWT verification, role-based access |
| `backend/services/` | Business logic | Verification scoring, email, monitoring |
| `frontend/src/main.tsx` | React app entry | TypeScript + React 19 entry point |
| `frontend/src/App.tsx` | Root component | Main app component with routing |
| `frontend/vite.config.ts` | Vite configuration | Build tool configuration |
| `frontend/tailwind.config.js` | Tailwind config | CSS framework configuration |
| `database-schemas/schema.sql` | Main database schema | Full table definitions (26KB+) |
| `database-schemas/migrations/` | Database migrations | Timestamped migration scripts |
| `.env.example` | Environment template | All required env variables documented |
| `README.md` | Project overview | Platform mission, tech stack, status |

## Common Pitfalls and Gotchas


### ⚠️ Environment Variables Required
**Problem**: Backend fails to start with missing environment variable errors

**Solution**: Create `.env` file in project root with required variables:
```bash
# Database (for backend)
POSTGRES_HOST=localhost  # Use 'db' when running in Docker
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=greenchainz_dev

# Docker Compose (use DB_* prefix)
DB_USER=user
DB_PASSWORD=password
DB_NAME=greenchainz_dev

# Backend
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=greenchainz-session-secret
FRONTEND_URL=http://localhost:5173

# Supabase (for OAuth and edge functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Email (optional)
NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=no-reply@greenchainz.com
ADMIN_EMAIL=admin@greenchainz.com
```

### ⚠️ Missing .env File
**Problem**: Services fail to start with errors about missing environment variables

**Solution**: 
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

### ⚠️ Wrong POSTGRES_HOST
**Problem**: Backend can't connect to database

**Checklist**:
- Docker Compose: Use `POSTGRES_HOST=db` (service name)
- Local development: Use `POSTGRES_HOST=localhost`
- Connection refused: Is database running? (`docker ps | grep greenchainz-db`)

### ⚠️ Frontend VITE_ Variables Not Working
**Problem**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solution**: 
- Environment variables MUST be prefixed with `VITE_`
- Variables are embedded at build time
- After changing `.env`, restart dev server: `docker compose restart frontend`

### ⚠️ OAuth Redirect Mismatch
**Problem**: OAuth login fails with "redirect_uri_mismatch"

**Solution**:
- Callback URLs must match exactly in OAuth provider settings
- Development: `http://localhost:3001/auth/{provider}/callback`
- Update `.env`: `GOOGLE_CALLBACK_URL`, `GITHUB_CALLBACK_URL`, etc.
- No trailing slash!


### ⚠️ Duplicate Directory Structure
**Problem**: There's a confusing empty `green-sourcing-b2b-app/` directory at repo root

**Solution**: **Always work in top-level directories** (`backend/`, `frontend/`, `database-schemas/`). Ignore the nested directory unless specifically instructed otherwise.

### ⚠️ Database Connection from Backend
**Problem**: Backend can't connect to database with error "connection refused"

**Checklist**:
1. Is the database running? (`docker ps` should show `greenchainz_db`)
2. Is the connection string correct? (`postgres://user:password@localhost:5432/greenchainz_dev`)
3. Are you using the right host? (`localhost` from host, `db` from within docker-compose network)

### ⚠️ Port Conflicts
**Problem**: "Port 5432 already in use" or "Port 3001 already in use"

**Solution**:
- For PostgreSQL: Stop existing postgres service or change port in `docker-compose.yml`
- For backend: Change `const port = 3001` in `backend/index.js` or stop other process

### ⚠️ Docker Compose Version
**Problem**: `docker-compose` command not found or version too old

**Solution**: Use `docker compose` (without hyphen) - built into Docker Desktop. Requires Docker 20.10+

### ⚠️ TypeScript Errors in Frontend
**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
cd frontend
npm run build:check  # Type-check before building
# Fix type errors in your code
```

### ⚠️ CORS Errors in Browser
**Problem**: API calls fail with CORS errors

**Checklist**:
- Is `FRONTEND_URL` set correctly in backend `.env`? (default: http://localhost:5173)
- Backend CORS config allows credentials: `credentials: true`
- Frontend axios calls include: `withCredentials: true` (for cookies/sessions)

### ⚠️ Port Already in Use
**Problem**: "Port 5432/3001/5173 already in use"

**Solution**:
```bash
# Find and kill process using the port
lsof -ti:3001 | xargs kill -9  # macOS/Linux
# Or change port in docker-compose.yml
```

## Quick Validation Checklist

### After Backend Changes
1. ✅ Backend builds without errors: `docker compose up --build backend`
2. ✅ Backend starts successfully: `docker compose logs backend`
3. ✅ API responds: `curl http://localhost:3001/api/v1/health` (or similar endpoint)
4. ✅ OpenAPI spec updated: Edit `backend/openapi.yaml` if routes changed
5. ✅ Check Swagger UI: http://localhost:3001/api-docs
6. ✅ No sensitive data in code (use environment variables)
7. ✅ Database queries use parameterized syntax (prevent SQL injection)

### After Frontend Changes
1. ✅ TypeScript compiles: `cd frontend && npm run build:check`
2. ✅ Linter passes: `cd frontend && npm run lint`
3. ✅ Production build succeeds: `cd frontend && npm run build`
4. ✅ UI displays correctly in browser: http://localhost:5173
5. ✅ Console has no errors: Check browser dev tools
6. ✅ API calls work: Check network tab for 200 responses

### After Database Changes
1. ✅ Migration script created: `database-schemas/migrations/YYYYMMDD_HHMMSS_description.sql`
2. ✅ Migration applied successfully
3. ✅ Can connect: `docker exec -it greenchainz-db psql -U user -d greenchainz_dev`
4. ✅ Tables exist: `\dt` in psql
5. ✅ Sample queries work
6. ✅ Backend can connect and query new schema

### Before Committing
1. ✅ No `.env` files in commit (check `.gitignore`)
2. ✅ No `node_modules/` in commit
3. ✅ No `dist/` or `build/` artifacts
4. ✅ No sensitive credentials in code
5. ✅ README.md updated if public API changed
6. ✅ This file (copilot-instructions.md) updated if architecture changed
7. ✅ OpenAPI spec updated if API routes changed
8. ✅ Commit message follows convention: `feat:`, `fix:`, `docs:`, etc.

## Getting Help and Debugging

### Database Issues
```bash
# Check database logs
docker logs greenchainz-db

# Check if database is accepting connections
docker exec greenchainz-db pg_isready -U user

# View database size and connections
docker exec -it greenchainz-db psql -U user -d greenchainz_dev -c "\l+"
docker exec -it greenchainz-db psql -U user -d greenchainz_dev -c "SELECT * FROM pg_stat_activity;"

# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d db
# Re-apply schema
docker exec -i greenchainz-db psql -U user -d greenchainz_dev < database-schemas/schema.sql
```

### Backend Issues
```bash
# View backend logs
docker compose logs -f backend

# Check what's using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Restart backend
docker compose restart backend

# Rebuild backend (after package.json changes)
docker compose up -d --build backend

# Execute commands inside backend container
docker exec -it greenchainz-backend npm list  # List installed packages
docker exec -it greenchainz-backend node -v   # Check Node version
```

### Frontend Issues
```bash
# View frontend logs (Vite output)
docker compose logs -f frontend

# Clear Vite cache
docker exec -it greenchainz-frontend rm -rf node_modules/.vite

# Rebuild frontend
docker compose up -d --build frontend

# Check TypeScript errors
cd frontend
npm run build:check
```

### Container Issues
```bash
# View all containers
docker ps -a

# Restart all services
docker compose restart

# Rebuild everything
docker compose up -d --build

# View resource usage
docker stats

# Remove all containers and volumes (nuclear option)
docker compose down -v
docker compose up -d --build
```

### Network/Connectivity Issues
```bash
# Test backend from host
curl http://localhost:3001/api/v1/health

# Test backend from frontend container
docker exec -it greenchainz-frontend curl http://backend:3001/api/v1/health

# Check Docker networks
docker network ls
docker network inspect green-sourcing-b2b-app_default
```

### Environment Variable Debugging
```bash
# Check backend environment variables
docker exec -it greenchainz-backend env | grep -E "(POSTGRES|JWT|GOOGLE)"

# Check frontend environment variables (build-time)
docker exec -it greenchainz-frontend env | grep VITE
```

## Key Files Reference Guide


| File | Purpose | Current State |
|------|---------|---------------|
| `docker-compose.yml` | Infrastructure definition, 3-service stack | Fully configured (db, backend, frontend) |
| `backend/index.js` | Express API entry point | ~1400 lines, full REST API with auth |
| `backend/db.js` | PostgreSQL connection pool | Environment-driven configuration |
| `backend/middleware/auth.js` | JWT auth + role-based access | Fully implemented |
| `backend/services/verificationScore.js` | Supplier trust scoring | Algorithm-based certification scoring |
| `backend/providers/baseProvider.js` | External data integration framework | Abstract class for data providers |
| `backend/eventLogger.js` | Immutable event logging | Blockchain-ready hash-chained events |
| `database-schemas/schema.sql` | Main database schema | ~610 lines with event sourcing |
| `frontend/src/main.tsx` | React app entry point | Router + AuthProvider setup |
| `frontend/src/lib/api.ts` | API client with JWT interceptor | Configured for localhost:3001 |
| `frontend/src/context/AuthContext.tsx` | Supabase auth integration | OAuth + session management |

1. ✅ ~~Add package.json to backend~~ - DONE
2. ✅ ~~Containerize backend~~ - DONE (Docker Compose with all services)
3. ✅ ~~Scaffold frontend~~ - DONE (Vite + React + TypeScript + Tailwind)
4. ✅ ~~Add database migrations~~ - DONE (migration scripts in database-schemas/migrations/)
5. ✅ ~~Implement authentication~~ - DONE (JWT + OAuth via Passport.js)
6. ✅ ~~Add API documentation~~ - DONE (OpenAPI 3.0 spec + Swagger UI)
7. 🔄 **Add testing framework** - IN PROGRESS
   - Add Jest/Vitest for unit tests
   - Add Playwright for E2E tests
   - Add test scripts to package.json files
8. 🔄 **Set up CI/CD** - PLANNED
   - GitHub Actions for automated testing
   - Automated deployment to staging/production
   - Docker image builds and registry pushes
9. 🔄 **Production deployment** - PLANNED
   - Configure for Vercel (frontend) + Railway/Render (backend)
   - Environment-specific configurations
   - SSL/TLS certificates
   - CDN configuration
10. 🔄 **Monitoring & Logging** - PLANNED
    - Error tracking (Sentry, LogRocket)
    - Performance monitoring
    - Database query optimization
    - API rate limiting


---

**Last Updated**: 2025-11-18  
**Repository**: [jnorvi5/green-sourcing-b2b-app](https://github.com/jnorvi5/green-sourcing-b2b-app)  
**Platform**: GreenChainz - Global Trust Layer for Sustainable Commerce

---

## Quick Links

- **Frontend Dev**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Database**: localhost:5432 (user/password/greenchainz_dev)
- **OpenAPI Spec**: `backend/openapi.yaml`
- **Environment Template**: `.env.example`
