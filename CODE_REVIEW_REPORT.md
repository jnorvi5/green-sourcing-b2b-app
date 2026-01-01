# Code Review Report: Sign-In Infinite Loading Debug

**Generated:** 2026-01-01  
**Issue:** Sign In button loads forever on production deployment

## Executive Summary

The "Sign In" button was loading forever due to a **response structure mismatch** between the login API and the client-side login page. When the client tried to access `data.user.user_type`, it threw an error because `data.user` was undefined, causing the loading state to remain stuck.

## Root Cause Analysis

### Issue #1: API Response Structure Mismatch (CRITICAL)

**Location:** `app/api/auth/login/route.ts` and `app/login/page.tsx`

**Problem:** The API was returning:
```json
{
  "userId": "...",
  "email": "...",
  "accountType": "architect",
  "token": "..."
}
```

But the client expected:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "user_type": "architect"
  },
  "token": "..."
}
```

**Impact:** JavaScript error `Cannot read properties of undefined (reading 'user_type')` which prevented the loading state from being cleared.

### Issue #2: No Request Timeout

**Location:** `app/login/page.tsx`

**Problem:** The fetch request had no timeout, meaning network issues could cause infinite loading.

### Issue #3: Middleware Throws at Module Load Time

**Location:** `lib/supabase/middleware.ts`

**Problem:** The middleware threw an error at module load time if Supabase env vars were missing, which could crash the build.

## Fixes Applied

### Fix 1: API Response Structure ✅

```diff
// app/api/auth/login/route.ts
- const response = NextResponse.json({
-   userId: user.id,
-   email: user.email,
-   accountType: user.role,
-   token
- });
+ const response = NextResponse.json({
+   user: {
+     id: user.id,
+     email: user.email,
+     user_type: user.role,
+     full_name: user.full_name || null,
+   },
+   token
+ });
```

### Fix 2: Request Timeout and Error Handling ✅

```diff
// app/login/page.tsx
+ const controller = new AbortController();
+ const timeoutId = setTimeout(() => controller.abort(), 30000);
+
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
    credentials: "include",
+   signal: controller.signal,
  });
+
+ clearTimeout(timeoutId);
```

### Fix 3: Safety Check for Response Structure ✅

```diff
// app/login/page.tsx
if (response.ok) {
+ if (!data.user) {
+   setError("Unexpected response from server. Please try again.");
+   logger.error("Login response missing user object", { data });
+   return;
+ }
```

### Fix 4: Graceful Middleware Degradation ✅

```diff
// lib/supabase/middleware.ts
- if (!supabaseUrl || !supabaseKey) {
-     throw new Error('Missing Supabase environment variables');
- }
+ // Don't throw at module load time - check at runtime
+ if (!supabaseUrl || !supabaseKey) {
+     console.warn('⚠️ Missing Supabase environment variables in middleware.');
+     // Return a mock client that won't crash
+     return { response, supabase: mockSupabase };
+ }
```

### Fix 5: Secure Error Handling ✅

```diff
// app/api/auth/login/route.ts
catch (error) {
  console.error('Login error:', error);
+ const isDev = process.env['NODE_ENV'] !== 'production';
  return NextResponse.json({ 
    error: 'Internal Server Error',
-   details: error instanceof Error ? error.message : 'Unknown error'
+   ...(isDev && { details: error instanceof Error ? error.message : 'Unknown error' })
  }, { status: 500 });
}
```

## Testing Commands

```bash
# Run the development server to test locally
npm run dev

# Build to verify no compilation errors
npm run build

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run existing tests
npm run test
```

## Verification Steps

1. Navigate to `/login` page
2. Enter valid credentials (or demo credentials)
3. Click "Sign In" button
4. Verify:
   - Loading indicator appears
   - Loading indicator disappears within 30 seconds (either success or error)
   - On success: redirects to appropriate dashboard
   - On error: error message is displayed

## Known Issues (Outside Scope)

1. **TypeScript Errors:** There are ~100+ TypeScript errors in other parts of the codebase related to:
   - Next.js async cookies() API
   - Supabase type mismatches
   - Various `any` type usage
   
   These are pre-existing issues not related to the sign-in fix.

2. **Outdated E2E Tests:** `tests/auth.spec.ts` expects an "Access Code" flow that no longer exists.

## Environment Variables Checklist

Ensure these are set in Azure Container Apps:

- [x] `NEXT_PUBLIC_SUPABASE_URL` - Must be set to `https://jfexzdhacbgugleutgdwq.supabase.co`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Must be set
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Must be set (used by login API)
- [x] `JWT_SECRET` - Must be set (for token generation)

## Security Considerations

1. ✅ Error details only exposed in development mode
2. ✅ Passwords validated using bcrypt
3. ✅ HttpOnly cookies with secure flag in production
4. ✅ Database errors logged but not exposed to client
