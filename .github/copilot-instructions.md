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

### Testing Strategy (Not Yet Implemented)
When adding tests:
- Unit tests: `jest` or `mocha` + `chai`
- API integration tests: `supertest`
- E2E tests: `cypress` or `playwright`
- Place tests alongside source files or in `__tests__/` directories

## Key Files Reference Guide

| File | Purpose | Current State |
|------|---------|---------------|
| `docker-compose.yml` | Infrastructure definition, DB config | Defines PostgreSQL only |
| `backend/index.js` | Express API entry point | Minimal "Hello World" server |
| `backend/README.md` | Backend documentation | Placeholder text |
| `frontend/README.md` | Frontend documentation | Placeholder text |
| `database-schemas/README.md` | Schema documentation | Placeholder text |
| `README.md` | Project overview | Brief description of platform |

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

## Quick Validation Checklist

### After Backend Changes
1. ✅ Database is running: `docker ps | grep greenchainz_db`
2. ✅ Backend starts without errors: `node backend/index.js`
3. ✅ Root endpoint responds: `curl http://localhost:3001/`
4. ✅ New endpoints return expected responses
5. ✅ No sensitive data in code (use environment variables)

### After Database Changes
1. ✅ Migration scripts are in `database-schemas/`
2. ✅ Can connect via psql: `docker exec -it greenchainz_db psql -U user -d greenchainz_dev`
3. ✅ Tables created successfully: `\dt` in psql
4. ✅ Sample data can be inserted and queried

### Before Committing
1. ✅ No `.env` files in commit
2. ✅ No `node_modules/` in commit
3. ✅ README updated if adding new features
4. ✅ This file updated if changing architecture or workflows

## Getting Help and Debugging

### Database Issues
```bash
# Check database logs
docker logs greenchainz_db

# Check if database is accepting connections
docker exec greenchainz_db pg_isready -U user

# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d
```

### Backend Issues
```bash
# Check what's using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Enable debug logging
DEBUG=express:* node backend/index.js
```

### Container Issues
```bash
# View all containers
docker ps -a

# Restart specific service
docker compose restart db

# View resource usage
docker stats
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

---

**Last Updated**: 2025-11-18  
**Repository**: [jnorvi5/green-sourcing-b2b-app](https://github.com/jnorvi5/green-sourcing-b2b-app)  
**Platform**: GreenChainz - Global Trust Layer for Sustainable Commerce
