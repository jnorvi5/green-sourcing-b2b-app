# OAuth Provider Setup Guide

This guide walks through setting up Google, LinkedIn, and GitHub OAuth for GreenChainz authentication.

## Prerequisites

- Supabase project created
- Access to Google Cloud Console, LinkedIn Developer Portal, and GitHub Developer Settings
- Supabase Project URL (format: `https://[PROJECT-REF].supabase.co`)

## OAuth Redirect URI

All OAuth providers must use this redirect URI:

```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

Find your PROJECT-REF in: Supabase Dashboard → Settings → API → Project URL

---

## Google OAuth Setup (10 minutes)

### 1. Create OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select or create project: "GreenChainz"
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Configure consent screen (first time only):
   - User Type: **External**
   - App name: **GreenChainz**
   - User support email: `founder@greenchainz.com`
   - Developer email: `founder@greenchainz.com`
5. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **GreenChainz Production**
   - Authorized redirect URIs: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Toggle **Enable Google provider** to ON
3. Paste **Client ID**
4. Paste **Client Secret**
5. Click **Save**

---

## GitHub OAuth Setup (10 minutes)

### 1. Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - Application name: **GreenChainz**
   - Homepage URL: `https://greenchainz.com`
   - Authorization callback URL: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
4. Click **Register application**
5. Click **Generate a new client secret**
6. Copy **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Supabase Dashboard → **Authentication** → **Providers** → **GitHub**
2. Toggle **Enable GitHub provider** to ON
3. Paste **Client ID**
4. Paste **Client Secret**
5. Click **Save**

---

## LinkedIn OAuth Setup (10 minutes)

### 1. Create OAuth App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in:
   - App name: **GreenChainz**
   - LinkedIn Page: Select your company page (create if needed)
   - App logo: Upload GreenChainz logo
   - Legal agreement: Check box
4. Click **Create app**
5. Go to **Auth** tab
6. Add Redirect URL: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
7. Go to **Products** tab
8. Request access to **Sign In with LinkedIn using OpenID Connect**
9. Go back to **Auth** tab
10. Copy **Client ID** and **Client Secret**

### 2. Configure in Supabase

⚠️ **IMPORTANT**: Use "LinkedIn (OIDC)" not legacy "LinkedIn"

1. Supabase Dashboard → **Authentication** → **Providers** → **LinkedIn (OIDC)**
2. Toggle **Enable LinkedIn (OIDC) provider** to ON
3. Paste **Client ID**
4. Paste **Client Secret**
5. Click **Save**

---

## Testing

### Test Each Provider

1. Visit `https://greenchainz.com/auth/login`
2. Click "Continue with Google" → Should redirect to Google login
3. Click "Continue with LinkedIn" → Should redirect to LinkedIn authorization
4. Click "Continue with GitHub" → Should redirect to GitHub authorization
5. After authorization, should redirect to `/auth/callback` → role-based dashboard

### Verify User Creation

1. Supabase Dashboard → **Authentication** → **Users**
2. New OAuth users should appear with:
   - Email from provider
   - Provider metadata (avatar, name, etc.)
   - `app_metadata.provider` set to 'google', 'github', or 'linkedin_oidc'

---

## Common Issues

### "Invalid Redirect URI" Error

**Cause**: Redirect URI in OAuth provider doesn't match Supabase callback URL

**Fix**: Double-check redirect URI format:
- ✅ `https://abcdefgh.supabase.co/auth/v1/callback`
- ❌ `http://` (must be https)
- ❌ Missing `/auth/v1/callback`
- ❌ Trailing slash

### LinkedIn "Insufficient Scope" Error

**Cause**: LinkedIn product access not approved or using legacy provider

**Fix**:
1. LinkedIn Developer Portal → Your App → **Products**
2. Ensure "Sign In with LinkedIn using OpenID Connect" is **Verified**
3. Use `linkedin_oidc` provider in code (not `linkedin`)

### Users Missing Role After OAuth

**Cause**: Role not assigned during OAuth signup

**Fix**: Add database trigger or update callback route to set default role

---

## Environment Variables

No additional environment variables needed for OAuth. Supabase handles provider credentials internally.

**Existing required variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Production Checklist

- [ ] Google OAuth configured in Supabase
- [ ] GitHub OAuth configured in Supabase
- [ ] LinkedIn OIDC configured in Supabase
- [ ] All redirect URIs use production domain
- [ ] Tested login flow for each provider
- [ ] Verified users created in Supabase
- [ ] Role assignment working correctly
- [ ] react-icons dependency installed: `npm install react-icons`

---

## Next Steps

1. **Add Microsoft OAuth** (for enterprise AEC firms using Microsoft 365)
2. **Implement role selection** during OAuth onboarding
3. **Capture provider metadata** (LinkedIn profile, GitHub username) for richer user profiles
4. **Add SAML SSO** (Month 9+) for enterprise customers via WorkOS
