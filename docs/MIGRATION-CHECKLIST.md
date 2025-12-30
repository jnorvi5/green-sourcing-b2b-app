# Vercel to Azure Migration Checklist

**Use this checklist to ensure all migration steps are complete.**

## Pre-Migration Verification ✅

- [x] Azure App Service already deployed
- [x] GitHub Actions workflow already configured
- [x] Application already running on Azure
- [x] Database (Supabase) unchanged and working

## Code Changes ✅

### Configuration Files
- [x] Removed `.vercel/` directory
- [x] Removed `vercel.json`
- [x] Removed `.vercelignore`
- [x] Updated `package.json` (removed Vercel scripts)
- [x] Updated `next.config.mjs` (CSP domains)
- [x] Updated `lib/env.ts` (environment detection)
- [x] Updated `sentry.client.config.ts` (environment variables)

### Code References
- [x] Removed `vercel.app` references from CSP
- [x] Removed `VERCEL_ENV` checks
- [x] Removed `NEXT_PUBLIC_VERCEL_*` variables
- [x] Updated cron job comments
- [x] Updated CORS configurations (S3, Azure Storage)

### GitHub Workflows
- [x] Disabled `vercel-deploy.yml`
- [x] Disabled `deploy-production.yml`
- [x] Kept `main_greenchainz-platform.yml` active
- [x] No changes needed to Azure workflow

## Documentation ✅

### Updated Documentation
- [x] `README.md` - Reflects Azure hosting
- [x] `.github/copilot-instructions.md` - Updated deployment platform
- [x] `.env.example` - Added Azure variables

### New Documentation
- [x] `docs/AZURE-DEPLOYMENT.md` - Complete setup guide
- [x] `docs/AZURE-CRON-JOBS.md` - Cron job configuration
- [x] `docs/AZURE-GITHUB-ACTIONS.md` - CI/CD documentation
- [x] `docs/AZURE-QUICK-START.md` - Quick reference
- [x] `docs/MIGRATION-SUMMARY.md` - Overview of changes
- [x] `docs/MIGRATION-CHECKLIST.md` - This file

### Deployment Scripts
- [x] Created `scripts/deploy-azure.sh` (Linux/Mac)
- [x] Created `scripts/deploy-azure.ps1` (Windows)
- [x] Renamed `scripts/deploy-vercel.ps1` to `.legacy`

## Infrastructure Updates ✅

### Azure Storage
- [x] Updated CORS to use `*.azurewebsites.net`
- [x] Removed `*.vercel.app` from allowed origins

### AWS S3
- [x] Updated CloudFormation template CORS
- [x] Updated Terraform configuration CORS
- [x] Changed `*.vercel.app` to `*.azurewebsites.net`

## Post-Migration Tasks

### Immediate (Do Now)
- [ ] Verify Azure App Service startup command: `node server.js`
  ```bash
  az webapp config show --name greenchainz-platform --resource-group greenchainz-prod --query "appCommandLine"
  ```
- [ ] Verify all environment variables in Azure App Service
  ```bash
  az webapp config appsettings list --name greenchainz-platform --resource-group greenchainz-prod
  ```
- [ ] Test application loads: https://greenchainz-platform.azurewebsites.net
- [ ] Test authentication (login/signup)
- [ ] Test database operations (create/read data)
- [ ] Check Azure logs for errors
  ```bash
  az webapp log tail --name greenchainz-platform --resource-group greenchainz-prod
  ```

### Within 24 Hours
- [ ] Set up Azure Logic Apps for MailerLite sync cron job
- [ ] Set up Azure Logic Apps for quarterly reports cron job
- [ ] Test cron jobs manually
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://greenchainz-platform.azurewebsites.net/api/cron/sync-mailerlite
  ```
- [ ] Configure Application Insights (if not already done)
- [ ] Set up email alerts for errors
- [ ] Monitor first 24 hours of logs

### Within 1 Week
- [ ] Configure custom domain (if needed)
- [ ] Set up SSL certificate for custom domain
- [ ] Configure auto-scaling rules
- [ ] Set up budget alerts
- [ ] Test all critical user flows
- [ ] Update DNS records (if switching from Vercel domain)

### Optional (As Needed)
- [ ] Archive old Vercel project
- [ ] Cancel Vercel subscription (if no longer needed)
- [ ] Remove Vercel secrets from GitHub
- [ ] Update documentation links (if external)
- [ ] Notify team of new deployment process

## Validation Checks

### Application Health
Run these checks to verify everything works:

```bash
# 1. Check app is running
curl -I https://greenchainz-platform.azurewebsites.net/

