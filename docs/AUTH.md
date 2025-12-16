# Authentication System Documentation

## Overview
This system uses a custom JWT-based authentication flow with Supabase as the database backend. It supports Email/Password login and LinkedIn OAuth.

## API Endpoints

### POST /api/auth/signup
Registers a new user.
- **Body**: `{ email, password, accountType: 'architect'|'supplier', companyName? }`
- **Response**: `{ userId, email, verificationEmailSent: true }`

### POST /api/auth/verify-email
Verifies user email.
- **Body**: `{ email, verificationCode }`
- **Response**: `{ verified: true, nextStep: 'complete-profile' }`

### POST /api/auth/login
Logs in a user.
- **Body**: `{ email, password }`
- **Response**: `{ userId, email, accountType, token }` (Sets HttpOnly cookie)

### GET /api/auth/linkedin
Redirects to LinkedIn OAuth page.

### POST /api/auth/linkedin/callback
Exchanges LinkedIn code for token.
- **Body**: `{ code }`
- **Response**: `{ token, userId, role, redirectUrl }`

### GET /api/auth/me
Returns current authenticated user.

### POST /api/auth/logout
Clears auth cookie.

## Middleware
`lib/auth/verify-role.ts` provides `verifyRole(req, requiredRole)` to protect API routes.

## Corporate Verification
Automatically detects corporate domains (e.g., autodesk.com) and assigns higher trust scores.

## Known Limitations (MVP)

- **No MFA**: Multi-factor authentication not implemented yet
- **Email mocked**: Resend integration pending (Agent 11)
- **LinkedIn OAuth**: Credentials needed (get from LinkedIn Developer Portal)
- **Rate limiting**: Basic rate limiting in place, upgrade for production
- **Password reset**: Basic flow implemented (see app/forgot-password)

## Production Checklist

Before going live:
- [ ] Get LinkedIn OAuth credentials
- [ ] Set up Resend for emails (Agent 11)
- [ ] Enable rate limiting with Redis
- [ ] Add session management (currently stateless JWT)
- [ ] Configure password complexity requirements
- [ ] Set up monitoring for failed login attempts
- [ ] Add CAPTCHA to prevent bot signups

## Setup
Ensure `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and LinkedIn env vars are set.
Run `database-schemas/mvp_schema.sql` to initialize tables.
