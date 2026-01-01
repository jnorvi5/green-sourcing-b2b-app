# Azure Integration Setup Guide
## GreenChainz Platform - Full Azure Resource Integration

This guide will help you configure all your Azure resources for the GreenChainz platform.

## 📋 Azure Resources Inventory

Your Azure subscription has 33 resources across multiple resource groups:

### Core Resources
- **Container Registry**: `acrgreenchainzprod916.azurecr.io`
- **Container Apps**: `greenchainz-container` (East US)
- **Container Apps Environment**: `cae-greenchainz-env`

### Caching & Storage
- **Redis Cache**: `greenchainz.redis.cache.windows.net` (East US 2)
- **Key Vault**: `greenchianz-vault` (East US)
- **Storage Accounts**:
  - `greenchainzscraper` (main application storage)
  - `revitfiles` (CAD/BIM files)
  - `logicapp342954358599` (workflow storage)

### AI & Analytics
- **Application Insights**:
  - `greenchainz-platform`
  - `greenchainz-scraper`
- **Document Intelligence**: `greenchainz-content-intel`
- **Foundry Projects**:
  - `gemenis-agents-resource/gemenis-agents`
  - `greenchainz-foundry/greenchainz-emailer`
  - `greenchainz-resource/greenchainz`

### Functions & API
- **Function Apps**: `greenchainz-scraper`
- **API Management**: `greenchainz-scraper-apim`

---

## 🚀 Quick Start Setup

### Step 1: Install Azure CLI

```bash
# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Windows
winget install -e --id Microsoft.AzureCLI
```

### Step 2: Login to Azure

```bash
az login
az account show

# Set your subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### Step 3: Get Resource Credentials

Run the provided setup script to retrieve all connection strings:

```bash
chmod +x scripts/azure-setup.sh
./scripts/azure-setup.sh
```

This will generate a `.env.azure` file with all your credentials.

---

## 🔐 Manual Configuration Steps

### 1. Azure Container Registry (ACR)

```bash
# Get ACR credentials
az acr credential show --name acrgreenchainzprod916

# Output:
# Username: acrgreenchainzprod916
# Password: <your-password>
```

Add to `.env`:
```env
AZURE_REGISTRY_NAME=acrgreenchainzprod916
AZURE_REGISTRY_SERVER=acrgreenchainzprod916.azurecr.io
AZURE_REGISTRY_USERNAME=acrgreenchainzprod916
AZURE_REGISTRY_PASSWORD=<your-password>
```

### 2. Azure Redis Cache

```bash
# Get Redis connection info
az redis show --name greenchainz --resource-group greenchainz-production

# Get Redis access keys
az redis list-keys --name greenchainz --resource-group greenchainz-production
```

Add to `.env`:
```env
AZURE_REDIS_ENABLED=true
AZURE_REDIS_HOST=greenchainz.redis.cache.windows.net
AZURE_REDIS_PORT=6380
AZURE_REDIS_KEY=<your-primary-key>
AZURE_REDIS_TLS=true
```

### 3. Azure Key Vault

```bash
# Get Key Vault URI
az keyvault show --name greenchianz-vault --resource-group greenchainz-production

# Grant your identity access to Key Vault
az keyvault set-policy \
  --name greenchianz-vault \
  --object-id $(az ad signed-in-user show --query id -o tsv) \
  --secret-permissions get list set delete
```

Add to `.env`:
```env
AZURE_KEYVAULT_ENABLED=true
AZURE_KEYVAULT_NAME=greenchianz-vault
AZURE_KEYVAULT_URL=https://greenchianz-vault.vault.azure.net/
```

### 4. Azure Storage Accounts

```bash
# Get storage connection strings
az storage account show-connection-string \
  --name greenchainzscraper \
  --resource-group greenchainzscraper

az storage account show-connection-string \
  --name revitfiles \
  --resource-group rg-greenchainz
