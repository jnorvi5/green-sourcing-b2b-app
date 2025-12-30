# Vercel to Azure Migration Summary

This document provides a quick overview of the migration from Vercel to Azure App Service for the GreenChainz B2B marketplace.

## What Was Changed

### 1. Removed Vercel-Specific Files
- ✅ `.vercel/` directory (Vercel project configuration)
- ✅ `vercel.json` (Vercel deployment configuration)
- ✅ `.vercelignore` (Vercel deployment ignore rules)

### 2. Updated Configuration Files

#### `package.json`
**Removed**:
- `deploy:vercel` script
- `deploy:preview` script
- `vercel-build` script

**Kept**:
- Standard Next.js scripts (`dev`, `build`, `start`)
- All existing test and lint scripts

#### `next.config.mjs`
**Changed**:
- Content Security Policy (CSP): `https://*.vercel.app` → `https://*.azurewebsites.net`

**Note**: All security headers remain in place and continue to work on Azure.

#### `lib/env.ts`
**Changed**:
- Environment detection: `VERCEL_ENV === 'production'` → `NODE_ENV === 'production'`

#### Sentry Configuration Files
**Changed** (`sentry.client.config.ts`):
- Environment: `NEXT_PUBLIC_VERCEL_ENV` → `NODE_ENV`
- Release: `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` → `GITHUB_SHA`

### 3. Updated GitHub Workflows

**Disabled** (renamed to `.disabled`):
- `.github/workflows/vercel-deploy.yml`
- `.github/workflows/deploy-production.yml`

**Active** (no changes needed):
- `.github/workflows/main_greenchainz-platform.yml` - Azure deployment

### 4. Updated Infrastructure Configuration

#### AWS S3 CORS (`aws/cloudformation/s3-buckets.yaml`, `terraform/aws/s3.tf`)
**Changed**:
- Allowed origins: `https://*.vercel.app` → `https://*.azurewebsites.net`

#### Azure Storage CORS (`azure-infrastructure/DEPLOYMENT_GUIDE.md`)
**Changed**:
- Allowed origins: `https://*.vercel.app` → `https://*.azurewebsites.net`

### 5. Updated Documentation

#### Main Documentation
- `README.md`: Updated deployment platform from Vercel to Azure
- `.github/copilot-instructions.md`: Updated deployment platform reference

#### New Azure Documentation
- `docs/AZURE-DEPLOYMENT.md` - Complete deployment guide
- `docs/AZURE-CRON-JOBS.md` - Cron job configuration with Azure Logic Apps
- `docs/AZURE-GITHUB-ACTIONS.md` - GitHub Actions workflow documentation

#### Environment Variables
- `.env.example`: Added Azure-specific variables section

### 6. Updated API Route Comments

**Files**:
- `app/api/cron/sync-mailerlite/route.ts`
- `app/api/cron/generate-quarterly-reports/route.ts`

**Changed**:
- Comments now reference Azure hosting instead of Vercel Cron
- Authorization logic unchanged (uses `CRON_SECRET`)

## What Didn't Change

### ✅ Application Code
- No changes to business logic
- No changes to components or pages
- No changes to API routes (except comments)
- No changes to database queries or server actions

### ✅ Next.js Configuration
- Still uses standalone output mode
- Still has same build process
- Still has same optimization settings
- All webpack configurations unchanged

### ✅ Dependencies
- No packages added or removed
- All existing functionality preserved

### ✅ Security Headers
- All security headers still configured in `next.config.mjs`
- CSP, HSTS, X-Frame-Options, etc. all unchanged
- Only domain references updated

### ✅ Build Process
- `npm run build` still works the same way
- Creates `.next/standalone` folder
- Includes all dependencies
- Production-ready output

## Azure-Specific Requirements

### Environment Variables (Set in Azure App Service)

All environment variables from `.env.example` must be configured in Azure:

```bash
az webapp config appsettings set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --settings \
    NODE_ENV=production \
    NEXT_PUBLIC_SUPABASE_URL="..." \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
    # ... (see AZURE-DEPLOYMENT.md for complete list)
```

### Startup Command

**CRITICAL**: Azure App Service must use this startup command:

```
node server.js
```

Set via:
- Azure Portal: Configuration → General settings → Startup Command
- Azure CLI: `az webapp config set --startup-file "node server.js"`

### Cron Jobs

Vercel Cron jobs need to be migrated to Azure Logic Apps or Azure Functions Timer Triggers.

