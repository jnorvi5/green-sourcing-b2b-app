# Development Guidelines & Patterns

## Code Quality Standards

### TypeScript Usage
- **Strict Typing**: All files use TypeScript with strict type checking enabled
- **Interface Definitions**: Complex data structures defined as interfaces (e.g., `Product`, `RFQ`, `SupplierRecord`)
- **Type Guards**: Runtime type validation using libraries like `zod` for API boundaries
- **Generic Types**: Extensive use of generics for reusable components and functions
- **Null Safety**: Explicit handling of null/undefined values with optional chaining (`?.`)

### Code Structure Patterns
- **Functional Components**: React components use function declarations with hooks
- **Server Actions**: Next.js server actions marked with `'use server'` directive
- **Client Components**: Explicit `'use client'` directive for client-side functionality
- **Async/Await**: Consistent use of async/await over Promise chains
- **Error Boundaries**: Comprehensive error handling with try/catch blocks

### Naming Conventions
- **Files**: kebab-case for files (`certification-verification.ts`, `sync-mailerlite`)
- **Functions**: camelCase for functions (`fetchPendingCertifications`, `handleSearch`)
- **Constants**: UPPER_SNAKE_CASE for constants (`BATCH_SIZE`, `ACTIVE_DAYS_THRESHOLD`)
- **Interfaces**: PascalCase with descriptive names (`CertificationPendingSupplier`)
- **Components**: PascalCase for React components (`ArchitectDashboardInner`)

## Architectural Patterns

### API Route Structure
- **Route Handlers**: Export named functions (`GET`, `POST`) from route files
- **Request Validation**: Input validation using zod schemas at API boundaries
- **Error Responses**: Consistent error response format with NextResponse.json
- **Authentication**: Role-based access control with middleware checks
- **Rate Limiting**: Built-in protection for cron jobs and sensitive endpoints

### Database Interaction Patterns
- **Supabase Client**: Consistent use of `createClient()` from appropriate context (server/client)
- **Query Building**: Fluent API pattern for building complex queries
- **Batch Operations**: Processing large datasets in configurable batch sizes
- **Upsert Operations**: Using `upsert` with conflict resolution for data synchronization
- **RLS (Row Level Security)**: Database-level security with role-based access

### State Management
- **React Hooks**: useState, useEffect, useCallback for local state management
- **Custom Hooks**: Reusable logic extracted into custom hooks (`useAuth`)
- **Server State**: Server actions for data mutations and fetching
- **Loading States**: Explicit loading and error state management
- **Optimistic Updates**: Client-side optimistic updates with rollback capability

## Error Handling Standards

### Comprehensive Error Handling
- **Try-Catch Blocks**: All async operations wrapped in try-catch
- **Error Logging**: Structured logging with context information
- **User-Friendly Messages**: Error messages sanitized for end users
- **Fallback Behavior**: Graceful degradation when services are unavailable
- **Error Boundaries**: React error boundaries for component-level error handling

### API Error Patterns
```typescript
// Standard error response format
return NextResponse.json(
  { success: false, error: errorMessage },
  { status: 500 }
);

// Server action error handling
return { 
  success: false, 
  error: err instanceof Error ? err.message : 'Unknown error' 
};
```

## Performance Optimization

### Data Loading Strategies
- **Batch Processing**: Large datasets processed in configurable batches (100-1000 items)
- **Pagination**: Database queries use range() for pagination
- **Selective Loading**: Only fetch required fields with select() clauses
- **Caching**: Strategic use of caching for expensive operations
- **Rate Limiting**: Built-in delays for external API calls (100ms between requests)

### Component Optimization
- **Suspense Boundaries**: Loading states handled with React Suspense
- **Memoization**: useCallback for expensive function references
- **Lazy Loading**: Dynamic imports for large components
- **Image Optimization**: Next.js Image component with multiple formats
- **Bundle Splitting**: Code splitting at route level

## Security Practices

### Authentication & Authorization
- **Role-Based Access**: Consistent role checking (`checkAdminRole()`)
- **JWT Validation**: Server-side token validation for protected routes
- **Session Management**: Supabase Auth integration with proper session handling
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Environment Variables**: Sensitive data stored in environment variables

### Data Validation
- **Input Sanitization**: All user inputs validated and sanitized
- **Schema Validation**: Zod schemas for runtime type checking
- **SQL Injection Prevention**: Parameterized queries through Supabase client
- **XSS Prevention**: Proper escaping of user-generated content
- **File Upload Security**: Validation of file types and sizes

## Testing Patterns

### Test Structure
- **Unit Tests**: Jest for business logic testing
- **Integration Tests**: Playwright for end-to-end testing
- **Mock Data**: Comprehensive mock data for development and testing
- **Test Mode**: Built-in test mode with localStorage flags
- **Error Simulation**: Deliberate error injection for testing error paths

### Development Workflow
- **Hot Reloading**: Next.js development server with fast refresh
- **Type Checking**: Continuous TypeScript compilation
- **Linting**: ESLint with Next.js configuration
- **Link Checking**: Automated documentation link validation
- **Build Verification**: Production build testing before deployment

## External Integration Patterns

### API Integration Standards
- **Timeout Handling**: 5-second timeouts for external API calls
- **Retry Logic**: Exponential backoff for failed requests
- **Rate Limiting**: Respectful API usage with delays
- **Error Mapping**: External errors mapped to internal error types
- **Circuit Breakers**: Fallback behavior when external services fail

### Email Service Integration
- **Template System**: Reusable email templates with parameterization
- **Environment Awareness**: Development mode logging vs production sending
- **Error Handling**: Email failures don't break core functionality
- **Batch Processing**: Bulk email operations for efficiency
- **Tracking**: Email delivery status tracking and logging

## Configuration Management

### Environment Configuration
- **Multi-Environment**: Development, staging, and production configurations
- **Feature Flags**: Environment-based feature toggling
- **Secret Management**: AWS Secrets Manager for production secrets
- **Configuration Validation**: Runtime validation of required environment variables
- **Fallback Values**: Sensible defaults for optional configuration

### Build Configuration
- **Next.js Config**: Comprehensive next.config.js with security headers
- **TypeScript Config**: Strict TypeScript configuration
- **ESLint Config**: Consistent code style enforcement
- **Webpack Customization**: Custom webpack configuration for specific needs
- **Output Optimization**: Standalone output for containerized deployments