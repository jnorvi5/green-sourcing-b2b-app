# OAuth Provider Setup Guide for GreenChainz

This guide walks through setting up Google, LinkedIn, Microsoft (Azure AD), and GitHub OAuth for GreenChainz authentication via Supabase.

## Prerequisites

- Supabase project created
- Access to:
  - Google Cloud Console
  - LinkedIn Developer Portal
  - Microsoft Azure Portal (Entra ID)
  - GitHub Developer Settings
- Supabase Project URL: `https://jfexzdhacbgugleutgdwq.supabase.co`
- Production domain: `https://greenchainz.com`

---

## Exact Redirect URLs to Whitelist

**For all OAuth providers, use your Supabase callback URL in this format:**

```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

For the GreenChainz production environment, the URL is:
```
https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
```

⚠️ **Important**: Replace `[YOUR-PROJECT-REF]` with your actual Supabase project reference ID. You can find this in your Supabase Dashboard → Settings → API → Project URL. Ensure no trailing slash and use `https://`.

---

## Google OAuth Setup (10 minutes)

### 1. Create OAuth App in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select or create project: "GreenChainz"
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Configure consent screen (first time only):
   - User Type: **External**
   - App name: **GreenChainz**
   - User support email: `founder@greenchainz.com`
   - Developer email: `founder@greenchainz.com`
   - Authorized domains: `greenchainz.com`
5. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **GreenChainz Production**
   - Authorized JavaScript origins: `https://greenchainz.com`
   - Authorized redirect URIs:
     ```
     https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
     ```
6. Copy **Client ID** and **Client Secret**

### 2. Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Navigate to **Authentication** → **Providers** → **Google**
3. Toggle **Enable Google provider** to ON
4. Paste **Client ID** (format: `xxx.apps.googleusercontent.com`)
5. Paste **Client Secret**
6. Click **Save**

---

## Microsoft (Azure AD) OAuth Setup (15 minutes)

> **Best for B2B**: Many architects and enterprise suppliers use Microsoft 365. Azure AD provides seamless SSO.

### 1. Register App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Microsoft Entra ID** (formerly Azure Active Directory)
3. Click **App registrations** → **New registration**
4. Fill in:
   - Name: **GreenChainz**
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (for maximum compatibility)
   - Redirect URI (Web):
     ```
     https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
     ```
5. Click **Register**

### 2. Configure Authentication Settings

1. In your app registration, go to **Authentication**
2. Under **Web** → Redirect URIs, verify:
   ```
   https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
   ```
3. Under **Implicit grant and hybrid flows**, check:
   - ✅ ID tokens
4. Under **Supported account types**, select:
   - **Accounts in any organizational directory and personal Microsoft accounts**
5. Click **Save**

### 3. Create Client Secret

1. Go to **Certificates & secrets** → **Client secrets**
2. Click **New client secret**
3. Description: `GreenChainz Supabase Auth`
4. Expiration: **24 months** (set a reminder to rotate)
5. Click **Add**
6. **Copy the secret value immediately** — it won't be shown again!

### 4. Note the Application IDs

From the **Overview** page, copy:
- **Application (client) ID** — this is your Client ID
- **Directory (tenant) ID** — needed if restricting to specific tenant

### 5. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add these permissions:
   - `email`
   - `openid`
   - `profile`
   - `User.Read`
4. Click **Grant admin consent** (if you have admin rights)

### 6. Configure in Supabase Dashboard

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **Azure**
2. Toggle **Enable Azure provider** to ON
3. Paste:
   - **Azure Tenant URL**: `https://login.microsoftonline.com/common` (for multi-tenant)
     - Or use `https://login.microsoftonline.com/{tenant-id}` for single tenant
   - **Client ID**: Your Application (client) ID
   - **Client Secret**: The secret value you copied
4. Click **Save**

---

## LinkedIn OAuth Setup (10 minutes)

> **Essential for B2B**: Architects and suppliers often have professional LinkedIn profiles.

### 1. Create App in LinkedIn Developer Portal

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in:
   - App name: **GreenChainz**
   - LinkedIn Page: Select your company page (or create one)
   - App logo: Upload GreenChainz logo
   - Legal agreement: Check box
4. Click **Create app**

### 2. Configure OAuth Settings

1. Go to **Auth** tab
2. Under **OAuth 2.0 settings**, add Redirect URL:
   ```
   https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
   ```
3. Copy **Client ID** and **Client Secret**

### 3. Request OpenID Connect Access

1. Go to **Products** tab
2. Find **Sign In with LinkedIn using OpenID Connect**
3. Click **Request access** and follow the approval process
4. Wait for approval (usually instant for OpenID Connect)

### 4. Configure in Supabase Dashboard

⚠️ **IMPORTANT**: Use "LinkedIn (OIDC)" provider, NOT the legacy "LinkedIn" provider

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **LinkedIn (OIDC)**
2. Toggle **Enable LinkedIn (OIDC) provider** to ON
3. Paste **Client ID**
4. Paste **Client Secret**
5. Click **Save**

