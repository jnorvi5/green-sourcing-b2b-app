# Copilot Instructions for GreenChainz B2B Platform

This repository contains the GreenChainz B2B platform - a verified sustainable sourcing platform. The stack uses a Next.js (App Router) frontend (deployed on Vercel) and a Node.js/Express backend (migrating to Azure).

## Architecture and Source of Truth

### Primary Working Tree

- **`app/` (Root)** - Next.js Frontend
  - **Framework**: Next.js 15+ (App Router)
  - **Styling**: Tailwind CSS
  - **Auth**: Supabase Auth
  - **Configuration**: `next.config.js`, `tailwind.config.js` in root.

- **`backend/`** - Node.js + Express API server
  - **Entry point**: `backend/index.js`
  - **Tech stack**: Express, PostgreSQL (via `pg`), Azure Services.
  - **Key dependencies**: `pg`, `passport`, `azure` SDKs.

- **`database-schemas/`** - PostgreSQL schema definitions
  - **Files**: `schema.sql`, `migrations/`

### Azure Migration
We are migrating to Azure.
- **Frontend**: Next.js (Vercel or Azure Static Web Apps)
- **Backend**: Azure App Service (Node.js)
- **Database**: Azure Database for PostgreSQL

## Developer Workflows

### Frontend (Next.js)
```bash
npm install
npm run dev
# Runs Next.js on localhost:3000
```

### Backend (Express)
```bash
cd backend
npm install
npm start
# Runs Express on localhost:3001 (or PORT env)
```

## Security & Secrets
- **NEVER** commit secrets.
- Use `.env` for local development.
- In Production (Azure), use Key Vault or App Service Configuration.
- `backend/config/validateEnv.js` enforces strict secret checking in production.

## Clean Code
- Remove unused files.
- Keep dependencies updated.
- Use `npm` (Root) and `npm` (Backend). Avoid mixed package managers.
