# Development Guidelines & Patterns

## Code Quality Standards

### File Organization & Structure
- **Backend**: CommonJS modules with clear separation of concerns
  - `services/` for business logic and external integrations
  - `middleware/` for authentication and request processing
  - `providers/` for data provider integrations with mock implementations
  - `config/` for configuration files (Passport OAuth strategies)
- **Frontend**: ES modules with TypeScript, component-based architecture
  - `pages/` for route components with clear naming (e.g., `AdminConsole.tsx`)
  - `components/` for reusable UI components
  - `lib/` for API utilities and external service clients
  - `types/` for TypeScript type definitions

### Naming Conventions
- **Files**: PascalCase for React components (`AdminConsole.tsx`, `SupplierProductList.tsx`)
- **Variables**: camelCase for JavaScript/TypeScript (`activeTab`, `onboardingQueue`)
- **Database**: snake_case for SQL columns (`user_id`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE for environment variables and constants
- **Functions**: Descriptive camelCase (`logProductEvent`, `generateEventHash`)

### Import Organization
- External dependencies first (React, Express, etc.)
- Internal modules second (relative imports)
- Type imports separated when using TypeScript
```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
```

## Architectural Patterns

### API Design Patterns
- **RESTful Endpoints**: Consistent URL structure (`/api/v1/suppliers/:id/certifications`)
- **Error Handling**: Standardized error responses with status codes and messages
- **Authentication**: JWT-based with middleware pattern (`authenticateToken`, `authorizeRoles`)
- **Validation**: Input validation at endpoint level with descriptive error messages

### Database Interaction Patterns
- **Connection Pooling**: PostgreSQL pool for connection management
- **Parameterized Queries**: Always use `$1, $2` placeholders to prevent SQL injection
- **Transaction Management**: Explicit transaction handling for multi-step operations
- **Event Sourcing**: Immutable event logging with hash chains for audit trails

### Frontend State Management
- **React Hooks**: `useState` and `useEffect` for component state
- **Context API**: `AuthContext` for global authentication state
- **Form Handling**: Controlled components with validation
- **Loading States**: Explicit loading indicators and error boundaries

## Security & Authentication

### Authentication Flow
- **OAuth Integration**: Multiple providers (Google, GitHub, LinkedIn, Microsoft)
- **JWT Tokens**: 7-day expiration with secure signing
- **Role-based Access**: `Buyer`, `Supplier`, `Admin` roles with middleware enforcement
- **Password Security**: bcrypt hashing with salt rounds

### Data Protection
- **Input Sanitization**: Parameterized queries and input validation
- **CORS Configuration**: Explicit origin allowlist
- **Environment Variables**: Sensitive data in `.env` files
- **Session Security**: Secure cookies in production environment

## Error Handling & Monitoring

### Backend Error Patterns
```javascript
try {
  // Operation
  const result = await pool.query(query, params);
  res.json(result.rows);
} catch (err) {
  console.error('Operation error:', err);
  res.status(500).json({ error: 'Operation failed' });
}
```

### Frontend Error Patterns
- **Error Boundaries**: React error boundaries for component error catching
- **API Error Handling**: Consistent error response handling with user feedback
- **Loading States**: Proper loading and error state management

### Event Logging System
- **Immutable Events**: Blockchain-ready event sourcing with SHA-256 hashing
- **Chain Integrity**: Previous event hash linking for tamper detection
- **Audit Trails**: Complete product and certification event history

## API Integration Patterns

### External Service Integration
- **Provider Pattern**: Base provider class with consistent interface
- **Mock Implementations**: Development-friendly mock providers (FSCMockProvider)
- **Error Resilience**: Graceful degradation when external APIs fail
- **Rate Limiting**: Respect external API rate limits and quotas

### Data Synchronization
- **Batch Processing**: Efficient bulk data operations
- **Verification Scoring**: Computed supplier verification scores with caching
- **Real-time Updates**: Live notifications and status tracking

## UI/UX Patterns

### Component Design
- **Tailwind CSS**: Utility-first styling with consistent design tokens
- **Responsive Design**: Mobile-first approach with breakpoint considerations
- **Dark Theme**: Consistent dark theme implementation (`bg-slate-950`, `text-white`)
- **Interactive States**: Hover effects and transition animations

### Form Patterns
- **Controlled Components**: React controlled inputs with validation
- **Dynamic Forms**: Add/remove functionality for complex forms (materials composition)
- **Validation Feedback**: Real-time validation with error messaging
- **Accessibility**: Proper labels and ARIA attributes

### Data Display
- **Loading States**: Skeleton screens and loading indicators
- **Empty States**: Meaningful empty state messages
- **Pagination**: Efficient data pagination for large datasets
- **Filtering**: Client and server-side filtering capabilities

## Performance Optimization

### Database Optimization
- **Indexing Strategy**: Proper indexes on frequently queried columns
- **Query Optimization**: Efficient JOIN operations and WHERE clauses
- **Connection Pooling**: Reuse database connections
- **Caching**: Computed scores and frequently accessed data

### Frontend Optimization
- **Code Splitting**: Route-based code splitting with React Router
- **Lazy Loading**: Dynamic imports for large components
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Optimization**: Vite for efficient bundling and hot reloading

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
- **Supabase Functions**: Edge functions for email delivery
- **Template System**: Reusable email components and layouts
- **Notification Logging**: Complete audit trail of sent notifications

### Email Patterns
```typescript
const { error } = await supabase.functions.invoke('handle-transactional-email', {
  body: {
    emailType: 'supplier-new-rfq',
    payload: {
      to: supplier.email,
      supplierName: supplier.firstname,
      // ... other template variables
    },
  },
});
```

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