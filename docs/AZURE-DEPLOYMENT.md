# Azure Deployment Guide for GreenChainz

This guide provides comprehensive instructions for deploying and managing the GreenChainz B2B marketplace on Azure App Service.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Azure Setup](#initial-azure-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Methods](#deployment-methods)
5. [Cron Jobs Configuration](#cron-jobs-configuration)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Azure subscription with active credits
- Azure CLI installed (`az --version` to verify)
- Node.js 20.x installed
- GitHub repository access
- All required API keys (Supabase, Azure OpenAI, etc.)

## Initial Azure Setup

### 1. Create Resource Group

```bash
az group create \
  --name greenchainz-prod \
  --location eastus \
  --tags Environment=Production Project=GreenChainz
```

### 2. Create App Service Plan

```bash
az appservice plan create \
  --name greenchainz-plan \
  --resource-group greenchainz-prod \
  --location eastus \
  --sku B2 \
  --is-linux
```

### 3. Create Web App

```bash
az webapp create \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --plan greenchainz-plan \
  --runtime "NODE:20-lts"
```

### 4. Configure Startup Command

**CRITICAL**: Set the startup command to use the Next.js standalone build:

```bash
az webapp config set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --startup-file "node server.js"
```

Or via Azure Portal:
1. Navigate to **App Service** → **Configuration** → **General settings**
2. Set **Startup Command**: `node server.js`
3. Click **Save**

## Environment Variables

### Configure via Azure Portal

1. Go to Azure Portal → App Service → **Configuration** → **Application settings**
2. Click **New application setting** for each variable
3. Click **Save** after adding all variables

### Configure via Azure CLI

```bash
az webapp config appsettings set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --settings \
    NODE_ENV=production \
    WEBSITE_NODE_DEFAULT_VERSION=20.x \
    WEBSITE_RUN_FROM_PACKAGE=1 \
    NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
    SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
    AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/" \
    AZURE_OPENAI_KEY="your-api-key" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o" \
    CRON_SECRET="your-random-secure-secret" \
    JWT_SECRET="your-jwt-secret" \
    SESSION_SECRET="your-session-secret" \
    AWS_ACCESS_KEY_ID="your-aws-key" \
    AWS_SECRET_ACCESS_KEY="your-aws-secret" \
    AWS_REGION="us-east-1" \
    AWS_BUCKET_NAME="greenchainz-assets" \
    STRIPE_SECRET_KEY="your-stripe-key" \
    STRIPE_WEBHOOK_SECRET="your-webhook-secret" \
    RESEND_API_KEY="your-resend-key" \
    RESEND_FROM_EMAIL="noreply@greenchainz.com" \
    MAILERLITE_API_KEY="your-mailerlite-key" \
    NEXT_PUBLIC_INTERCOM_APP_ID="your-intercom-id" \
    NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX" \
    NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

### Required Environment Variables

See `.env.example` for the complete list. Critical variables include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`
- `CRON_SECRET`
- `JWT_SECRET`
- `SESSION_SECRET`

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow (`.github/workflows/main_greenchainz-platform.yml`) that automatically deploys to Azure on push to `main` branch.

#### Setup GitHub Secrets

1. Go to GitHub Repository → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `AZUREAPPSERVICE_PUBLISHPROFILE_E984DF8E74C844D3B60259660D6FA8CC`: Download from Azure Portal
   - All environment variables (e.g., `NEXT_PUBLIC_SUPABASE_URL`, etc.)

#### Download Publish Profile

```bash
az webapp deployment list-publishing-profiles \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --xml
```

Copy the output and save it as a GitHub secret.

#### Workflow Trigger

The workflow automatically runs on:
- Push to `main` branch
- Manual trigger via `workflow_dispatch`

### Method 2: Azure CLI Deployment

Deploy directly from your local machine:

```bash
# Build the application
npm run build

# Create deployment package
cd .next/standalone
zip -r ../../release.zip .

# Deploy to Azure
az webapp deployment source config-zip \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --src ../../release.zip
```

### Method 3: Azure Portal Deployment Center

1. Go to Azure Portal → App Service → **Deployment Center**
2. Select **GitHub** as the source
3. Authorize Azure to access your GitHub account
4. Select repository and branch
5. Azure will automatically set up GitHub Actions

## Cron Jobs Configuration

The application has scheduled tasks that need to be configured separately. See [AZURE-CRON-JOBS.md](./AZURE-CRON-JOBS.md) for detailed instructions.

### Quick Setup with Azure Logic Apps

1. **MailerLite Sync** (Daily at 3 AM UTC):
   ```bash
   az logic workflow create \
     --resource-group greenchainz-prod \
     --location eastus \
     --name greenchainz-cron-mailerlite \
     --definition @logic-app-mailerlite.json
   ```

2. **Quarterly Reports** (Quarterly on first day of Q1, Q2, Q3, Q4):
   ```bash
   az logic workflow create \
     --resource-group greenchainz-prod \
     --location eastus \
     --name greenchainz-cron-quarterly \
     --definition @logic-app-quarterly.json
   ```

## Monitoring and Logging

### Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app greenchainz-insights \
  --location eastus \
  --resource-group greenchainz-prod \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app greenchainz-insights \
  --resource-group greenchainz-prod \
  --query "instrumentationKey" -o tsv)

# Configure App Service
az webapp config appsettings set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY"
```

### View Logs

```bash
# Stream logs in real-time
az webapp log tail \
  --name greenchainz-platform \
  --resource-group greenchainz-prod

# Download logs
az webapp log download \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --log-file logs.zip
```

### Azure Portal Monitoring

1. Navigate to **App Service** → **Monitoring** → **Metrics**
2. View:
   - HTTP requests
   - Response times
   - CPU usage
   - Memory usage
   - Errors

## Security Configuration

### Enable HTTPS Only

```bash
az webapp update \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --https-only true
```

### Configure Custom Domain

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name greenchainz-platform \
  --resource-group greenchainz-prod \
  --hostname greenchainz.com

# Enable SSL
az webapp config ssl bind \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --certificate-thumbprint THUMBPRINT \
  --ssl-type SNI
```

### Configure CORS

If needed for API access from other domains:

```bash
az webapp cors add \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --allowed-origins https://greenchainz.com https://admin.greenchainz.com
```

## Scaling

### Manual Scaling

```bash
az appservice plan update \
  --name greenchainz-plan \
  --resource-group greenchainz-prod \
  --sku P1V2
```

### Auto Scaling Rules

```bash
az monitor autoscale create \
  --resource-group greenchainz-prod \
  --resource greenchainz-platform \
  --resource-type Microsoft.Web/sites \
  --name greenchainz-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Scale up when CPU > 70%
az monitor autoscale rule create \
  --resource-group greenchainz-prod \
  --autoscale-name greenchainz-autoscale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Symptom**: Deployment succeeds but app doesn't start

**Solution**: Check build logs in GitHub Actions or Azure deployment logs:
```bash
az webapp log tail --name greenchainz-platform --resource-group greenchainz-prod
```

#### 2. Environment Variables Not Loading

**Symptom**: App starts but features don't work

**Solution**: Verify environment variables are set:
```bash
az webapp config appsettings list \
  --name greenchainz-platform \
  --resource-group greenchainz-prod
```

#### 3. Startup Command Not Working

**Symptom**: "node_modules/.bin/next: not found"

**Solution**: Ensure startup command is `node server.js`:
```bash
az webapp config show \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --query "appCommandLine"
```

#### 4. High Memory Usage

**Symptom**: App crashes or restarts frequently

**Solution**: Upgrade to higher tier plan:
```bash
az appservice plan update \
  --name greenchainz-plan \
  --resource-group greenchainz-prod \
  --sku P1V2
```

### Debugging Tips

1. **Enable detailed error messages**:
   ```bash
   az webapp config appsettings set \
     --name greenchainz-platform \
     --resource-group greenchainz-prod \
     --settings WEBSITE_NODE_DEFAULT_VERSION=20.x NODE_ENV=development
   ```

2. **Check deployment logs**:
   - Azure Portal → App Service → Deployment Center → Logs

3. **Test locally with production build**:
   ```bash
   npm run build
   cd .next/standalone
   node server.js
   ```

## Health Checks

Configure health check endpoint:

```bash
az webapp config set \
  --name greenchainz-platform \
  --resource-group greenchainz-prod \
  --health-check-path "/api/health"
```

Create health check endpoint at `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
```

## Backup and Recovery

### Database Backups

Supabase handles automatic backups. To restore:
1. Go to Supabase Dashboard → Database → Backups
2. Select backup point
3. Click Restore

### App Service Backups

```bash
# Create backup
az webapp config backup create \
  --resource-group greenchainz-prod \
  --webapp-name greenchainz-platform \
  --backup-name backup-$(date +%Y%m%d) \
  --container-url "STORAGE_SAS_URL"
```

## Cost Optimization

1. **Use appropriate tier**: Start with B2, upgrade only when needed
2. **Enable auto-scaling**: Scale down during low traffic
3. **Monitor usage**: Set up budget alerts
4. **Use CDN**: Offload static assets to Azure CDN or Cloudflare

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

## Support

For deployment issues:
1. Check Azure Status: https://status.azure.com/
2. Review App Service logs
3. Contact Azure Support via portal
4. Consult the team: founder@greenchainz.com
