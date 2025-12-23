# Vercel Environment Variables Checklist

This document lists all required and optional environment variables that must be configured in Vercel for successful deployment.

## 🚨 CRITICAL - Required for Deployment

These MUST be set in Vercel or deployment will fail:

### Supabase (Database & Auth)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

**How to add in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope (Production, Preview, Development)
3. For public variables (NEXT_PUBLIC_*), they can be visible
4. For service role keys, mark as "Sensitive"

### Sentry (Error Tracking)
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@....sentry.io/...
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=greenchainz-production
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

**Note:** If Sentry is not configured, the app will still deploy but errors won't be tracked.

---

## ⚠️ HIGH PRIORITY - Required for Core Features

### Email Service (Required for notifications)

Choose ONE of these email providers:

#### Option A: Resend (Recommended)
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@greenchainz.com
RESEND_FROM_NAME=GreenChainz
```

#### Option B: Zoho Mail
```bash
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587
ZOHO_SMTP_USER=noreply@greenchainz.com
ZOHO_SMTP_PASS=your-app-password
ZOHO_FROM_EMAIL=noreply@greenchainz.com
ZOHO_FROM_NAME=GreenChainz
```

### AWS S3 (File Storage)
Required for file uploads (PDFs, images, certificates):

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-assets
S3_BUCKET_NAME=greenchainz-assets
```

---

## 🔧 OPTIONAL - Feature-Specific

### Azure OpenAI (AI Features)
Required for "Green Audits" and AI-powered features:

```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

### Stripe (Payment Processing)
Required for subscription payments:

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT=price_...
```

### Intercom (Customer Support Chat)
```bash
NEXT_PUBLIC_INTERCOM_APP_ID=your-app-id
INTERCOM_ACCESS_TOKEN=your-access-token
```

### MailerLite (Email Marketing)
```bash
MAILERLITE_API_KEY=your-api-key
MAILERLITE_FROM_EMAIL=newsletter@greenchainz.com
MAILERLITE_FROM_NAME=GreenChainz
```

### Analytics
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## 🔐 Security & Authentication

### Session & JWT
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-in-production-min-32-chars
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

**Generate secure secrets:**
```bash
openssl rand -base64 32
```

### Cron Jobs
```bash
CRON_SECRET=your-random-cron-secret
```

---

## 🌍 Environment-Specific Settings

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://greenchainz.com
```

### Preview/Development
```bash
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=https://preview-branch.vercel.app
```

---

## 📋 Verification Steps

After adding environment variables to Vercel:

1. **Trigger a new deployment** (push to main or redeploy in Vercel dashboard)
2. **Check deployment logs** for any missing variable warnings
3. **Test critical features:**
   - [ ] User authentication (Supabase)
   - [ ] File uploads (AWS S3)
   - [ ] Email notifications (Resend/Zoho)
   - [ ] Error tracking (Sentry)
4. **Monitor Sentry** for any configuration errors
5. **Check Vercel logs** for runtime errors related to missing env vars

---

## 🔍 Troubleshooting

### Build Fails with "Missing Environment Variable"
- Check that the variable is added to Vercel
- Ensure it's set for the correct environment (Production/Preview)
- Redeploy after adding variables

### Sentry Not Working
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set
- Check `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry account
- Add `SENTRY_AUTH_TOKEN` for source map uploads

### Supabase Errors
- Verify URLs don't have trailing slashes
- Ensure ANON_KEY is for the correct Supabase project
- Check SERVICE_ROLE_KEY is marked as sensitive in Vercel

### File Uploads Not Working
- Verify all AWS credentials are correct
- Check bucket name matches in both variables
- Ensure AWS IAM user has S3 write permissions

---

## 📝 Quick Setup Commands

```bash
# Generate secrets locally for testing
export JWT_SECRET=$(openssl rand -base64 32)
export SESSION_SECRET=$(openssl rand -base64 32)
export CRON_SECRET=$(openssl rand -base64 32)

# Test build locally with env vars
npm run build

# Deploy to Vercel after setting env vars
vercel --prod
```

---

## 🔗 Useful Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Supabase Project Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Sentry Project Settings](https://sentry.io/settings/)
- [AWS IAM Console](https://console.aws.amazon.com/iam/)
