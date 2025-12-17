# Project Structure & Architecture

## Directory Organization

### Core Application (`/app`)
Next.js 14 App Router structure with role-based routing:
- **Pages**: Route-based pages using App Router conventions
- **API Routes**: RESTful endpoints in `/app/api/` for all backend functionality
- **Actions**: Server actions for form handling and data mutations
- **Components**: Page-specific UI components

### Shared Components (`/components`)
Reusable UI components organized by purpose:
- **UI Components**: Base components (buttons, cards, inputs) using Radix UI
- **Layout Components**: Navigation, headers, footers
- **Home Components**: Landing page sections and marketing components
- **Chat Components**: AI assistant and chat functionality

### Business Logic (`/lib`)
Core business logic and integrations:
- **Authentication**: JWT, role verification, corporate domain validation
- **Integrations**: Autodesk, EPD International, FSC, EC3 connectors
- **Services**: Email, analytics, verification, export functionality
- **Supabase**: Database clients and middleware
- **Stripe**: Payment processing and subscription management
- **Utils**: Shared utilities and formatters

### Database & Infrastructure
- **Supabase**: PostgreSQL database with migrations in `/supabase/migrations/`
- **Database Schemas**: SQL schemas and seed data in `/database-schemas/`
- **AWS Infrastructure**: CloudFormation templates and Lambda functions
- **Azure Functions**: Serverless functions for specific integrations
- **Terraform**: Infrastructure as Code for multi-cloud deployment

### Data & Content
- **Public Assets**: Static files, logos, mock data in `/public/`
- **Email Templates**: Transactional email components in `/emails/`
- **Marketing**: Landing pages and content in `/cloudflare-landing/`
- **Documentation**: Comprehensive docs in `/docs/` covering all aspects

## Architectural Patterns

### API-First Design
- All platform functions exposed via secure, documented REST APIs
- Consistent error handling and response formats
- Authentication middleware for protected endpoints
- Rate limiting and security headers

### Headless Commerce Architecture
- Decoupled frontend (presentation) from backend (business logic)
- Multi-channel flexibility (web, mobile, API integrations)
- Server-side rendering with Next.js for SEO and performance
- Client-side state management with React hooks

### Hybrid Database Strategy
- **SQL (Supabase PostgreSQL)**: Transactional data (users, orders, RFQs)
- **JSONB Fields**: Flexible sustainability data and product specifications
- **Row Level Security**: Fine-grained access control
- **Real-time Subscriptions**: Live updates for dashboards and notifications

### Role-Based Access Control (RBAC)
- **Architect Role**: Project management, RFQ creation, supplier discovery
- **Supplier Role**: Product management, quote submission, analytics
- **Admin Role**: Platform management, user approval, system monitoring
- **Middleware**: Route protection and role verification

## Core Components & Relationships

### Authentication Flow
1. Multi-provider OAuth (Google, LinkedIn, GitHub) + email/password
2. JWT token generation and validation
3. Role assignment and profile creation
4. Automatic routing to appropriate dashboard

### RFQ (Request for Quote) System
1. **Creation**: Architects create RFQs with project requirements
2. **Matching**: Automated supplier matching based on capabilities
3. **Notification**: Email alerts to qualified suppliers
4. **Response**: Suppliers submit quotes with attachments
5. **Comparison**: Side-by-side quote analysis and selection

### Sustainability Data Pipeline
1. **Ingestion**: API integrations with EPD providers
2. **Validation**: Data quality checks and verification
3. **Storage**: Structured storage with provenance tracking
4. **Presentation**: Standardized display across product catalogs
5. **Export**: PDF/CSV generation for compliance reporting

### Payment & Subscription Flow
1. **Stripe Integration**: Secure payment processing
2. **Subscription Management**: Tiered pricing plans
3. **Success Fees**: Transaction-based revenue on completed RFQs
4. **Invoice Generation**: Automated billing and receipts

## Integration Points

### External Services
- **Supabase**: Database, authentication, real-time subscriptions
- **Stripe**: Payment processing and subscription management
- **Resend**: Transactional email delivery
- **PostHog**: Analytics and feature flags
- **Sentry**: Error monitoring and performance tracking
- **Intercom**: Customer support and messaging

### Data Providers
- **EPD International**: Environmental Product Declarations
- **Building Transparency**: EC3 carbon database
- **FSC**: Forest Stewardship Council certifications
- **Autodesk**: Construction data and BIM integration
- **WAP Sustainability**: Sustainability metrics and reporting

### Deployment & Hosting
- **Vercel**: Primary hosting with automatic deployments
- **AWS**: Lambda functions, S3 storage, CloudFront CDN
- **Azure**: AI services and additional compute resources
- **Cloudflare**: DNS, security, and performance optimization