# 2. Verify security headers
curl -I https://greenchainz-platform.azurewebsites.net/ | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"

# 3. Test API endpoint
curl https://greenchainz-platform.azurewebsites.net/api/health

# 4. Check Azure logs
az webapp log tail --name greenchainz-platform --resource-group greenchainz-prod
```

### Environment Variables
Verify critical environment variables:

```bash
az webapp config appsettings list \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --query "[?name=='NODE_ENV' || name=='NEXT_PUBLIC_SUPABASE_URL' || name=='CRON_SECRET'].{Name:name, Value:value}" \
  --output table
```

### Startup Configuration
```bash
az webapp config show \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --query "{StartupCommand:appCommandLine, NodeVersion:linuxFxVersion}" \
  --output table
```

Expected output:
- StartupCommand: `node server.js`
- NodeVersion: Contains `NODE|20`

## Rollback Procedure (If Needed)

**If critical issues arise**, you can rollback by:

1. **Re-enable Vercel workflows**:
   ```bash
   cd .github/workflows
   mv vercel-deploy.yml.disabled vercel-deploy.yml
   mv deploy-production.yml.disabled deploy-production.yml
   ```

2. **Restore Vercel configuration**:
   ```bash
   git revert HEAD~3..HEAD  # Revert last 3 commits
   git push origin main
   ```

3. **Redeploy to Vercel**:
   - Commit will trigger Vercel deployment
   - Or manually: `npm run deploy:vercel`

**Note**: Rollback should be unnecessary as Azure deployment is already working.

## Success Criteria

✅ **Migration is successful when all of these are true**:

1. Application loads at Azure URL
2. No errors in Azure logs (past 1 hour)
3. Authentication works (login/signup)
4. Database operations work (queries succeed)
5. All API endpoints respond correctly
6. Security headers present in responses
7. GitHub Actions deploy successfully
8. Cron jobs are scheduled (or tested manually)
9. Team can deploy using new workflow
10. Documentation is clear and accessible

## Known Issues / Limitations

### Pre-existing Issues (Not Related to Migration)
- TypeScript type errors (already ignored in build)
- Some lint warnings (already present)

### Migration-specific Notes
- **Cron jobs**: Need to be configured in Azure Logic Apps (not automatic like Vercel Cron)
- **Preview deployments**: GitHub PR previews need separate setup (optional)
- **Edge runtime**: Ensure edge runtime compatibility if using edge routes
- **Cold starts**: First request after idle may be slower than Vercel

## Support Resources

### Documentation
- [AZURE-QUICK-START.md](./AZURE-QUICK-START.md) - Fast setup
- [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md) - Complete guide
- [AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md) - Scheduled tasks
- [MIGRATION-SUMMARY.md](./MIGRATION-SUMMARY.md) - What changed

### Azure Resources
- Azure Portal: https://portal.azure.com
- Azure Status: https://status.azure.com
- Azure CLI Docs: https://docs.microsoft.com/cli/azure/
- App Service Docs: https://docs.microsoft.com/azure/app-service/

### GitHub
- Actions Logs: https://github.com/jnorvi5/green-sourcing-b2b-app/actions
- Workflow File: `.github/workflows/main_greenchainz-platform.yml`

### Contact
- Email: founder@greenchainz.com
- Repository Issues: https://github.com/jnorvi5/green-sourcing-b2b-app/issues

## Completion Sign-off

**Migration completed by**: _________________
**Date**: _________________
**Verified by**: _________________
**Notes**: _________________

---

**Status**: ✅ Code migration complete. Awaiting post-migration tasks.
