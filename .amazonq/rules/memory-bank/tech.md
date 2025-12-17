# Technology Stack & Development

## Core Technologies

### Frontend Framework
- **Next.js 14**: React framework with App Router for modern routing
- **React 18**: Component library with hooks and server components
- **TypeScript 5.3**: Static typing for enhanced developer experience
- **Tailwind CSS 3.4**: Utility-first CSS framework for styling

### Backend & Database
- **Next.js API Routes**: Server-side API endpoints
- **Supabase**: PostgreSQL database with real-time capabilities
- **Supabase Auth**: Authentication and user management
- **PostgreSQL**: Primary database with JSONB for flexible data

### Build System & Tooling
- **Next.js Build System**: Optimized production builds
- **ESLint**: Code linting with Next.js configuration
- **TypeScript Compiler**: Type checking and compilation
- **PostCSS**: CSS processing with Tailwind integration

## Programming Languages & Versions

### Primary Languages
- **TypeScript**: 5.3.3 (primary development language)
- **JavaScript**: ES2022+ (legacy components and configurations)
- **SQL**: PostgreSQL dialect for database operations
- **CSS**: Modern CSS with Tailwind utilities

### Runtime Environments
- **Node.js**: 18+ (server-side runtime)
- **React**: 18.2.0 (client-side runtime)
- **Next.js**: 14.2.35 (full-stack framework)

## Key Dependencies

### UI & Styling
- **@heroicons/react**: 2.2.0 - Icon library
- **@radix-ui/react-***: Component primitives for accessible UI
- **framer-motion**: 12.23.26 - Animation library
- **tailwind-merge**: 3.4.0 - Tailwind class merging utility
- **class-variance-authority**: 0.7.1 - Component variant management

### Database & Authentication
- **@supabase/supabase-js**: 2.39.8 - Supabase client
- **@supabase/ssr**: 0.5.2 - Server-side rendering support
- **@supabase/auth-helpers-nextjs**: 0.15.0 - Next.js auth integration

### Payment & Business Logic
- **stripe**: 14.9.0 - Payment processing
- **@stripe/stripe-js**: 8.5.3 - Client-side Stripe integration
- **@stripe/react-stripe-js**: 5.4.1 - React Stripe components

### Communication & Analytics
- **resend**: 6.6.0 - Email delivery service
- **posthog-js**: 1.306.1 - Client-side analytics
- **posthog-node**: 5.17.2 - Server-side analytics
- **react-use-intercom**: 5.5.0 - Customer support integration

### Development & Testing
- **jest**: 30.2.0 - Testing framework
- **@playwright/test**: 1.57.0 - End-to-end testing
- **@types/***: TypeScript definitions for all major dependencies

## Development Commands

### Core Development
```bash
npm run dev          # Start development server on port 3001
npm run build        # Build for production
npm start           # Start production server on port 3001
npm run lint        # Run ESLint code linting
npm run type-check  # TypeScript type checking without emit
```

### Testing & Quality
```bash
npm test            # Run Jest unit tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run check:links # Check documentation links with lychee
```

### Deployment
```bash
npm run deploy:vercel   # Deploy to Vercel production
npm run deploy:preview  # Deploy to Vercel preview
npm run vercel-build   # Vercel-specific build command
```

## Build Configuration

### Next.js Configuration
- **Output**: Standalone for containerized deployments
- **Image Optimization**: AVIF and WebP formats with remote patterns
- **Webpack Customization**: Supabase ESM fixes and external dependencies
- **Security Headers**: CSP, HSTS, XSS protection, frame options
- **Compression**: Gzip compression enabled
- **Instrumentation**: Sentry integration for error monitoring

### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **Module Resolution**: Node.js style with path mapping
- **Target**: ES2022 for modern JavaScript features
- **JSX**: React JSX transformation

### ESLint Configuration
- **Next.js Rules**: Built-in Next.js linting rules
- **TypeScript Rules**: TypeScript-specific linting
- **Build Ignoring**: Disabled during builds for MVP speed

## Environment & Deployment

### Environment Variables
- **Database**: Supabase connection strings and API keys
- **Authentication**: OAuth provider credentials
- **Payment**: Stripe API keys for payment processing
- **Analytics**: PostHog and Sentry configuration
- **Email**: Resend API keys for transactional emails

### Deployment Targets
- **Primary**: Vercel with automatic GitHub deployments
- **Staging**: Vercel preview deployments for testing
- **Local**: Development server with hot reloading
- **Docker**: Standalone output for containerized deployments

### Performance Optimizations
- **Package Imports**: Optimized imports for lucide-react, framer-motion
- **Server Components**: External packages configuration for Supabase
- **Image Optimization**: Multiple format support with remote patterns
- **Bundle Analysis**: Webpack optimizations for reduced bundle size