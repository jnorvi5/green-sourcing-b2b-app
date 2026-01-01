# Azure Integration Quick Start 🔷

This README provides quick commands to get your GreenChainz platform running on Azure.

## 📦 What's Included

- **Full Azure SDK Integration** - Redis, Key Vault, Storage, App Insights, Document Intelligence
- **Optimized Dockerfiles** - Multi-stage builds for Container Apps
- **CI/CD Pipeline** - Automated GitHub Actions deployment
- **Monitoring** - Application Insights telemetry
- **Cost Optimization** - Caching, auto-scaling, free tier usage

## 🚀 Quick Commands

### Setup (One-Time)
```bash
# 1. Get all Azure credentials
./scripts/azure-setup.sh

# 2. Install dependencies
cd backend && npm install

# 3. Copy Azure config to .env
cat .env.azure >> .env
```

### Local Development
```bash
# Start with Azure services
cd backend
npm start

# You'll see:
# 🔷 Initializing Azure services...
# [Redis] Connected to Azure Redis Cache
# ✅ Azure services initialized
```

### Deploy to Azure
```bash
# Quick deploy
./scripts/azure-deploy.sh

# Or push to GitHub (auto-deploys)
git push origin main
```

## 🔗 Quick Links

- **📚 Full Setup Guide**: [AZURE-SETUP-GUIDE.md](./AZURE-SETUP-GUIDE.md)
- **📊 Integration Summary**: [AZURE-INTEGRATION-SUMMARY.md](./AZURE-INTEGRATION-SUMMARY.md)
- **🐳 Docker Hub**: acrgreenchainzprod916.azurecr.io
- **🌐 App URL**: https://greenchainz-container.azurecontainerapps.io

## 🧪 Test Commands

```bash
# Health check (shows Azure service status)
curl https://greenchainz-container.azurecontainerapps.io/

# Test Redis caching
curl https://greenchainz-container.azurecontainerapps.io/api/v1/suppliers

# View logs
az containerapp logs show \
  --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container \
  --follow
```

## 📊 Your Azure Resources

| Service | Resource Name | Location |
|---------|--------------|----------|
| Container Registry | acrgreenchainzprod916 | Global |
| Container App | greenchainz-container | East US |
| Redis Cache | greenchainz | East US 2 |
| Key Vault | greenchianz-vault | East US |
| Storage | greenchainzscraper | East US |
| App Insights | greenchainz-platform | East US |
| Document AI | greenchainz-content-intel | East US |

## 💰 Cost Estimate

- **Free Tier**: $0-10/month
- **Light Usage**: $20-40/month  
- **Production**: $50-100/month

## 🔐 Required Secrets

Add these to GitHub Actions secrets:

1. `AZURE_CREDENTIALS` - Service principal JSON
2. `AZURE_REGISTRY_USERNAME` - acrgreenchainzprod916
3. `AZURE_REGISTRY_PASSWORD` - (from `az acr credential show`)

Get them with:
```bash
./scripts/azure-setup.sh
```

## ❓ Troubleshooting

### App won't start
```bash
az containerapp logs show --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container --tail 100
```

### Redis connection issues
```bash
# Test Redis
redis-cli -h greenchainz.redis.cache.windows.net -p 6380 --tls PING
```

### Build failures
```bash
# Check ACR logs
az acr repository show-tags --name acrgreenchainzprod916 \
  --repository greenchainz-backend
```

## 📖 Documentation

- **Setup Guide**: Comprehensive step-by-step instructions
- **Integration Summary**: What's implemented and how to use it
- **Code Examples**: See `/backend/services/azure*.js`

## ✅ Checklist

- [ ] Run `./scripts/azure-setup.sh`
- [ ] Update `.env` with Azure credentials
- [ ] Install dependencies (`npm install`)
- [ ] Test locally (`npm start`)
- [ ] Deploy to Azure (`./scripts/azure-deploy.sh`)
- [ ] Configure GitHub Actions secrets
- [ ] Enable monitoring in Azure Portal

## 🎯 Next Steps

1. **Monitor**: Check Application Insights dashboard
2. **Scale**: Configure auto-scaling rules
3. **Optimize**: Review cost recommendations
4. **Secure**: Rotate secrets regularly

---

**Ready to deploy!** 🚀

For detailed instructions, see [AZURE-SETUP-GUIDE.md](./AZURE-SETUP-GUIDE.md)