```

Add to `.env`:
```env
AZURE_STORAGE_ACCOUNT_NAME=greenchainzscraper
AZURE_STORAGE_CONNECTION_STRING=<connection-string>

AZURE_STORAGE_REVIT_ACCOUNT=revitfiles
AZURE_STORAGE_REVIT_CONNECTION=<connection-string>
```

### 5. Application Insights

```bash
# Get Application Insights connection string
az monitor app-insights component show \
  --app greenchainz-platform \
  --resource-group rg-greenchainz
```

Add to `.env`:
```env
AZURE_APPINSIGHTS_ENABLED=true
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string>
```

### 6. Document Intelligence

```bash
# Get Document Intelligence endpoint and keys
az cognitiveservices account show \
  --name greenchainz-content-intel \
  --resource-group greenchainz-ai

az cognitiveservices account keys list \
  --name greenchainz-content-intel \
  --resource-group greenchainz-ai
```

Add to `.env`:
```env
AZURE_DOC_INTEL_ENABLED=true
AZURE_DOC_INTEL_ENDPOINT=https://greenchainz-content-intel.cognitiveservices.azure.com/
AZURE_DOC_INTEL_KEY=<your-key>
```

### 7. API Management

```bash
# Get APIM subscription key
az apim show \
  --name greenchainz-scraper-apim \
  --resource-group greenchainzscraper
```

Add to `.env`:
```env
AZURE_APIM_ENABLED=true
AZURE_APIM_NAME=greenchainz-scraper-apim
AZURE_APIM_KEY=<subscription-key>
AZURE_APIM_ENDPOINT=https://greenchainz-scraper-apim.azure-api.net
```

---

## 🏗️ Deploy to Azure Container Apps

### Option 1: Using GitHub Actions (Recommended)

1. Add secrets to your GitHub repository:

```bash
# Go to: Settings > Secrets and variables > Actions > New repository secret

# Add these secrets:
AZURE_CREDENTIALS=<service-principal-json>
AZURE_REGISTRY_USERNAME=acrgreenchainzprod916
AZURE_REGISTRY_PASSWORD=<acr-password>
```

2. Create Azure service principal:

```bash
az ad sp create-for-rbac \
  --name "greenchainz-github-actions" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-greenchainz-prod-container \
  --sdk-auth
```

3. Push to main branch to trigger deployment:

```bash
git add .
git commit -m "Azure integration complete"
git push origin main
```

### Option 2: Manual Deployment

```bash
# Build and push Docker image
docker build -t acrgreenchainzprod916.azurecr.io/greenchainz-backend:latest ./backend
docker push acrgreenchainzprod916.azurecr.io/greenchainz-backend:latest

# Deploy to Container Apps
az containerapp update \
  --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container \
  --image acrgreenchainzprod916.azurecr.io/greenchainz-backend:latest
```

---

## 🔧 Configure Container App Environment Variables

```bash
# Set all environment variables in Container App
az containerapp update \
  --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container \
  --set-env-vars \
    NODE_ENV=production \
    AZURE_ENVIRONMENT=true \
    AZURE_REDIS_ENABLED=true \
    AZURE_REDIS_HOST=greenchainz.redis.cache.windows.net \
    AZURE_REDIS_PORT=6380 \
    AZURE_KEYVAULT_ENABLED=true \
    AZURE_KEYVAULT_URL=https://greenchianz-vault.vault.azure.net/ \
    AZURE_APPINSIGHTS_ENABLED=true \
    AZURE_DOC_INTEL_ENABLED=true \
    PORT=3001
```

---

## 🔐 Store Secrets in Key Vault

```bash
# Store sensitive secrets in Key Vault
az keyvault secret set --vault-name greenchianz-vault \
  --name "database-password" \
  --value "YOUR_DATABASE_PASSWORD"

az keyvault secret set --vault-name greenchianz-vault \
  --name "jwt-secret" \
  --value "YOUR_JWT_SECRET"

