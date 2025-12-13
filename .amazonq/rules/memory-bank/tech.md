# GreenChainz - Technology Stack

## Programming Languages & Versions

### Frontend
- **TypeScript**: ~5.9.3 (strict mode enabled)
- **JavaScript**: ES2022 target
- **React**: 19.2.0 with JSX support
- **Node.js**: Latest LTS

### Backend
- **Node.js**: Latest LTS
- **JavaScript**: CommonJS modules (type: "commonjs")

## Build Systems & Tools

### Frontend Build
- **Vite**: 7.1.7 (build tool and dev server)
- **PostCSS**: 8.5.6 (CSS processing)
- **Tailwind CSS**: 3.4.18 (utility-first styling)
- **ESLint**: 9.36.0 (code linting)
- **TypeScript Compiler**: 5.9.3

### Frontend Development Commands
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run build:check  # Type check + build
npm run lint         # Run ESLint
npm run preview      # Preview production build
npm run postbuild    # Generate sitemap after build
```

### Backend
- **Express.js**: 4.18.2 (web framework)
- **Node.js**: CommonJS runtime
- **Swagger UI**: 5.0.1 (API documentation)

### Backend Development Commands
```bash
npm start            # Start production server
npm run dev          # Start development server
npm run seed         # Run database seed script
```

## Core Dependencies

### Frontend Dependencies
- **React Router**: 6.30.1 (client-side routing)
- **Zustand**: 5.0.8 (state management)
- **Axios**: 1.13.1 (HTTP client)
- **Supabase JS SDK**: 2.80.0 (database client)
- **Tailwind CSS**: 3.4.18 (styling)
- **Radix UI**: Dialog component (accessible UI)
- **Heroicons**: 2.2.0 (icon library)
- **Lucide React**: 0.554.0 (icon library)
- **React GA4**: 2.1.0 (analytics)
- **React Helmet Async**: 2.0.5 (document head management)
- **Sonner**: 2.0.7 (toast notifications)
- **Sitemap**: 8.0.0 (sitemap generation)
- **Azure Maps Control**: 3.4.0 (mapping)

### Backend Dependencies
- **Express.js**: 4.18.2 (web framework)
- **PostgreSQL Client**: pg 8.11.3 (database driver)
- **Passport.js**: 0.7.0 (authentication)
  - passport-google-oauth20: 2.0.0
  - passport-github2: 0.1.12
  - passport-linkedin-oauth2: 2.0.0
  - passport-microsoft: 1.0.0
- **Express Session**: 1.18.1 (session management)
- **JWT**: jsonwebtoken 9.0.2 (token signing)
- **bcrypt**: 6.0.0 (password hashing)
- **AWS SDK**: 
  - @aws-sdk/client-s3: 3.937.0
  - @aws-sdk/s3-request-presigner: 3.937.0
- **Nodemailer**: 6.9.7 (email sending)
- **Multer**: 2.0.2 (file upload handling)
- **Cheerio**: 1.0.0 (HTML parsing)
- **CSV Parser**: 3.0.0 (CSV data parsing)
- **CORS**: 2.8.5 (cross-origin requests)
- **dotenv**: 16.4.5 (environment variables)
- **YAML**: 2.5.1 (YAML parsing)

### Shared Dependencies
- **Supabase JS SDK**: 2.81.1 (database/auth)
- **AWS SDK S3**: 3.937.0 (file storage)
- **React Email**: 1.0.1 (email templates)
- **Resend**: 6.4.2 (email service)
- **Vercel Speed Insights**: 1.2.0 (performance monitoring)

## Database & Infrastructure

### Database
- **PostgreSQL**: Via Supabase managed service
- **Connection Pooling**: pg library with pool configuration
- **Migrations**: Versioned SQL files in database-schemas/migrations/

### File Storage
- **AWS S3**: Object storage for product images and documents
- **Presigned URLs**: Secure temporary upload/download links

### Email Service
- **Resend**: Primary email delivery service
- **Nodemailer**: Fallback email service
- **React Email**: Component-based email templates

### Authentication
- **Supabase Auth**: User authentication and session management
- **OAuth 2.0 Providers**: Google, GitHub, LinkedIn, Microsoft
- **JWT Tokens**: 7-day expiration for API authentication

## Development Environment

### Code Quality
- **ESLint**: 9.36.0 with TypeScript support
- **TypeScript**: Strict mode with noUnusedLocals and noUnusedParameters
- **Prettier**: Code formatting (integrated with ESLint)

### Type Checking
- **TypeScript**: Full type safety for frontend
- **JSDoc**: Optional type hints for backend JavaScript

### Testing & Validation
- **Test Scripts**: backend/scripts/test-*.js for service validation
- **Seed Data**: database-schemas/seed-*.sql for test data

## Deployment & Hosting

### Frontend Hosting
- **Vercel**: Automatic deployments from GitHub
- **Build Output**: Static files from Vite build
- **Environment**: Next.js/React compatible

### Backend Hosting
- **Docker**: Containerized deployment
- **Environment Variables**: .env configuration
- **Health Checks**: Application monitoring endpoints

### Infrastructure as Code
- **Terraform**: AWS resource provisioning
- **CloudFormation**: S3 bucket configuration (aws/s3-public-bucket.yaml)

### CDN & Security
- **Cloudflare**: DDoS protection, WAF, SSL/TLS, global CDN
- **CORS**: Configured for specific origins

## Configuration Files

### Frontend
- **tsconfig.json**: TypeScript configuration
- **tsconfig.app.json**: App-specific TypeScript settings
- **vite.config.ts**: Vite build configuration
- **tailwind.config.js**: Tailwind CSS customization
- **postcss.config.js**: PostCSS plugins
- **eslint.config.js**: ESLint rules
- **.env.example**: Environment variable template

### Backend
- **package.json**: Dependencies and scripts
- **.env.example**: Environment variable template
- **openapi.yaml**: API documentation
- **Dockerfile**: Container configuration

### Database
- **database-schemas/schema.sql**: Main schema
- **database-schemas/mvp_schema.sql**: MVP features
- **database-schemas/performance-indexes.sql**: Query optimization
- **database-schemas/migrations/**: Versioned migrations

## Performance Optimization

### Frontend
- **Code Splitting**: Route-based splitting with React Router
- **Lazy Loading**: Dynamic imports for components
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Analysis**: Vite build optimization

### Backend
- **Connection Pooling**: PostgreSQL pool reuse
- **Query Optimization**: Indexed columns and efficient JOINs
- **Caching**: Computed scores and frequently accessed data
- **Async Processing**: AWS Lambda for background tasks

## Monitoring & Analytics

### Frontend
- **React GA4**: Google Analytics integration
- **Vercel Speed Insights**: Performance monitoring
- **Error Tracking**: Client-side error logging

### Backend
- **Error Monitoring**: errorMonitoring.js service
- **Event Logging**: eventLogger.js with SHA-256 hashing
- **API Documentation**: Swagger UI for endpoint testing

## Development Workflow

### Version Control
- **Git**: GitHub repository
- **CI/CD**: Vercel automatic deployments
- **Branch Strategy**: Feature branches with PR reviews

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev

# Database
# Use Supabase dashboard or psql CLI
```

### Environment Setup
- Copy `.env.example` to `.env`
- Configure OAuth credentials
- Set AWS S3 credentials
- Configure Supabase connection string
- Set email service credentials