---

## GitHub OAuth Setup (10 minutes)

> **Useful for developers**: Some architects and tech-savvy suppliers use GitHub.

### 1. Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Application name: **GreenChainz**
   - Homepage URL: `https://greenchainz.com`
   - Authorization callback URL:
     ```
     https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Click **Generate a new client secret**
6. Copy **Client ID** and **Client Secret**

### 2. Configure in Supabase Dashboard

1. Go to Supabase Dashboard → **Authentication** → **Providers** → **GitHub**
2. Toggle **Enable GitHub provider** to ON
3. Paste **Client ID**
4. Paste **Client Secret**
5. Click **Save**

---

## Complete OAuth Flow Diagram

```
User clicks "Continue with [Provider]"
           ↓
Next.js calls supabase.auth.signInWithOAuth({ provider })
           ↓
Browser redirects to provider (Google/Microsoft/LinkedIn/GitHub)
           ↓
User authenticates with provider
           ↓
Provider redirects to:
  https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
           ↓
Supabase exchanges code for tokens, creates/updates user
           ↓
Supabase redirects to:
  https://greenchainz.com/auth/callback
           ↓
Next.js /auth/callback route exchanges code for session
           ↓
User redirected to role-based dashboard:
  - Supplier → /supplier/dashboard
  - Architect → /architect/dashboard
  - New user → /onboarding
```

---

## Testing OAuth Flow

### Test Each Provider

1. **Login Page**: Visit `https://greenchainz.com/login`
2. **Signup Page**: Visit `https://greenchainz.com/signup`

For each provider (Google, Microsoft, LinkedIn, GitHub):
1. Click the provider button
2. Complete authentication with the provider
3. Verify redirect back to GreenChainz
4. Check Supabase Dashboard → **Authentication** → **Users** for new user

### Verify User Data in Supabase

New OAuth users should appear with:
- Email from provider
- Provider metadata (avatar, name, etc.)
- `app_metadata.provider` set to provider name (`google`, `azure`, `linkedin_oidc`, `github`)

---

## Environment Variables

OAuth is configured directly in Supabase Dashboard. No additional environment variables needed in your Next.js app.

**Required Supabase variables** (already configured):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://jfexzdhacbgugleutgdwq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Common Issues & Troubleshooting

### "Invalid Redirect URI" Error

**Cause**: Redirect URI mismatch between provider and Supabase

**Fix**: Ensure exact match in provider settings:
```
https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback
```

Common mistakes:
- ❌ `http://` instead of `https://`
- ❌ Missing `/auth/v1/callback`
- ❌ Trailing slash at end
- ❌ Wrong project reference

### LinkedIn "Insufficient Scope" Error

**Cause**: OpenID Connect product not approved

**Fix**:
1. LinkedIn Developer Portal → Your App → **Products**
2. Ensure "Sign In with LinkedIn using OpenID Connect" shows **Added**
3. In Supabase, use `linkedin_oidc` provider (not `linkedin`)

### Microsoft "AADSTS50011" Error

**Cause**: Reply URL not registered in Azure

**Fix**:
1. Azure Portal → App registration → **Authentication**
2. Add redirect URI: `https://jfexzdhacbgugleutgdwq.supabase.co/auth/v1/callback`
3. Save and wait 5 minutes for propagation

### Users Missing Role After OAuth

**Cause**: Role not assigned during OAuth signup

**Fix**: The `/auth/callback` route redirects new users to `/onboarding` where they can select their role. For automatic role assignment, add a database trigger:

```sql
-- Example: Auto-assign 'architect' role for new OAuth users
CREATE OR REPLACE FUNCTION handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "architect"}'::jsonb
  WHERE id = NEW.id AND raw_user_meta_data->>'role' IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Production Checklist

### Supabase Dashboard Configuration
- [ ] Google OAuth enabled with Client ID and Secret
- [ ] Microsoft/Azure OAuth enabled with Client ID, Secret, and Tenant URL
- [ ] LinkedIn OIDC enabled with Client ID and Secret
- [ ] GitHub OAuth enabled with Client ID and Secret

### Provider Console Configuration
- [ ] Google: Redirect URI added in Google Cloud Console
- [ ] Microsoft: Redirect URI added in Azure App Registration
- [ ] LinkedIn: Redirect URL added, OpenID Connect product enabled
- [ ] GitHub: Callback URL added

### Application Testing
- [ ] Login page OAuth buttons working for all 4 providers
- [ ] Signup page OAuth buttons working for all 4 providers
- [ ] Users created correctly in Supabase after OAuth
- [ ] Role-based redirect working after authentication
- [ ] `react-icons` dependency installed (`npm install react-icons`)

---

## Next Steps

1. **Implement role selection** during OAuth onboarding for new users
2. **Capture provider metadata** (LinkedIn profile, company, etc.) for richer user profiles
3. **Add SAML SSO** (Month 9+) for enterprise customers requiring SSO via WorkOS
4. **Add Apple Sign-In** if mobile app is planned
