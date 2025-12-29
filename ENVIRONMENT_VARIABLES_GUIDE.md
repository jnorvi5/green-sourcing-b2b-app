# 🔐 GreenChainz Environment Variables Configuration Guide

This guide provides a complete list of ALL environment variables used in the GreenChainz B2B Marketplace, organized by where they should be configured.

---

## 📋 Quick Reference

| Total Variables | Azure/Vercel Production | Local Development Only |
|----------------|------------------------|------------------------|
| **73** | **57** | **16** |

---

## 🎯 Configuration Locations

### ☁️ AZURE/VERCEL (Production & Preview Environments)

These variables **MUST** be configured in your Azure App Service Configuration or Vercel Environment Variables dashboard. They are required for the application to run in production.

#### 🔴 **CRITICAL - Application Won't Start Without These (10 variables)**

```bash
# Supabase Database (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Security Secrets (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
CRON_SECRET=your-random-cron-secret

# Base URLs (REQUIRED)
NEXT_PUBLIC_BASE_URL=https://greenchainz.com
NEXTAUTH_URL=https://greenchainz.com

# Email Service (REQUIRED - Choose ONE)
RESEND_API_KEY=re_your_resend_api_key
# OR
ZOHO_SMTP_PASS=your-app-password
```

**Generate secure secrets:**
```bash
openssl rand -base64 32
```

---

#### 🟠 **HIGH PRIORITY - Core Features Need These (27 variables)**

```bash
# ============================================
# AWS S3 - File Storage (PDFs, Images, Certificates)
# ============================================
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-production
AWS_IMAGES_BUCKET=greenchainz-images
AWS_EPD_BUCKET=greenchainz-epd-documents
AWS_BACKUP_BUCKET=greenchainz-backups
S3_BUCKET_NAME=greenchainz-production

# ============================================
# Azure OpenAI - AI Features (Green Audits, EPD Parsing)
# ============================================
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Content Understanding (Document Intelligence)
AZURE_CONTENT_UNDERSTANDING_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_CONTENT_UNDERSTANDING_KEY=your-key
AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID=your-analyzer-id

# Azure Functions (Web Scraping)
AZURE_FUNCTIONS_BASE_URL=https://your-function-app.azurewebsites.net
AZURE_SCRAPER_FUNCTION_URL=https://your-function-app.azurewebsites.net/api/scrapeSupplier

# ============================================
# Stripe - Payment Processing
# ============================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT=price_...
STRIPE_PRICE_STANDARD=price_standard_monthly_id
STRIPE_PRICE_ARCHITECT_PRO=price_architect_pro_monthly_id
STRIPE_PRICE_SUPPLIER=price_supplier_monthly_id

# ============================================
# Sentry - Error Tracking & Monitoring
# ============================================
NEXT_PUBLIC_SENTRY_DSN=https://...@....sentry.io/...
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=greenchainz-production
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

---

#### 🟡 **MEDIUM PRIORITY - Enhanced Features (15 variables)**

```bash
# ============================================
# Email Services
# ============================================
# Resend (Primary Email Service)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@greenchainz.com
RESEND_FROM_NAME=GreenChainz

# Zoho Mail (Transactional Email Alternative)
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587
ZOHO_SMTP_USER=noreply@greenchainz.com
ZOHO_SMTP_PASS=your-app-password
ZOHO_FROM_EMAIL=noreply@greenchainz.com
ZOHO_FROM_NAME=GreenChainz
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token
ZOHO_ACCOUNT_ID=your-zoho-account-id

# MailerLite (Marketing Email)
MAILERLITE_API_KEY=your-mailerlite-api-key
MAILERLITE_FROM_EMAIL=newsletter@greenchainz.com
MAILERLITE_FROM_NAME=GreenChainz
MAILERLITE_AUTOMATION_BUYER_ONBOARDING=your-automation-id
MAILERLITE_AUTOMATION_SUPPLIER_ONBOARDING=your-automation-id
```

---

#### 🟢 **OPTIONAL - Additional Integrations (5 variables)**

```bash
# ============================================
# Customer Support & Analytics
# ============================================
# Intercom (Customer Support Chat)
NEXT_PUBLIC_INTERCOM_APP_ID=your-intercom-app-id
INTERCOM_ACCESS_TOKEN=your-access-token
INTERCOM_ACTION_SECRET=your-action-secret

# PostHog (Product Analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ============================================
# Data Provider APIs
# ============================================
# EPD International (Product Environmental Data)
EPD_INTERNATIONAL_API_KEY=your-epd-api-key
EPD_API_KEY=your-epd-api-key
EPD_API_URL=https://api.environdec.com

# EC3 (Embodied Carbon Database)
EC3_API_KEY=your-ec3-bearer-token
EC3_CLIENT_ID=your-ec3-client-id
EC3_CLIENT_SECRET=your-ec3-client-secret

# Autodesk (BIM Integration)
AUTODESK_CLIENT_ID=your-autodesk-client-id
AUTODESK_CLIENT_SECRET=your-autodesk-client-secret
AUTODESK_CALLBACK_URL=https://greenchainz.com/api/autodesk/callback
AUTODESK_SDA_API_URL=https://developer.api.autodesk.com

# LinkedIn (Social Media Integration)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=https://greenchainz.com/auth/linkedin/callback
LINKEDIN_ACCESS_TOKEN=your-linkedin-access-token
LINKEDIN_AUTHOR_URN=urn:li:person:...

