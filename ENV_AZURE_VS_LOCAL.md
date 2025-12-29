# Environment Variables: Azure vs Local Configuration

Quick reference for which environment variables go where.

---

## ☁️ AZURE APP SERVICE / VERCEL (Production)

Configure these 57 variables in your Azure App Service Configuration or Vercel Environment Variables dashboard.

### 🔴 CRITICAL - Must Have (10 variables)

```bash
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Security
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
CRON_SECRET=your-cron-secret

# URLs
NEXT_PUBLIC_BASE_URL=https://greenchainz.com
NEXTAUTH_URL=https://greenchainz.com

# Email (choose ONE)
RESEND_API_KEY=re_...
# OR
ZOHO_SMTP_PASS=your-password
```

### 🟠 HIGH PRIORITY - Core Features (27 variables)

```bash
# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-production
AWS_IMAGES_BUCKET=greenchainz-images
AWS_EPD_BUCKET=greenchainz-epd-documents
AWS_BACKUP_BUCKET=greenchainz-backups
S3_BUCKET_NAME=greenchainz-production

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://...openai.azure.com/
AZURE_OPENAI_KEY=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Content Understanding
AZURE_CONTENT_UNDERSTANDING_ENDPOINT=https://...
AZURE_CONTENT_UNDERSTANDING_KEY=...
AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID=...

# Azure Functions
AZURE_FUNCTIONS_BASE_URL=https://your-function-app.azurewebsites.net
AZURE_SCRAPER_FUNCTION_URL=https://...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ARCHITECT=price_...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_ARCHITECT_PRO=price_...
STRIPE_PRICE_SUPPLIER=price_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=greenchainz-production
SENTRY_AUTH_TOKEN=...
```

### 🟡 MEDIUM PRIORITY - Enhanced Features (15 variables)

```bash
# Email Services
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@greenchainz.com
RESEND_FROM_NAME=GreenChainz

ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=587
ZOHO_SMTP_USER=noreply@greenchainz.com
ZOHO_SMTP_PASS=...
ZOHO_FROM_EMAIL=noreply@greenchainz.com
ZOHO_FROM_NAME=GreenChainz
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_ACCOUNT_ID=...

MAILERLITE_API_KEY=...
MAILERLITE_FROM_EMAIL=newsletter@greenchainz.com
MAILERLITE_FROM_NAME=GreenChainz
MAILERLITE_AUTOMATION_BUYER_ONBOARDING=...
MAILERLITE_AUTOMATION_SUPPLIER_ONBOARDING=...
```

### 🟢 OPTIONAL - Additional Integrations (21 variables)

```bash
# Analytics & Support
NEXT_PUBLIC_INTERCOM_APP_ID=...
INTERCOM_ACCESS_TOKEN=...
INTERCOM_ACTION_SECRET=...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GA_ID=G-...

# Data Providers
EPD_INTERNATIONAL_API_KEY=...
EPD_API_KEY=...
EPD_API_URL=https://api.environdec.com
EC3_API_KEY=...
EC3_CLIENT_ID=...
EC3_CLIENT_SECRET=...

# Autodesk
AUTODESK_CLIENT_ID=...
AUTODESK_CLIENT_SECRET=...
AUTODESK_CALLBACK_URL=https://greenchainz.com/api/autodesk/callback
AUTODESK_SDA_API_URL=https://developer.api.autodesk.com

# LinkedIn
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_CALLBACK_URL=https://greenchainz.com/auth/linkedin/callback
LINKEDIN_ACCESS_TOKEN=...
LINKEDIN_AUTHOR_URN=urn:li:person:...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
FIRECRAWL_API_KEY=...

# AI Agent Microservices
AGENT_RFQ_MATCHING_URL=...
AGENT_CARBON_OPTIMIZER_URL=...
AGENT_COMPLIANCE_URL=...
AGENT_AUDITOR_URL=...
AGENT_PRICING_URL=...
```

---

## 💻 .env.local (Local Development Only)

These 16 variables should ONLY be in your local `.env.local` file. Do NOT add them to Azure/Vercel.

```bash
# Node Environment (auto-set in production)
NODE_ENV=development

# Local Server
PORT=3000
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Local Database (if testing locally)
MONGODB_URI=mongodb://localhost:27017/greenchainz
DATABASE_URL=postgresql://localhost:5432/greenchainz

# Test Email (Gmail for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@localhost

# Development Settings
NOTIFICATIONS_ENABLED=false

# OAuth Test Callbacks (localhost)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# Auto-set by platforms (don't configure)
VERCEL_URL=auto-set
VERCEL_ENV=auto-set
CI=auto-set
```

---

## 📋 Setup Steps

### For Azure App Service:

1. Go to Azure Portal → Your App Service
2. **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Add each variable from the "AZURE" section above
5. Save and restart

### For Vercel:

1. Go to Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add each variable from the "AZURE" section above
4. Select environments (Production, Preview, Development)
5. Redeploy

### For Local Development:

1. Create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add variables from the ".env.local" section

3. Add minimal production variables for testing:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-dev-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-key
   SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
   JWT_SECRET=local-dev-secret
   RESEND_API_KEY=re_test_key
   ```

---

## ✅ Quick Checklist

### For Production Deployment:
- [ ] All 10 CRITICAL variables set in Azure/Vercel
- [ ] All HIGH PRIORITY variables for features you use
- [ ] Sensitive variables marked as secrets
- [ ] No variables from ".env.local" section in Azure/Vercel

### For Local Development:
- [ ] `.env.local` file created
- [ ] Local development variables added
- [ ] Minimal production variables for testing
- [ ] `.env.local` in `.gitignore`

---

See `ENVIRONMENT_VARIABLES_GUIDE.md` for detailed descriptions and troubleshooting.
