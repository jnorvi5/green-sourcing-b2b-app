# GreenChainz - Development Guidelines & Patterns

## Code Quality Standards

### File Organization & Structure
- **Frontend**: Next.js App Router with TypeScript, component-based architecture
  - `app/` for route components and API routes
  - `components/` for reusable UI components
  - `lib/` for utilities, Supabase client, and service integrations
  - `app/actions/` for Server Actions
  - `app/api/` for API routes
- **Backend**: Legacy Express.js (being migrated to Next.js API routes)
  - `services/` for business logic and external integrations
  - `middleware/` for authentication and request processing
  - `providers/` for data provider integrations with mock implementations
  - `config/` for configuration files (Passport OAuth strategies)

### Naming Conventions
- **Files**: PascalCase for React components (`AdminDashboard.tsx`, `Navbar.tsx`)
- **Variables**: camelCase for JavaScript/TypeScript (`isMenuOpen`, `loadDashboardData`)
- **Database**: snake_case for SQL columns (`total_users`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE for environment variables (`NEXT_PUBLIC_INTERCOM_APP_ID`)
- **Functions**: Descriptive camelCase (`runAutomation`, `loadDashboardData`)
- **API Routes**: kebab-case for route segments (`/api/admin/stats`, `/api/health`)

### Import Organization
- External dependencies first (React, Next.js, etc.)
- Internal modules second (relative imports)
- Type imports separated when using TypeScript
```typescript
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
```

### Environment Variables
- Prefix public variables with `NEXT_PUBLIC_` for frontend access
- Store sensitive keys in `.env.local` (never committed)
- Use `.env.example` as template for required variables
- Access in API routes: `process.env['VARIABLE_NAME']`
- Access in components: `process.env.NEXT_PUBLIC_VARIABLE_NAME`

## Architectural Patterns

### Next.js App Router Patterns
- **Server Components**: Default for data fetching and server-side logic
- **Client Components**: Use `'use client'` directive for interactivity
- **Server Actions**: Use `'use server'` for form submissions and mutations
- **API Routes**: `app/api/[route]/route.ts` for REST endpoints
- **Dynamic Routes**: `app/[segment]/page.tsx` for parameterized pages

### API Design Patterns
- **RESTful Endpoints**: Consistent URL structure (`/api/admin/stats`, `/api/health`)
- **Error Handling**: Standardized error responses with status codes
```typescript
return NextResponse.json(
  { status: 'unhealthy', error: 'Health check failed' },
  { status: 503 }
);
```
- **Health Checks**: Service status endpoints for monitoring
- **Validation**: Input validation at endpoint level with descriptive error messages

### Frontend State Management
- **React Hooks**: `useState` and `useEffect` for component state
- **Server State**: Supabase client for database queries
- **Form Handling**: Controlled components with validation
- **Loading States**: Explicit loading indicators and error boundaries

### Component Patterns
- **Functional Components**: All components are functional with hooks
- **Props Interface**: Define TypeScript interfaces for component props
- **Composition**: Break complex components into smaller reusable pieces
- **Styling**: Tailwind CSS utility classes with dark mode support

```typescript
interface DashboardStats {
  totalUsers: number;
  totalSuppliers: number;
  totalBuyers: number;
  totalRFQs: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // ...
}
```

### Authentication Flow
- **OAuth Integration**: Multiple providers (Google, GitHub, LinkedIn, Microsoft)
- **Supabase Auth**: User authentication and session management
- **Protected Routes**: Middleware for role-based access control
- **JWT Tokens**: Secure token-based API authentication

### Data Fetching Patterns
- **Server Components**: Direct database queries in Server Components
- **API Routes**: Fetch data through API endpoints from Client Components
- **Error Handling**: Try-catch blocks with user-friendly error messages
```typescript
try {
  const response = await fetch('/api/admin/stats');
  if (response.ok) {
    const data = await response.json();
    setStats(data);
  }
} catch (error) {
  console.error('Error loading dashboard:', error);
}
```

## Security & Authentication

### Authentication Flow
- **OAuth Integration**: Multiple providers via Supabase Auth
- **Session Management**: Secure cookies in production environment
- **Role-based Access**: `Buyer`, `Supplier`, `Admin` roles with middleware enforcement
- **Password Security**: bcrypt hashing with salt rounds

### Data Protection
- **Input Sanitization**: Parameterized queries and input validation
- **CORS Configuration**: Explicit origin allowlist
- **Environment Variables**: Sensitive data in `.env.local` files
- **API Security**: JWT token validation for protected endpoints

## Error Handling & Monitoring

### Backend Error Patterns
```typescript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    throw new Error('API request failed');
  }
  const data = await response.json();
  return { success: true, data };
} catch (error) {
  console.error('Operation error:', error);
  return { success: false, error: 'Operation failed' };
}
```

### Frontend Error Patterns
- **Error Boundaries**: React error boundaries for component error catching
- **API Error Handling**: Consistent error response handling with user feedback
- **Loading States**: Proper loading and error state management
- **User Feedback**: Toast notifications and alert dialogs for user actions

### Health Monitoring
- **Health Check Endpoint**: `/api/health` for service status
- **Service Status**: Database, email, storage, and API connectivity checks
- **Environment Info**: Version and environment details in health response

## UI/UX Patterns

### Component Design
- **Tailwind CSS**: Utility-first styling with consistent design tokens
- **Responsive Design**: Mobile-first approach with breakpoint considerations
- **Dark Theme**: Consistent dark theme implementation (`bg-slate-950`, `text-white`)
- **Interactive States**: Hover effects and transition animations

### Form Patterns
- **Controlled Components**: React controlled inputs with validation
- **Dynamic Forms**: Add/remove functionality for complex forms
- **Validation Feedback**: Real-time validation with error messaging
- **Accessibility**: Proper labels and ARIA attributes

### Data Display
- **Loading States**: Skeleton screens and loading indicators
- **Empty States**: Meaningful empty state messages
- **Pagination**: Efficient data pagination for large datasets
- **Filtering**: Client and server-side filtering capabilities

### Navigation Patterns
- **Next.js Link**: Use `<Link>` component for client-side navigation
- **Dynamic Routes**: Parameterized routes with `[segment]` syntax
- **Tab Navigation**: Controlled tab state with button elements
- **Mobile Menu**: Responsive hamburger menu with state management

## Performance Optimization

### Frontend Optimization
- **Image Optimization**: Use Next.js `<Image>` component for automatic optimization
- **Code Splitting**: Route-based code splitting with Next.js
- **Lazy Loading**: Dynamic imports for large components
- **Memoization**: React.memo and useMemo for expensive operations

### Database Optimization
- **Query Efficiency**: Minimal data fetching with specific column selection
- **Connection Pooling**: Reuse database connections
- **Caching**: Computed scores and frequently accessed data
- **Indexing**: Proper indexes on frequently queried columns

## Testing & Quality Assurance

### Code Quality Tools
- **ESLint**: JavaScript/TypeScript linting with consistent rules
- **TypeScript**: Static type checking for frontend code
- **Prettier**: Code formatting (integrated with ESLint)

### API Documentation
- **OpenAPI Specification**: Complete API documentation with Swagger UI
- **Interactive Documentation**: Live API testing through Swagger interface
- **Version Control**: API versioning strategy (`/api/v1/`)

## Deployment & DevOps

### Containerization
- **Docker**: Containerized backend with multi-stage builds
- **Environment Configuration**: Environment-specific configurations
- **Health Checks**: Application health monitoring endpoints

### CI/CD Pipeline
- **GitHub Integration**: Version control with automated deployments
- **Vercel Deployment**: Frontend deployment with automatic builds
- **Database Migrations**: Versioned schema changes with rollback capability

## Email & Notification System

### Transactional Emails
- **React Email**: Component-based email templates
- **Resend**: Email delivery service
- **Template System**: Reusable email components and layouts
- **Notification Logging**: Complete audit trail of sent notifications

## Data Provider Integration

### Integration Architecture
- **Modular Providers**: Separate modules for each data source (FSC, B-Corp, EC3)
- **Standardized Interface**: Common interface for all provider integrations
- **Mock Development**: Mock providers for development and testing
- **Verification Pipeline**: Automated verification score computation

### Sustainability Data Handling
- **EPD Integration**: Environmental Product Declaration processing
- **Certification Tracking**: Multi-source certification aggregation
- **Carbon Footprint**: Standardized carbon metrics calculation
- **Compliance Mapping**: ISO standards alignment and reporting

## Common Code Idioms

### Conditional Rendering
```typescript
{isMenuOpen ? 'block' : 'hidden'}
{activeTab === 'overview' && <OverviewTab />}
```

### Array Mapping
```typescript
{automations.map((auto) => (
  <div key={auto.id} className="...">
    {auto.name}
  </div>
))}
```

### State Management
```typescript
const [activeTab, setActiveTab] = useState('overview');
const [loading, setLoading] = useState(true);
```

### Event Handling
```typescript
onClick={() => setIsMenuOpen(!isMenuOpen)}
onClick={() => onRun(auto.id)}
```

### Async Operations
```typescript
useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    const response = await fetch('/api/admin/stats');
    if (response.ok) {
      const data = await response.json();
      setStats(data);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

### Git Workflow
- Feature branches for new features
- Pull requests for code review
- Commit messages in present tense
- Squash commits before merging

### Environment Setup
- Copy `.env.example` to `.env.local`
- Configure OAuth credentials
- Set Supabase connection string
- Configure email service credentials
- Set AWS S3 credentials if needed