See [docs/AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md) for detailed instructions.

**Existing Cron Jobs**:
1. MailerLite Sync - Daily at 3 AM UTC
2. Quarterly Reports - Jan 1, Apr 1, Jul 1, Oct 1

## Deployment Workflow

### Current Setup (Automated)

1. **Push to `main` branch** → Triggers GitHub Actions workflow
2. **Build** → Creates Next.js standalone build
3. **Deploy** → Uploads to Azure App Service via publish profile
4. **Start** → Azure runs `node server.js`

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy to Azure
cd .next/standalone
zip -r ../../release.zip .
az webapp deployment source config-zip \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --src ../../release.zip
```

## Testing the Migration

### 1. Verify Application Starts

```bash
# Check application logs
az webapp log tail \
  --name greenchainz-platform \
  --resource-group greenchainz-prod
```

### 2. Test Key Endpoints

```bash
# Test home page
curl https://greenchainz-platform.azurewebsites.net/

# Test API health (if implemented)
curl https://greenchainz-platform.azurewebsites.net/api/health

# Test authentication
curl https://greenchainz-platform.azurewebsites.net/auth/login
```

### 3. Verify Environment Variables

```bash
# List all app settings
az webapp config appsettings list \
  --name greenchainz-platform \
  --resource-group greenchainz-prod
```

### 4. Check Security Headers

```bash
# Verify security headers in response
curl -I https://greenchainz-platform.azurewebsites.net/
```

Expected headers:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`

## Rollback Plan (If Needed)

If issues arise, you can temporarily rollback by:

1. **Re-enable Vercel workflows**:
   ```bash
   mv .github/workflows/vercel-deploy.yml.disabled .github/workflows/vercel-deploy.yml
   ```

2. **Restore Vercel configuration**:
   - Restore `vercel.json` from git history
   - Restore `.vercelignore` from git history

3. **Update environment variables**:
   - Revert CSP changes in `next.config.mjs`
   - Revert environment detection in `lib/env.ts`

However, the Azure deployment is **already active** and working, so this rollback should not be necessary.

## Post-Migration Checklist

- [ ] Verify Azure App Service is running
- [ ] Test all critical user flows (auth, RFQ, search)
- [ ] Configure Azure Logic Apps for cron jobs
- [ ] Set up Application Insights monitoring
- [ ] Configure custom domain (if needed)
- [ ] Set up SSL certificate
- [ ] Configure auto-scaling rules
- [ ] Set up budget alerts
- [ ] Update DNS records (if switching from Vercel domain)
- [ ] Monitor first 24 hours for errors
- [ ] Archive Vercel deployment (optional)

## Monitoring and Support

### Azure Resources
- **App Service**: greenchainz-platform
- **Resource Group**: greenchainz-prod
- **Region**: East US
- **Plan**: B2 (or as configured)

### Monitoring Tools
- Azure Portal: Real-time metrics and logs
- Application Insights: Detailed telemetry
- GitHub Actions: Deployment history

### Documentation
- [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md) - Complete setup guide
- [AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md) - Cron job configuration
- [AZURE-GITHUB-ACTIONS.md](./AZURE-GITHUB-ACTIONS.md) - CI/CD workflow

## Common Questions

### Q: Will my existing data be affected?
**A**: No. The database (Supabase) and all external services remain unchanged.

### Q: Do I need to reconfigure environment variables?
**A**: Yes, in Azure App Service Configuration. See [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md).

### Q: What happens to Vercel cron jobs?
**A**: They need to be migrated to Azure Logic Apps. See [AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md).

### Q: Can I still use Vercel for preview deployments?
**A**: Yes, but you'd need to maintain separate configurations. Not recommended.

### Q: How do I view application logs?
**A**: Use Azure Portal Log Stream or Azure CLI:
```bash
az webapp log tail --name greenchainz-platform --resource-group greenchainz-prod
```

### Q: What if the build fails?
**A**: Check GitHub Actions logs and ensure all secrets are configured correctly.

## Success Criteria

✅ **Migration is successful when**:
1. Application loads at Azure URL
2. All authentication flows work
3. Database operations succeed
4. External API integrations work
5. Cron jobs are configured and running
6. No errors in Azure logs
7. Security headers are present
8. Performance is acceptable

## Contact

For migration issues or questions:
- Email: founder@greenchainz.com
- Repository: https://github.com/jnorvi5/green-sourcing-b2b-app
- Azure Support: https://portal.azure.com → Help + support
