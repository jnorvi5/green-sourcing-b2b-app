# Role-Based Access Control (RBAC) Implementation

## Overview

GreenChainz implements a comprehensive RBAC system using Supabase Auth for authentication and a custom profiles table for role management.

## User Roles

| Role | Description | Dashboard Access |
|------|-------------|-----------------|
| `buyer` | Architects, contractors, procurement teams | `/dashboard/buyer` |
| `supplier` | Material manufacturers and distributors | `/dashboard/supplier` |
| `admin` | Platform administrators | `/admin` |

## Architecture

### 1. Database Schema

```sql
-- profiles table in Supabase
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'buyer',
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    company_id INTEGER REFERENCES companies(companyid),
    verification_status verification_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Role enum
CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');

-- Verification status enum  
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
```

### 2. Frontend Components

#### AuthContext (`frontend/src/context/AuthContext.tsx`)
- Manages user session state
- Fetches profile from database
- Provides role-checking utilities:
  - `hasRole(roles)` - Check if user has any of the specified roles
  - `isSupplier()` - Check if user is a supplier
  - `isBuyer()` - Check if user is a buyer
  - `isAdmin()` - Check if user is an admin

#### ProtectedRoute (`frontend/src/components/ProtectedRoute.tsx`)
- Wraps routes requiring authentication
- Supports role-based restrictions
- Redirects unauthenticated users to `/login`
- Redirects unauthorized users to `/unauthorized`

**Usage:**
```tsx
// Basic authentication required
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Specific role required
<ProtectedRoute allowedRoles="supplier">
  <SupplierDashboard />
</ProtectedRoute>

// Multiple roles allowed
<ProtectedRoute allowedRoles={['buyer', 'admin']}>
  <BuyerDashboard />
</ProtectedRoute>
```

**Shorthand Components:**
- `<SupplierRoute>` - Suppliers only
- `<BuyerRoute>` - Buyers only
- `<AdminRoute>` - Admins only
- `<AuthenticatedRoute>` - Any authenticated user
- `<SupplierOrAdminRoute>` - Suppliers or admins
- `<BuyerOrAdminRoute>` - Buyers or admins

### 3. Backend Middleware

#### supabaseAuth (`backend/middleware/supabaseAuth.js`)
- Verifies Supabase JWT tokens
- Fetches user profile with role
- Provides role-checking middleware

**Middleware Functions:**
```javascript
// Verify token and attach user to request
authenticateSupabase(req, res, next)

// Ensure user has required role(s)
ensureRole('supplier', 'admin')

// Shorthand middleware
supplierOnly
buyerOnly
adminOnly
authenticated

// Ownership check
ensureOwnership(getOwnerId)
```

**Usage:**
```javascript
// Protect route with authentication + role
router.use(authenticateSupabase);
router.use(ensureRole('supplier'));

router.get('/my-products', async (req, res) => {
  // req.user contains: userId, email, role, etc.
});
```

## Protected Routes

### Frontend Routes

| Route Pattern | Allowed Roles | Component |
|--------------|---------------|-----------|
| `/dashboard/supplier/*` | supplier, admin | SupplierDashboard |
| `/dashboard/buyer/*` | buyer, admin | BuyerDashboard |
| `/admin/*` | admin | AdminDashboard |
| `/messages` | any authenticated | Messages |
| `/settings` | any authenticated | Settings |

### Backend API Routes

| Route Pattern | Allowed Roles | Description |
|--------------|---------------|-------------|
| `/api/v2/supplier/*` | supplier, admin | Supplier-specific endpoints |
| `/api/v2/buyer/*` | buyer, admin | Buyer-specific endpoints |
| `/api/v2/admin/*` | admin | Admin management endpoints |

## Authentication Flow

### Sign Up
1. User submits signup form with role selection
2. Supabase creates auth.users record
3. Database trigger creates profiles record
4. Frontend upserts profile with role
5. User redirected to role-appropriate dashboard

### Sign In
1. User submits login credentials
2. Supabase verifies and returns JWT
3. Frontend fetches profile from database
4. AuthContext updates with user + profile
5. User redirected based on role:
   - supplier → `/dashboard/supplier`
   - buyer → `/dashboard/buyer`
   - admin → `/admin`

### Protected Route Access
1. ProtectedRoute checks loading state
2. If not authenticated → redirect to `/login`
3. If role check required, wait for profile
4. If role doesn't match → redirect to `/unauthorized`
5. If authorized → render children

## Row Level Security (RLS)

The profiles table has RLS policies:

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role has full access"
ON public.profiles
USING (auth.jwt() ->> 'role' = 'service_role');
```

## Error Handling

### Frontend
- `ProtectedRoute` shows loading spinner while checking auth
- `Unauthorized` page shows user's role vs required roles
- `Login` page preserves original URL for redirect after auth

### Backend
- `AUTH_TOKEN_MISSING` (401) - No token provided
- `AUTH_TOKEN_EXPIRED` (401) - JWT expired
- `AUTH_TOKEN_INVALID` (401) - Invalid JWT
- `AUTH_REQUIRED` (401) - Authentication required
- `AUTH_INSUFFICIENT_ROLE` (403) - Role not authorized
- `AUTH_NOT_OWNER` (403) - Not resource owner

## Environment Variables

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# JWT (optional - falls back to Supabase default)
SUPABASE_JWT_SECRET=your-jwt-secret
```

## Testing RBAC

1. **Create test users** for each role in Supabase dashboard
2. **Update their profiles** with correct roles
3. **Test protected routes** by logging in as each role
4. **Verify redirects** work correctly for unauthorized access

## Migration Checklist

- [x] Create profiles table with role column
- [x] Create user_role enum type
- [x] Add database trigger for profile creation
- [x] Implement RLS policies
- [x] Update AuthContext with role support
- [x] Create/update ProtectedRoute component
- [x] Update App.tsx with role guards
- [x] Update Login for role-based redirect
- [x] Update Signup with profile creation
- [x] Create Unauthorized page
- [x] Add backend supabaseAuth middleware
- [x] Protect backend routes with role checks
