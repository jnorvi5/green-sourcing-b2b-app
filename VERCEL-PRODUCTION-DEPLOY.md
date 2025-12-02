# GreenChainz Vercel Production Deployment Guide

This document provides step-by-step instructions for deploying the GreenChainz Next.js application to Vercel with production configuration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Project Setup](#vercel-project-setup)
3. [Environment Variables Configuration](#environment-variables-configuration)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Cloudflare DNS Configuration](#cloudflare-dns-configuration)
6. [Deployment Verification](#deployment-verification)
7. [CI/CD Pipeline Overview](#cicd-pipeline-overview)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Monitoring and Logs](#monitoring-and-logs)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository pushed: `jnorvi5/green-sourcing-b2b-app`
- [ ] Vercel account (free tier is sufficient for MVP)
- [ ] Supabase project with credentials
- [ ] MongoDB Atlas cluster configured
- [ ] AWS S3 bucket for file storage
- [ ] Azure AD B2C configured for authentication
- [ ] Domain registered (greenchainz.com)
- [ ] Cloudflare account (if using Cloudflare DNS)

---

## Vercel Project Setup

### Step 1: Import Repository

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Add New** → **Project**
3. Select **Import Git Repository**
4. Authorize Vercel to access your GitHub account
5. Find and select `green-sourcing-b2b-app`
6. Click **Import**

### Step 2: Configure Project Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `.` (root of repository) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` |
| **Node.js Version** | 20.x |

### Step 3: Initial Deployment

1. Add essential environment variables (see next section)
2. Click **Deploy**
3. Wait for the build to complete (~2-5 minutes)

---

## Environment Variables Configuration

Navigate to **Project Settings** → **Environment Variables** in Vercel Dashboard.

### Required Variables (Grouped by Service)

#### Database (Supabase)

| Variable | Description | Scope |
|----------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key | Production only (sensitive) |

#### Authentication (NextAuth.js + Azure AD)

| Variable | Description | Scope |
|----------|-------------|-------|
| `NEXTAUTH_URL` | `https://greenchainz.com` | Production |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Production (sensitive) |
| `AZURE_AD_CLIENT_ID` | Azure AD B2C client ID | Production |
| `AZURE_AD_CLIENT_SECRET` | Azure AD B2C client secret | Production (sensitive) |
| `AZURE_AD_TENANT_ID` | Azure AD B2C tenant ID | Production |

#### Email (Zoho Mail + MailerLite)

| Variable | Description | Scope |
|----------|-------------|-------|
| `ZOHO_SMTP_HOST` | `smtp.zoho.com` | Production |
| `ZOHO_SMTP_PORT` | `587` | Production |
| `ZOHO_SMTP_USER` | Zoho email address | Production |
| `ZOHO_SMTP_PASS` | Zoho app password | Production (sensitive) |
| `ZOHO_FROM_EMAIL` | Sender email address | Production |
| `MAILERLITE_API_KEY` | MailerLite API key | Production (sensitive) |

#### Payments (Stripe)

| Variable | Description | Scope |
|----------|-------------|-------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` for production | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` for production | Production (sensitive) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Production (sensitive) |

#### Integrations

| Variable | Description | Scope |
|----------|-------------|-------|
| `AUTODESK_CLIENT_ID` | Autodesk APS client ID | Production |
| `AUTODESK_CLIENT_SECRET` | Autodesk APS secret | Production (sensitive) |
| `AUTODESK_CALLBACK_URL` | `https://greenchainz.com/api/autodesk/callback` | Production |
| `EPD_INTL_API_KEY` | EPD International API key | Production |
| `EC3_API_KEY` | Building Transparency EC3 key | Production |
| `NEXT_PUBLIC_INTERCOM_APP_ID` | Intercom App ID | Production, Preview |
| `INTERCOM_API_KEY` | Intercom API key | Production (sensitive) |

#### AWS S3

| Variable | Description | Scope |
|----------|-------------|-------|
| `AWS_ACCESS_KEY_ID` | IAM access key | Production (sensitive) |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | Production (sensitive) |
| `AWS_REGION` | `us-east-1` | Production |
| `AWS_BUCKET_NAME` | S3 bucket name | Production |

#### MongoDB Atlas

| Variable | Description | Scope |
|----------|-------------|-------|
| `MONGODB_URI` | MongoDB connection string | Production (sensitive) |

#### Azure AI

| Variable | Description | Scope |
|----------|-------------|-------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | Production |
| `AZURE_OPENAI_KEY` | Azure OpenAI API key | Production (sensitive) |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployment name (e.g., `gpt-4o`) | Production |

#### Security

| Variable | Description | Scope |
|----------|-------------|-------|
| `CRON_SECRET` | Secret for cron job authentication | Production (sensitive) |

### Setting Variables in Vercel

1. Navigate to **Project Settings** → **Environment Variables**
2. Click **Add New**
3. Enter **Name** (key) and **Value**
4. Select appropriate **Environments** (Production, Preview, Development)
5. Mark sensitive variables as **Sensitive** (encrypted at rest)
6. Click **Save**

> **Important:** After adding or modifying environment variables, you must redeploy for changes to take effect.

---

## Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Go to **Project Settings** → **Domains**
2. Click **Add**
3. Enter `greenchainz.com`
4. Click **Add**

### Step 2: Add www Subdomain (Optional)

1. Click **Add** again
2. Enter `www.greenchainz.com`
3. Configure redirect: `www.greenchainz.com` → `greenchainz.com`

### Step 3: Verify DNS Configuration

Vercel will display required DNS records. Configure these in your DNS provider.

---

## Cloudflare DNS Configuration

If using Cloudflare for DNS management:

### Step 1: Add DNS Records

In Cloudflare Dashboard → DNS → Records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | @ | cname.vercel-dns.com | DNS only (not proxied) |
| CNAME | www | cname.vercel-dns.com | DNS only (not proxied) |

> **Important:** Disable Cloudflare proxy (orange cloud) for Vercel domains. Vercel handles SSL and CDN.

### Step 2: SSL/TLS Settings

In Cloudflare → SSL/TLS:
- Set encryption mode to **Full** (not Full Strict)
- Vercel will provision its own SSL certificate

### Step 3: Verify Configuration

Wait 5-10 minutes for DNS propagation. Check:
- Vercel Dashboard shows green checkmark for domain
- `https://greenchainz.com` loads correctly
- SSL certificate is valid

---

## Deployment Verification

### Post-Deployment Checklist

- [ ] Homepage loads without errors (`https://greenchainz.com`)
- [ ] SSL certificate is valid (padlock icon in browser)
- [ ] API routes respond correctly (`/api/health`)
- [ ] Authentication flow works (login/logout)
- [ ] Database connection successful (data loads)
- [ ] Email sending works (test transactional email)
- [ ] File uploads work (S3 integration)
- [ ] Cron jobs are scheduled (`/api/cron/sync-mailerlite`)
- [ ] Intercom widget loads
- [ ] No console errors in browser DevTools

### Health Check Endpoints

| Endpoint | Expected Response |
|----------|-------------------|
| `/api/health` | `{ "status": "ok" }` |
| `/api/autodesk/status` | Autodesk connection status |

### Verify Environment Variables

In browser console (for public variables):
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(process.env.NEXT_PUBLIC_INTERCOM_APP_ID);
```

---

## CI/CD Pipeline Overview

### Automatic Deployments

The repository includes `.github/workflows/vercel-deploy.yml` which handles:

| Trigger | Action |
|---------|--------|
| Push to `main` | Production deployment |
| Pull request to `main` | Preview deployment with unique URL |

### Pipeline Stages

1. **Type Check** - Runs TypeScript compiler check
2. **Build Verification** - Builds the Next.js application
3. **Deploy Preview** - Deploys PR changes to preview URL (PRs only)
4. **Deploy Production** - Deploys to production (main branch only)

### Required GitHub Secrets

Configure in GitHub → Repository Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (from Vercel Account Settings → Tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID (from Project Settings → General) |
| `VERCEL_PROJECT_ID` | Vercel project ID (from Project Settings → General) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL for build-time checks |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for build-time checks |

### Getting Vercel Credentials

1. **VERCEL_TOKEN**: 
   - Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
   - Create new token with scope "Full Account"

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   - Run locally: `npx vercel link`
   - Check `.vercel/project.json` for IDs
   - Or find in Vercel Dashboard → Project Settings → General

---

## Rollback Procedures

### Instant Rollback via Vercel Dashboard

1. Go to **Deployments** tab in Vercel
2. Find the last working deployment
3. Click **...** menu → **Promote to Production**
4. Confirm the rollback

### Rollback via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-id>
```

### Rollback via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main
# Automatic redeploy will trigger
```

---

## Troubleshooting

### Build Failures

**Error: Module not found**
- Check `package.json` dependencies are correct
- Run `npm install` locally and commit `package-lock.json`

**Error: Type errors**
- TypeScript errors are currently bypassed (`ignoreBuildErrors: true`)
- For strict builds, fix type errors and set to `false`

### Environment Variable Issues

**Symptom: API calls fail or return undefined**
1. Verify variable is set in Vercel Dashboard
2. Check variable scope matches deployment (Production vs Preview)
3. Redeploy after adding/modifying variables
4. Ensure sensitive variables are marked correctly

### Domain Not Working

1. Check DNS propagation: `dig greenchainz.com`
2. Verify Cloudflare proxy is disabled
3. Wait up to 48 hours for full DNS propagation
4. Check Vercel Dashboard for domain status

### Preview Deployments Not Working

1. Verify `VERCEL_TOKEN` is valid
2. Check GitHub Actions logs for errors
3. Ensure repository has correct permissions

---

## Monitoring and Logs

### Vercel Dashboard

- **Deployments**: Build history and status
- **Analytics**: Page views, performance metrics (Pro plan)
- **Logs**: Real-time function logs
- **Usage**: Bandwidth and serverless function execution

### Viewing Logs

1. Go to **Project** → **Logs** tab
2. Filter by:
   - Deployment (Production, Preview)
   - Time range
   - Log level (Error, Warning, Info)

### Setting Up Alerts

1. Go to **Project Settings** → **Integrations**
2. Add Slack/Discord webhook for deployment notifications
3. Configure email notifications for build failures

---

## Cost Estimation

### Vercel Free Tier (Hobby)

- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function execution (limited)
- ✅ Automatic HTTPS
- ⚠️ 1 concurrent build

### Upgrade to Pro ($20/month) When

- Need team collaboration
- Exceed bandwidth limits
- Require advanced analytics
- Need priority support
- Multiple concurrent builds

---

## Quick Reference Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs <deployment-url>

# List deployments
vercel ls

# Pull environment variables
vercel env pull
```

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Repository Issues](https://github.com/jnorvi5/green-sourcing-b2b-app/issues)

---

**Last Updated:** December 2024