# Anthropic Claude (Alternative AI)
ANTHROPIC_API_KEY=sk-ant-...

# Firecrawl (Web Scraping Alternative)
FIRECRAWL_API_KEY=your-firecrawl-api-key

# AI Agent Endpoints (Microservices)
AGENT_RFQ_MATCHING_URL=https://your-agent.azurewebsites.net/api/match
AGENT_CARBON_OPTIMIZER_URL=https://your-agent.azurewebsites.net/api/optimize
AGENT_COMPLIANCE_URL=https://your-agent.azurewebsites.net/api/check
AGENT_AUDITOR_URL=https://your-agent.azurewebsites.net/api/audit
AGENT_PRICING_URL=https://your-agent.azurewebsites.net/api/price
```

---

### 💻 LOCAL DEVELOPMENT ONLY (.env.local)

These variables should **ONLY** be in your local `.env.local` file for development. They are **NOT** needed in Azure/Vercel.

```bash
# ============================================
# Local Development Settings
# ============================================
# Node Environment (Set automatically in production)
NODE_ENV=development

# Local Server Configuration
PORT=3000
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Local Database (if using MongoDB locally)
MONGODB_URI=mongodb://localhost:27017/greenchainz
DATABASE_URL=postgresql://localhost:5432/greenchainz

# Test Email Settings (Gmail SMTP for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@localhost

# Development Notifications
NOTIFICATIONS_ENABLED=false

# Local Callback URLs (OAuth testing)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Vercel-Specific (Set automatically)
VERCEL_URL=auto-set-by-vercel
VERCEL_ENV=auto-set-by-vercel

# CI/CD (Set automatically)
CI=auto-set-by-ci-system
```

---

## 📝 How to Configure

### For Azure App Service:

1. Go to Azure Portal → Your App Service
2. Navigate to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add each variable from the "AZURE/VERCEL" section above
5. Mark sensitive values (keys, secrets, tokens) as **Slot settings** if using staging slots
6. Click **Save** and **Restart** the app

### For Vercel:

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from the "AZURE/VERCEL" section above
4. Select appropriate environments:
   - **Production**: Required for live site
   - **Preview**: For PR previews (use same or test values)
   - **Development**: For `vercel dev` (optional)
5. Mark sensitive variables with the eye icon
6. Redeploy after adding variables

### For Local Development:

1. Create `.env.local` in the project root:
   ```bash
   cp .env.example .env.local
   ```

2. Add values from the "LOCAL DEVELOPMENT ONLY" section

3. Add minimal required Azure/Vercel variables for testing:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-dev-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
   JWT_SECRET=local-dev-secret-123
   RESEND_API_KEY=re_your_test_key
   ```

4. Never commit `.env.local` (it's in `.gitignore`)

---

## 🔍 Variable Categories Explained

### Public Variables (NEXT_PUBLIC_*)
- ✅ Safe to expose to browser
- Used in client-side React components
- Examples: Supabase URL, Analytics IDs

### Server-Only Variables
- ❌ NEVER expose to browser
- Used in API routes and server components
- Examples: Service role keys, API secrets

### Auto-Set Variables
- Set automatically by hosting platform
- Don't manually configure these:
  - `NODE_ENV` (production/development)
  - `VERCEL_URL` (deployment URL)
  - `VERCEL_ENV` (production/preview/development)
  - `CI` (true in CI environments)

---

## ✅ Verification Checklist

After configuring environment variables:

- [ ] All **CRITICAL** variables are set in Azure/Vercel
- [ ] All **HIGH PRIORITY** variables needed for your features are set
- [ ] Sensitive variables are marked as secrets/hidden
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets are committed to git
- [ ] Test deployment succeeds
- [ ] Check logs for "undefined" environment variable warnings
- [ ] Test critical features (auth, file upload, email)

---

## 🐛 Troubleshooting

### "Missing environment variable" error in production:
1. Check Azure/Vercel dashboard - is the variable set?
2. Restart the application after adding variables
3. Check variable name spelling (case-sensitive)
4. Verify no trailing spaces in variable values

### Feature not working in production but works locally:
1. Compare `.env.local` with Azure/Vercel settings
2. Check if using production API keys (not test keys)
3. Verify callback URLs match production domain
4. Check Sentry for detailed error messages

### Build fails with environment errors:
1. Check `next.config.mjs` - is variable used at build time?
2. Add to Vercel as build-time variable if needed
3. Use fallback values: `process.env.VAR || 'fallback'`

---

## 📚 Additional Resources

- [Next.js Environment Variables Docs](https://nextjs.org/docs/basic-features/environment-variables)
- [Azure App Service Configuration](https://docs.microsoft.com/en-us/azure/app-service/configure-common)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Setup](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 📊 Summary by Priority

| Priority | Count | Must Have? | Examples |
|----------|-------|------------|----------|
| 🔴 Critical | 10 | YES | Supabase, JWT, Email |
| 🟠 High | 27 | For core features | AWS S3, Azure AI, Stripe |
| 🟡 Medium | 15 | For enhanced features | Marketing email, monitoring |
| 🟢 Optional | 21 | Nice to have | Social integrations, analytics |
| 💻 Local Only | 16 | Dev only | Port numbers, test configs |

**Total Production Variables: 57**  
**Total Variables: 73**

---

**Last Updated:** December 2025  
**Version:** 1.0
