# Legacy Vercel Documentation

**⚠️ ARCHIVED - For Historical Reference Only**

This folder contains documentation and scripts related to the previous Vercel deployment setup. **GreenChainz has migrated to Azure App Service** as of December 2025.

## Why These Files Are Archived

The project was originally deployed to Vercel but has been migrated to Azure App Service for:
- Better integration with Azure ecosystem (Azure OpenAI, Azure Functions, etc.)
- Cost optimization with Azure student credits
- More control over deployment configuration
- Enterprise-grade scaling capabilities

## Contents

- **VERCEL-*.md** - Documentation for Vercel setup and deployment
- **START-FROM-VERCEL.md** - Original guide for deploying to Vercel
- **deploy-vercel.ps1.legacy** - PowerShell script for Vercel deployment

## Current Deployment

For current deployment instructions, see:
- **AZURE_ENV_CHECKLIST.md** (root) - Environment variables for Azure
- **docs/AZURE-QUICK-START.md** - Quick start guide for Azure deployment
- **docs/deployment-checklist.md** - Complete deployment checklist
- **.github/workflows/azure-deployment.yml** - Active deployment workflow

## Migrating from Vercel to Azure

If you need to reference the migration process or understand what changed, these files document the original Vercel configuration. Key differences:

| Aspect | Vercel | Azure App Service |
|--------|--------|-------------------|
| Deployment | Automatic via Vercel CLI | GitHub Actions → Azure App Service |
| Environment Variables | Vercel Dashboard | Azure Portal → Configuration |
| Build Output | Automatic serverless | `output: 'standalone'` in next.config.mjs |
| Custom Domains | Vercel DNS | Azure Custom Domains + Cloudflare |
| Edge Functions | Vercel Edge | Azure Functions |

## Questions?

If you have questions about the migration or need to reference the old setup, contact the development team or open an issue on GitHub.

**Last Updated:** December 30, 2025
