# Technology Stack & Development Setup

## Programming Languages & Versions

### Frontend
- **TypeScript**: ~5.9.3 (primary language)
- **JavaScript**: ES2022+ (React components)
- **CSS**: Tailwind CSS 3.4.0 + custom modules
- **HTML**: JSX/TSX templates

### Backend
- **JavaScript**: Node.js (CommonJS modules)
- **SQL**: PostgreSQL (Supabase)
- **YAML**: OpenAPI specification

### Runtime Versions
- **Node.js**: Latest LTS (inferred from package.json)
- **React**: 19.1.1+ (latest stable)
- **TypeScript**: 5.9.3

## Build Systems & Dependencies

### Frontend Build System
- **Bundler**: Vite 7.1.7
- **Compiler**: TypeScript + ESBuild
- **CSS Processing**: PostCSS + Autoprefixer
- **Linting**: ESLint 9.36.0 + TypeScript ESLint

#### Key Dependencies:
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^6.30.1",
  "@supabase/supabase-js": "^2.80.0",
  "axios": "^1.13.1",
  "@heroicons/react": "^2.2.0",
  "tailwindcss": "^3.4.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "passport": "^0.7.0",
  "bcrypt": "^6.0.0",
  "jsonwebtoken": "^9.0.2",
  "nodemailer": "^6.9.7",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5"
}
```

### Email System
```json
{
  "@react-email/components": "^1.0.1",
  "@react-email/render": "^2.0.0",
  "@react-email/tailwind": "^2.0.1",
  "resend": "^6.4.2"
}
```

## Development Commands

### Frontend Development
```bash
# Development server
npm run dev              # Start Vite dev server

# Building
npm run build           # Production build
npm run build:check     # TypeScript check + build

# Code Quality
npm run lint            # ESLint check
npm run preview         # Preview production build
```

### Backend Development
```bash
# Server
npm start               # Production server
npm run dev             # Development server

# Database
npm run seed            # Seed database with sample data
```

### Root Level Commands
```bash
# Install all dependencies
npm install

# Docker deployment
docker-compose up       # Full stack deployment
```

## Configuration Files

### Frontend Configuration
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS customization
- `tsconfig.json` - TypeScript compiler options
- `eslint.config.js` - ESLint rules and plugins
- `postcss.config.js` - PostCSS processing
- `vercel.json` - Vercel deployment settings

### Backend Configuration
- `package.json` - Node.js dependencies and scripts
- `Dockerfile` - Container configuration
- `openapi.yaml` - API documentation specification
- `.dockerignore` - Docker build exclusions

### Database Configuration
- `supabase-setup.sql` - Supabase initialization
- `database-schemas/schema.sql` - Complete database schema
- `database-schemas/migrations/` - Version-controlled schema changes

### Environment Configuration
- `.env.example` - Environment variable template
- `.env` - Local environment variables (gitignored)
- `docker-compose.yml` - Multi-container orchestration

## Development Tools & Integrations

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (via ESLint integration)

### Database Tools
- **Supabase CLI**: Database management and migrations
- **PostgreSQL**: Direct SQL access for complex queries

### API Development
- **Swagger UI**: Interactive API documentation
- **Postman/Insomnia**: API testing (OpenAPI import)

### Authentication Providers
- **Google OAuth 2.0**: passport-google-oauth20
- **GitHub OAuth**: passport-github2
- **LinkedIn OAuth**: passport-linkedin-oauth2
- **Microsoft OAuth**: passport-microsoft

### External Integrations
- **Supabase**: Database and authentication
- **Resend**: Email delivery service
- **Vercel**: Frontend deployment
- **Cloudflare**: CDN and security
- **Docker**: Containerization