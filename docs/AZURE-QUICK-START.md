# Azure Quick Setup Guide

**Quick reference for setting up GreenChainz on Azure App Service**

## Prerequisites Checklist

- [ ] Azure subscription active
- [ ] Azure CLI installed (`az --version`)
- [ ] Node.js 20.x installed
- [ ] GitHub repository access
- [ ] All API keys ready (Supabase, Azure OpenAI, etc.)

## 1. Critical Startup Configuration ⚠️

**THE MOST IMPORTANT STEP** - Set the correct startup command:

### Via Azure Portal
1. Go to **App Service** → **Configuration** → **General settings**
2. Set **Startup Command**: `node server.js`
3. Click **Save** and **Continue**

### Via Azure CLI
```bash
az webapp config set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --startup-file "node server.js"
```

**Why?** The Next.js standalone build creates a `server.js` file that runs the app. Without this command, Azure will try to use `npm start` which won't work.

## 2. Essential Environment Variables

Set these in Azure Portal → Configuration → Application settings:

### Required (App won't start without these)
```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Azure-specific
```bash
WEBSITE_NODE_DEFAULT_VERSION=20.x
WEBSITE_RUN_FROM_PACKAGE=1
```

### Authentication
```bash
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars
```

### Quick CLI Command (Replace values)
```bash
az webapp config appsettings set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=20.x \
    WEBSITE_RUN_FROM_PACKAGE=1 \
    NEXT_PUBLIC_SUPABASE_URL="YOUR_URL" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_KEY" \
    SUPABASE_SERVICE_ROLE_KEY="YOUR_KEY" \
    JWT_SECRET="YOUR_SECRET" \
    SESSION_SECRET="YOUR_SECRET"
```

## 3. GitHub Actions Setup

### Download Publish Profile
```bash
az webapp deployment list-publishing-profiles \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --xml
```

### Add to GitHub Secrets
1. Copy the XML output
2. Go to GitHub: **Settings** → **Secrets and variables** → **Actions**
3. Create secret: `AZUREAPPSERVICE_PUBLISHPROFILE_E984DF8E74C844D3B60259660D6FA8CC`
4. Paste the XML content

### Add Environment Variable Secrets
Also add these as GitHub secrets (needed during build):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY`
- `EPD_INTERNATIONAL_API_KEY`

## 4. Deploy!

### Automatic (Push to main)
```bash
git push origin main
```

GitHub Actions will automatically build and deploy.

### Manual Trigger
1. Go to GitHub → **Actions**
2. Select **Build and deploy Node.js app to Azure Web App**
3. Click **Run workflow** → **Run workflow**

## 5. Verify Deployment

### Check if app is running
```bash
curl https://greenchainz-platform.azurewebsites.net/
```

### View logs
```bash
az webapp log tail \
  --name greenchainz-platform \
  --resource-group greenchainz-prod
```

### Check in browser
Open: https://greenchainz-platform.azurewebsites.net

## 6. Setup Cron Jobs (After Deployment Works)

### Option 1: Azure Logic Apps (Recommended)

**For MailerLite Sync** (Daily at 3 AM UTC):
1. Azure Portal → **Create a resource** → **Logic App**
2. Name: `greenchainz-cron-mailerlite`
3. Add **Recurrence** trigger: Daily at 03:00 UTC
4. Add **HTTP** action:
   - Method: GET
   - URI: `https://greenchainz-platform.azurewebsites.net/api/cron/sync-mailerlite`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

**For Quarterly Reports** (Jan 1, Apr 1, Jul 1, Oct 1):
1. Create another Logic App: `greenchainz-cron-quarterly`
2. Recurrence: Quarterly
3. HTTP action to `/api/cron/generate-quarterly-reports`

### Option 2: Test Manually First
```bash
# Set your CRON_SECRET (get from Azure App Settings)
CRON_SECRET="your-secret"

# Test MailerLite sync
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://greenchainz-platform.azurewebsites.net/api/cron/sync-mailerlite

# Test quarterly reports
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://greenchainz-platform.azurewebsites.net/api/cron/generate-quarterly-reports
```

## Troubleshooting Quick Fixes

### Problem: App doesn't start
**Check**:
```bash
# Verify startup command
az webapp config show --name greenchainz-platform --resource-group greenchainz-prod --query "appCommandLine"
```
**Should return**: `"node server.js"`

**Fix**:
```bash
az webapp config set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --startup-file "node server.js"
```

### Problem: "Cannot find module" errors
**Cause**: Missing environment variables during build

**Fix**: Add all required env vars to GitHub Secrets

### Problem: 500 errors on all routes
**Cause**: Database connection issues

**Check**: Verify Supabase credentials in Azure App Settings

### Problem: Build succeeds but app shows errors
**Check logs**:
```bash
az webapp log tail --name greenchainz-platform --resource-group greenchainz-prod
```

## Performance Tips

### 1. Enable Application Insights
```bash
az monitor app-insights component create \
  --app greenchainz-insights \
  --location eastus \
  --resource-group greenchainz-prod \
  --application-type web
```

### 2. Enable HTTPS Only
```bash
az webapp update \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --https-only true
```

### 3. Scale Up (if needed)
```bash
# Upgrade to P1V2 (better performance)
az appservice plan update \
  --name greenchainz-plan \
  --resource-group greenchainz-prod \
  --sku P1V2
```

## Complete Documentation

For detailed information, see:
- **[AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md)** - Full deployment guide
- **[AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md)** - Cron job setup details
- **[AZURE-GITHUB-ACTIONS.md](./AZURE-GITHUB-ACTIONS.md)** - CI/CD workflow docs
- **[MIGRATION-SUMMARY.md](./MIGRATION-SUMMARY.md)** - What changed from Vercel

## Quick Commands Reference

```bash
# View app logs
az webapp log tail --name greenchainz-platform --resource-group greenchainz-prod

# List environment variables
az webapp config appsettings list --name greenchainz-platform --resource-group greenchainz-prod

# Restart app
az webapp restart --name greenchainz-platform --resource-group greenchainz-prod

# Check app status
az webapp show --name greenchainz-platform --resource-group greenchainz-prod --query "state"

# Download logs
az webapp log download --name greenchainz-platform --resource-group greenchainz-prod --log-file logs.zip

# View deployment history
az webapp deployment list --name greenchainz-platform --resource-group greenchainz-prod
```

## Success Checklist

After setup, verify:
- [ ] App loads at https://greenchainz-platform.azurewebsites.net
- [ ] No errors in Azure logs
- [ ] Authentication works (login/signup)
- [ ] Database operations work (create/read data)
- [ ] Cron jobs are scheduled (if set up)
- [ ] Security headers present (`curl -I https://...`)
- [ ] GitHub Actions deployment successful

## Next Steps

1. **Custom Domain**: Configure your domain to point to Azure
2. **SSL Certificate**: Enable HTTPS with custom domain
3. **Auto-scaling**: Set up rules based on CPU/memory
4. **Monitoring**: Configure Application Insights dashboards
5. **Alerts**: Set up email alerts for errors and downtime
6. **Backup**: Configure automated backups

## Need Help?

- **Azure Status**: https://status.azure.com/
- **Azure Support**: https://portal.azure.com → Help + support
- **Documentation**: See the docs listed above
- **Contact**: founder@greenchainz.com
