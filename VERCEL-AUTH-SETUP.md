# OAuth Setup for Vercel Deployment

## Configure OAuth Providers in Supabase

### 1. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/api/auth/callback
   ```
4. Copy Client ID and Secret
5. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Paste Client ID and Secret
   - Save

### 2. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. Copy Client ID and generate Client Secret
5. In Supabase Dashboard → Authentication → Providers → GitHub:
   - Enable GitHub provider
   - Paste Client ID and Secret
   - Save

### 3. LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create new app
3. Add "Sign In with LinkedIn using OpenID Connect" product
4. Add redirect URLs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. Copy Client ID and Secret
6. In Supabase Dashboard → Authentication → Providers → LinkedIn (OIDC):
   - Enable LinkedIn OIDC provider
   - Paste Client ID and Secret
   - Save

## Update Vercel Environment Variables

Add these to Vercel Dashboard → Settings → Environment Variables:

```bash
# Already configured
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth redirect (auto-configured by Supabase)
# No additional env vars needed for OAuth!
```

## Test OAuth Flow

1. Deploy to Vercel: `vercel --prod`
2. Go to: `https://your-app.vercel.app/login`
3. Click "Continue with Google" (or GitHub/LinkedIn)
4. Authorize the app
5. Should redirect to dashboard

## Callback URLs Summary

For each OAuth provider, add these redirect URLs:

**Supabase Callback (Primary):**

```
https://your-project.supabase.co/auth/v1/callback
```

**Your App Callbacks (Optional):**

```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/api/auth/callback
http://localhost:3001/auth/callback (for local dev)
```

## Troubleshooting

### "Redirect URI mismatch" error

- Ensure callback URL in OAuth provider matches exactly
- Check Supabase URL is correct
- Verify provider is enabled in Supabase

### User redirected to wrong page

- Check `app/api/auth/callback/route.ts`
- Verify user metadata includes `user_type` or `role`
- Update redirect logic as needed

### OAuth button doesn't work

- Check browser console for errors
- Verify Supabase client is initialized
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

## Login Page Features

Your `/login` page now includes:

✅ **OAuth Buttons:**

- Google (with icon)
- LinkedIn (with icon)
- GitHub (with icon)

✅ **Email/Password Login:**

- Traditional form login
- Password visibility toggle
- Remember me checkbox

✅ **Demo Accounts:**

- Quick-fill architect demo
- Quick-fill supplier demo

✅ **User Experience:**

- Error messages
- Loading states
- Responsive design
- Debug mode (for development)

## Next Steps

1. Configure OAuth providers in Supabase
2. Add redirect URLs to each provider
3. Deploy to Vercel
4. Test each OAuth flow
5. Customize user onboarding based on provider
