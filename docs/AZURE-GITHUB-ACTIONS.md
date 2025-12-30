# Azure Web App Deployment - GitHub Actions

This document explains the existing GitHub Actions workflow for deploying to Azure App Service.

## Workflow File

`.github/workflows/main_greenchainz-platform.yml`

## Overview

This workflow automatically builds and deploys the Next.js application to Azure App Service whenever changes are pushed to the `main` branch.

## Workflow Steps

### 1. Build Job

- **Trigger**: Push to `main` branch or manual workflow dispatch
- **Environment**: Ubuntu latest with Node.js 20.x
- **Steps**:
  1. Checkout repository
  2. Install Node.js
  3. Install dependencies (`npm ci`)
  4. Build Next.js application (`npm run build`)
  5. Prepare standalone build folder
  6. Copy public assets and static files
  7. Create deployment zip
  8. Upload artifact for deployment

### 2. Deploy Job

- **Dependencies**: Requires build job to complete
- **Environment**: Production
- **Steps**:
  1. Download build artifact
  2. Deploy to Azure Web App using `azure/webapps-deploy@v2`

## Key Features

### Standalone Build

The workflow uses Next.js standalone output mode for optimized deployment:

```javascript
// next.config.mjs
output: 'standalone'
```

This creates a self-contained deployment package with:
- Minimal dependencies
- Fast cold starts
- Reduced package size
- All required Node modules included

### Build Preparation

```bash
# Copy public assets
cp -r public .next/standalone/public

# Copy static files
cp -r .next/static .next/standalone/.next/static

# Create deployment package
cd .next/standalone && zip -r ../../release.zip .
```

### Environment Variables in Build

Required environment variables are passed during the build:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY: ${{ secrets.NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY }}
  EPD_INTERNATIONAL_API_KEY: ${{ secrets.EPD_INTERNATIONAL_API_KEY }}
```

## Startup Configuration

**CRITICAL**: Azure App Service must be configured with the correct startup command:

```
node server.js
```

This is set in:
1. Azure Portal → App Service → Configuration → General Settings → Startup Command
2. Or via Azure CLI (see [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md))

## GitHub Secrets Required

### Azure Deployment Secret

- `AZUREAPPSERVICE_PUBLISHPROFILE_E984DF8E74C844D3B60259660D6FA8CC`
  - Download from Azure Portal: App Service → Deployment Center → Manage publish profile
  - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

### Environment Variables

Add all required environment variables as GitHub secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PUBLISHABLE_DEFAULT_KEY`
- `EPD_INTERNATIONAL_API_KEY`
- All other variables from `.env.example`

## Monitoring Deployments

### GitHub Actions

- View workflow runs: Repository → Actions tab
- Check logs for each step
- Review build artifacts

### Azure Portal

- Monitor deployments: App Service → Deployment Center → Logs
- View application logs: App Service → Log stream
- Check metrics: App Service → Monitoring → Metrics

## Troubleshooting

### Build Fails

**Check**:
- Node.js version (should be 20.x)
- Dependencies installation logs
- TypeScript errors (currently ignored via `ignoreBuildErrors: true`)

**Solution**:
- Review GitHub Actions logs
- Ensure all dependencies are in `package.json`
- Check for missing environment variables

### Deployment Fails

**Check**:
- Publish profile is valid and not expired
- Azure App Service is running
- Sufficient resources in App Service plan

**Solution**:
```bash
# Re-download publish profile
az webapp deployment list-publishing-profiles \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --xml
```

### Application Doesn't Start

**Check**:
- Startup command is set to `node server.js`
- All environment variables are configured in Azure App Service
- Standalone folder structure is correct

**Solution**:
```bash
# Verify startup command
az webapp config show \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --query "appCommandLine"

# Should return: "node server.js"
```

## Manual Deployment

To manually trigger a deployment:

1. Go to GitHub repository
2. Click **Actions** tab
3. Select **Build and deploy Node.js app to Azure Web App**
4. Click **Run workflow**
5. Select branch (main)
6. Click **Run workflow**

## Performance Optimization

### Current Configuration

- **Build Time**: ~3-5 minutes
- **Artifact Size**: ~150-200 MB (standalone build)
- **Upload Time**: ~30-60 seconds
- **Deployment Time**: ~1-2 minutes
- **Total Time**: ~5-8 minutes

### Optimization Tips

1. **Cache Dependencies**:
   ```yaml
   - uses: actions/setup-node@v3
     with:
       cache: 'npm'
   ```

2. **Parallel Jobs**: Build and test can run in parallel if separated

3. **Incremental Deployments**: Only deploy if tests pass

## Security Best Practices

1. **Never commit secrets**: Use GitHub Secrets for all sensitive data
2. **Rotate publish profile**: Regenerate every 90 days
3. **Limit workflow permissions**: Use minimal required permissions
4. **Review logs regularly**: Check for suspicious activity

## Next Steps

After successful deployment:

1. ✅ Verify application is running: `https://greenchainz-platform.azurewebsites.net`
2. ✅ Configure custom domain (if needed)
3. ✅ Set up Application Insights monitoring
4. ✅ Configure cron jobs via Azure Logic Apps
5. ✅ Enable auto-scaling rules
6. ✅ Set up budget alerts

## Related Documentation

- [AZURE-DEPLOYMENT.md](./AZURE-DEPLOYMENT.md) - Complete Azure setup guide
- [AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md) - Cron job configuration
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