az keyvault secret set --vault-name greenchianz-vault \
  --name "redis-key" \
  --value "YOUR_REDIS_KEY"

az keyvault secret set --vault-name greenchianz-vault \
  --name "storage-connection-string" \
  --value "YOUR_STORAGE_CONNECTION"
```

---

## 📊 Monitor Your Application

### Application Insights Queries

```bash
# View recent requests
az monitor app-insights query \
  --app greenchainz-platform \
  --resource-group rg-greenchainz \
  --analytics-query "requests | take 100"

# View exceptions
az monitor app-insights query \
  --app greenchainz-platform \
  --resource-group rg-greenchainz \
  --analytics-query "exceptions | take 50"
```

### Container App Logs

```bash
# View live logs
az containerapp logs show \
  --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container \
  --follow

# View recent logs
az containerapp logs show \
  --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container \
  --tail 100
```

---

## 🧪 Test Your Setup

### 1. Test Redis Connection

```bash
curl https://greenchainz-container.azurecontainerapps.io/
# Should return Azure service status with redis: true
```

### 2. Test API Endpoints

```bash
# Health check
curl https://greenchainz-container.azurecontainerapps.io/

# List suppliers (with Redis caching)
curl https://greenchainz-container.azurecontainerapps.io/api/v1/suppliers
```

### 3. Test Document Intelligence

Upload a certification document to test OCR:

```bash
curl -X POST https://greenchainz-container.azurecontainerapps.io/api/v1/certifications/parse \
  -H "Content-Type: multipart/form-data" \
  -F "file=@certification.pdf"
```

---

## 🎯 Cost Optimization

### Free Tier Resources
- **Container Apps**: First 180,000 vCPU-seconds free/month
- **Application Insights**: 5 GB ingestion free/month
- **API Management**: Consumption tier (pay per call)

### Recommended Pricing Tier
- **Redis Cache**: Standard C0 (~$15/month)
- **Storage**: Standard LRS (~$5/month)
- **Document Intelligence**: Free tier (5,000 pages/month)
- **Container Apps**: ~$10-30/month (depends on usage)

**Estimated Monthly Cost**: $30-50 after free tier

---

## 🚨 Troubleshooting

### Container App won't start

```bash
# Check logs
az containerapp logs show --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container --tail 100

# Check revisions
az containerapp revision list --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container
```

### Redis connection fails

```bash
# Check Redis status
az redis show --name greenchainz --resource-group greenchainz-production

# Test connection
redis-cli -h greenchainz.redis.cache.windows.net -p 6380 \
  --tls --askpass PING
```

### Key Vault access denied

```bash
# Grant access to Container App managed identity
IDENTITY_ID=$(az containerapp show \
  --name greenchainz-container \
  --resource-group rg-greenchainz-prod-container \
  --query identity.principalId -o tsv)

az keyvault set-policy \
  --name greenchianz-vault \
  --object-id $IDENTITY_ID \
  --secret-permissions get list
```

---

## 📚 Additional Resources

- [Azure Container Apps Docs](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Redis Cache Docs](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Azure Key Vault Docs](https://learn.microsoft.com/en-us/azure/key-vault/)
- [Application Insights Docs](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

---

## ✅ Checklist

- [ ] Azure CLI installed and authenticated
- [ ] All resource credentials retrieved
- [ ] `.env` file configured with Azure settings
- [ ] Secrets stored in Key Vault
- [ ] Docker images built and pushed to ACR
- [ ] Container App deployed and running
- [ ] Environment variables configured
- [ ] Application Insights collecting telemetry
- [ ] Redis cache connected
- [ ] Document Intelligence enabled
- [ ] GitHub Actions secrets configured
- [ ] Deployment tested and verified

---

**Your Azure integration is now complete! 🎉**

For support, check the logs or open an issue in the repository.
