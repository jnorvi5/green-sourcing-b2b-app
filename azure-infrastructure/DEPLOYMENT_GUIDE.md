# Azure AI Foundry Infrastructure Deployment Guide

## Overview

This guide walks you through setting up production Azure infrastructure for GreenChainz using available Azure credits. Complete this setup within 48 hours to have your AI-powered B2B marketplace infrastructure ready.

**Founder:** Jerit Norville (founder@greenchainz.com)  
**Timeline:** Q1 2026 MVP Launch  
**Budget:** Azure credits with cost alerts at $50, $100, $200

## Prerequisites

- Azure account with credits activated
- Azure CLI installed (`az --version` to verify)
- Node.js 18+ installed
- Access to GreenChainz repository

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    GreenChainz on Vercel                     │
│                      (Next.js App)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Azure OpenAI │ │   Cognitive  │ │   Storage    │
│   Service    │ │    Search    │ │   Account    │
│              │ │              │ │              │
│ - GPT-4      │ │ - Products   │ │ - Images     │
│ - Embeddings │ │ - Suppliers  │ │ - EPD PDFs   │
└──────────────┘ └──────────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Azure      │ │  Application │ │    Cost      │
│  Functions   │ │   Insights   │ │   Alerts     │
│              │ │              │ │              │
│ - EPD Sync   │ │ - Monitoring │ │ - $50/$100   │
│ - RFQ Match  │ │ - Logging    │ │ - $200       │
│ - Emails     │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Step 1: Initial Azure Setup (15 minutes)

### 1.1 Login to Azure

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account list --output table
az account set --subscription "Your-Subscription-Name"

# Verify current subscription
az account show
```

### 1.2 Create Resource Group

```bash
# Create resource group in East US (good for AI services)
az group create \
  --name greenchainz-prod \
  --location eastus \
  --tags Environment=Production Project=GreenChainz Owner=jerit@greenchainz.com

# Verify creation
az group show --name greenchainz-prod
```

### 1.3 Enable Required Resource Providers

```bash
# Enable Azure OpenAI
az provider register --namespace Microsoft.CognitiveServices

# Enable Azure Functions
az provider register --namespace Microsoft.Web

# Enable Azure Storage
az provider register --namespace Microsoft.Storage

# Enable Azure Search
az provider register --namespace Microsoft.Search

# Check registration status (wait until all show "Registered")
az provider show --namespace Microsoft.CognitiveServices --query "registrationState"
```

## Step 2: Deploy Azure OpenAI Service (20 minutes)

### 2.1 Create Azure OpenAI Resource

```bash
# Create Azure OpenAI service
az cognitiveservices account create \
  --name greenchainz-openai \
  --resource-group greenchainz-prod \
  --location eastus \
  --kind OpenAI \
  --sku S0 \
  --custom-domain greenchainz-openai \
  --tags Purpose="Product matching and AI features"

# Get endpoint and keys
az cognitiveservices account show \
  --name greenchainz-openai \
  --resource-group greenchainz-prod \
  --query "properties.endpoint" -o tsv

az cognitiveservices account keys list \
  --name greenchainz-openai \
  --resource-group greenchainz-prod
```

**Save these values:**

- Endpoint: `https://greenchainz-openai.openai.azure.com/`
- Key1: `[COPY FROM OUTPUT]`

### 2.2 Deploy GPT-4 Model

```bash
# Deploy GPT-4 (for product descriptions, matching)
az cognitiveservices account deployment create \
  --name greenchainz-openai \
  --resource-group greenchainz-prod \
  --deployment-name gpt-4 \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name "Standard"

# Verify deployment
az cognitiveservices account deployment show \
  --name greenchainz-openai \
  --resource-group greenchainz-prod \
  --deployment-name gpt-4
```

### 2.3 Deploy Embeddings Model

```bash
# Deploy text-embedding-ada-002 (for product similarity)
az cognitiveservices account deployment create \
  --name greenchainz-openai \
  --resource-group greenchainz-prod \
  --deployment-name text-embedding-ada-002 \
  --model-name text-embedding-ada-002 \
  --model-version "2" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name "Standard"

# Verify deployment
az cognitiveservices account deployment list \
  --name greenchainz-openai \
  --resource-group greenchainz-prod \
  --output table
```

### 2.4 Test Azure OpenAI

```bash
# Test GPT-4 deployment
curl https://greenchainz-openai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15 \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_KEY_HERE" \
  -d '{
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

## Step 3: Set Up Azure Cognitive Search (25 minutes)

### 3.1 Create Search Service

```bash
# Create Azure Cognitive Search (Basic tier for MVP)
az search service create \
  --name greenchainz-search \
  --resource-group greenchainz-prod \
  --location eastus \
  --sku Basic \
  --partition-count 1 \
  --replica-count 1

# Get admin keys
az search admin-key show \
  --service-name greenchainz-search \
  --resource-group greenchainz-prod
```

**Save these values:**

- Search Endpoint: `https://greenchainz-search.search.windows.net`
- Admin Key: `[COPY FROM OUTPUT]`

### 3.2 Create Search Indexes

Create `search-indexes.json`:

```json
{
  "name": "products-index",
  "fields": [
    { "name": "id", "type": "Edm.String", "key": true, "searchable": false },
    {
      "name": "product_name",
      "type": "Edm.String",
      "searchable": true,
      "filterable": false
    },
    { "name": "description", "type": "Edm.String", "searchable": true },
    {
      "name": "manufacturer",
      "type": "Edm.String",
      "searchable": true,
      "filterable": true,
      "facetable": true
    },
    {
      "name": "material_type",
      "type": "Edm.String",
      "filterable": true,
      "facetable": true
    },
    {
      "name": "carbon_footprint",
      "type": "Edm.Double",
      "filterable": true,
      "sortable": true
    },
    {
      "name": "certifications",
      "type": "Collection(Edm.String)",
      "filterable": true,
      "facetable": true
    },
    {
      "name": "price_per_unit",
      "type": "Edm.Double",
      "filterable": true,
      "sortable": true
    },
    { "name": "supplier_id", "type": "Edm.String", "filterable": true },
    {
      "name": "embedding",
      "type": "Collection(Edm.Single)",
      "searchable": true,
      "dimensions": 1536,
      "vectorSearchProfile": "vector-profile"
    }
  ],
  "vectorSearch": {
    "algorithms": [
      {
        "name": "vector-algorithm",
        "kind": "hnsw"
      }
    ],
    "profiles": [
      {
        "name": "vector-profile",
        "algorithm": "vector-algorithm"
      }
    ]
  }
}
```

Deploy the index:

```bash
# Create products index
curl -X PUT \
  "https://greenchainz-search.search.windows.net/indexes/products-index?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_ADMIN_KEY" \
  -d @search-indexes.json

# Create suppliers index
curl -X PUT \
  "https://greenchainz-search.search.windows.net/indexes/suppliers-index?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_ADMIN_KEY" \
  -d '{
    "name": "suppliers-index",
    "fields": [
      {"name": "id", "type": "Edm.String", "key": true},
      {"name": "company_name", "type": "Edm.String", "searchable": true, "filterable": true},
      {"name": "tier", "type": "Edm.String", "filterable": true, "facetable": true},
      {"name": "geographic_coverage", "type": "Collection(Edm.String)", "filterable": true},
      {"name": "certifications", "type": "Collection(Edm.String)", "filterable": true, "facetable": true},
      {"name": "total_products", "type": "Edm.Int32", "filterable": true, "sortable": true}
    ]
  }'
```

## Step 4: Set Up Azure Storage (15 minutes)

### 4.1 Create Storage Account

```bash
# Create storage account
az storage account create \
  --name greenchainzstorage \
  --resource-group greenchainz-prod \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

# Get connection string
az storage account show-connection-string \
  --name greenchainzstorage \
  --resource-group greenchainz-prod \
  --output tsv
```

**Save this value:**

- Connection String: `[COPY FROM OUTPUT]`

### 4.2 Create Blob Containers

```bash
# Get account key
STORAGE_KEY=$(az storage account keys list \
  --account-name greenchainzstorage \
  --resource-group greenchainz-prod \
  --query "[0].value" -o tsv)

# Create containers
az storage container create \
  --name product-images \
  --account-name greenchainzstorage \
  --account-key $STORAGE_KEY \
  --public-access blob

az storage container create \
  --name epd-pdfs \
  --account-name greenchainzstorage \
  --account-key $STORAGE_KEY \
  --public-access off

az storage container create \
  --name product-documents \
  --account-name greenchainzstorage \
  --account-key $STORAGE_KEY \
  --public-access off

# Verify containers
az storage container list \
  --account-name greenchainzstorage \
  --account-key $STORAGE_KEY \
  --output table
```

### 4.3 Configure CORS for Web Access

```bash
# Enable CORS for web uploads
az storage cors add \
  --services b \
  --methods GET POST PUT \
  --origins "https://greenchainz.com" "https://*.vercel.app" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name greenchainzstorage \
  --account-key $STORAGE_KEY
```

## Step 5: Deploy Azure Functions (30 minutes)

### 5.1 Create Function App

```bash
# Create storage account for functions
az storage account create \
  --name greenchainzfunctions \
  --resource-group greenchainz-prod \
  --location eastus \
  --sku Standard_LRS

# Create Function App (Node.js 18)
az functionapp create \
  --name greenchainz-functions \
  --resource-group greenchainz-prod \
  --storage-account greenchainzfunctions \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --os-type Linux

# Get Function App URL
az functionapp show \
  --name greenchainz-functions \
  --resource-group greenchainz-prod \
  --query "defaultHostName" -o tsv
```

**Save this value:**

- Function App URL: `https://greenchainz-functions.azurewebsites.net`

### 5.2 Configure Function App Settings

```bash
# Add application settings
az functionapp config appsettings set \
  --name greenchainz-functions \
  --resource-group greenchainz-prod \
  --settings \
    AZURE_OPENAI_ENDPOINT="https://greenchainz-openai.openai.azure.com/" \
    AZURE_OPENAI_KEY="YOUR_OPENAI_KEY" \
    AZURE_SEARCH_ENDPOINT="https://greenchainz-search.search.windows.net" \
    AZURE_SEARCH_KEY="YOUR_SEARCH_KEY" \
    AZURE_STORAGE_CONNECTION_STRING="YOUR_STORAGE_CONNECTION" \
    SUPABASE_URL="YOUR_SUPABASE_URL" \
    SUPABASE_SERVICE_KEY="YOUR_SUPABASE_KEY"
```

### 5.3 Deploy Functions

See `azure-functions/` directory for function code. Deploy using:

```bash
cd azure-functions

# Install dependencies
npm install

# Build
npm run build

# Deploy
func azure functionapp publish greenchainz-functions
```

## Step 6: Set Up Monitoring (20 minutes)

### 6.1 Create Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app greenchainz-insights \
  --location eastus \
  --resource-group greenchainz-prod \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app greenchainz-insights \
  --resource-group greenchainz-prod \
  --query "instrumentationKey" -o tsv
```

**Save this value:**

- Instrumentation Key: `[COPY FROM OUTPUT]`

### 6.2 Link Application Insights to Function App

```bash
# Get connection string
APPINSIGHTS_CONNECTION=$(az monitor app-insights component show \
  --app greenchainz-insights \
  --resource-group greenchainz-prod \
  --query "connectionString" -o tsv)

# Configure Function App
az functionapp config appsettings set \
  --name greenchainz-functions \
  --resource-group greenchainz-prod \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APPINSIGHTS_CONNECTION"
```

### 6.3 Create Log Analytics Workspace

```bash
# Create workspace
az monitor log-analytics workspace create \
  --resource-group greenchainz-prod \
  --workspace-name greenchainz-logs \
  --location eastus

# Get workspace ID
az monitor log-analytics workspace show \
  --resource-group greenchainz-prod \
  --workspace-name greenchainz-logs \
  --query "customerId" -o tsv
```

## Step 7: Set Up Cost Alerts (10 minutes)

### 7.1 Create Budget Alerts

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)

# Create $50 alert
az consumption budget create \
  --budget-name greenchainz-budget-50 \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date 2026-12-31 \
  --resource-group greenchainz-prod \
  --notifications \
    threshold=80 \
    operator=GreaterThan \
    contact-emails="founder@greenchainz.com"

# Create $100 alert
az consumption budget create \
  --budget-name greenchainz-budget-100 \
  --amount 100 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date 2026-12-31 \
  --resource-group greenchainz-prod \
  --notifications \
    threshold=80 \
    operator=GreaterThan \
    contact-emails="founder@greenchainz.com"

# Create $200 alert
az consumption budget create \
  --budget-name greenchainz-budget-200 \
  --amount 200 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date 2026-12-31 \
  --resource-group greenchainz-prod \
  --notifications \
    threshold=80 \
    operator=GreaterThan \
    contact-emails="founder@greenchainz.com"
```

### 7.2 Set Up Cost Analysis Dashboard

1. Go to Azure Portal → Cost Management + Billing
2. Select your subscription
3. Click "Cost analysis"
4. Create custom view:
   - Filter by Resource Group: `greenchainz-prod`
   - Group by: Service name
   - Save as "GreenChainz Daily Costs"

## Step 8: Secure Credentials (15 minutes)

### 8.1 Create Azure Key Vault

```bash
# Create Key Vault
az keyvault create \
  --name greenchainz-vault \
  --resource-group greenchainz-prod \
  --location eastus \
  --enable-rbac-authorization false

# Store secrets
az keyvault secret set \
  --vault-name greenchainz-vault \
  --name "AzureOpenAIKey" \
  --value "YOUR_OPENAI_KEY"

az keyvault secret set \
  --vault-name greenchainz-vault \
  --name "AzureSearchKey" \
  --value "YOUR_SEARCH_KEY"

az keyvault secret set \
  --vault-name greenchainz-vault \
  --name "StorageConnectionString" \
  --value "YOUR_STORAGE_CONNECTION"

# Grant Function App access to Key Vault
FUNCTION_PRINCIPAL=$(az functionapp identity assign \
  --name greenchainz-functions \
  --resource-group greenchainz-prod \
  --query "principalId" -o tsv)

az keyvault set-policy \
  --name greenchainz-vault \
  --object-id $FUNCTION_PRINCIPAL \
  --secret-permissions get list
```

### 8.2 Update Environment Variables

Create `.env.azure` file (DO NOT COMMIT):

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://greenchainz-openai.openai.azure.com/
AZURE_OPENAI_KEY=<from-key-vault>
AZURE_OPENAI_DEPLOYMENT_GPT4=gpt-4
AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS=text-embedding-ada-002

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://greenchainz-search.search.windows.net
AZURE_SEARCH_KEY=<from-key-vault>
AZURE_SEARCH_INDEX_PRODUCTS=products-index
AZURE_SEARCH_INDEX_SUPPLIERS=suppliers-index

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=<from-key-vault>
AZURE_STORAGE_ACCOUNT_NAME=greenchainzstorage
AZURE_STORAGE_CONTAINER_IMAGES=product-images
AZURE_STORAGE_CONTAINER_EPDS=epd-pdfs
AZURE_STORAGE_CONTAINER_DOCS=product-documents

# Azure Functions
AZURE_FUNCTIONS_URL=https://greenchainz-functions.azurewebsites.net

# Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=<from-app-insights>

# Key Vault
AZURE_KEY_VAULT_NAME=greenchainz-vault
```

## Step 9: Verification & Testing (20 minutes)

### 9.1 Test Azure OpenAI

```bash
# Test from command line
curl https://greenchainz-openai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15 \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_KEY" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant for GreenChainz."},
      {"role": "user", "content": "Describe sustainable insulation materials."}
    ],
    "max_tokens": 200
  }'
```

### 9.2 Test Azure Search

```bash
# Upload test document
curl -X POST \
  "https://greenchainz-search.search.windows.net/indexes/products-index/docs/index?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_ADMIN_KEY" \
  -d '{
    "value": [
      {
        "@search.action": "upload",
        "id": "test-001",
        "product_name": "Recycled Cellulose Insulation",
        "description": "Eco-friendly insulation made from recycled paper",
        "manufacturer": "EcoMaterials Co",
        "material_type": "insulation",
        "carbon_footprint": 0.15,
        "certifications": ["FSC", "LEED"],
        "price_per_unit": 2.50,
        "supplier_id": "supplier-001"
      }
    ]
  }'

# Search test
curl -X POST \
  "https://greenchainz-search.search.windows.net/indexes/products-index/docs/search?api-version=2023-11-01" \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_ADMIN_KEY" \
  -d '{
    "search": "insulation",
    "top": 5
  }'
```

### 9.3 Test Azure Storage

```bash
# Upload test file
echo "Test EPD document" > test-epd.pdf

az storage blob upload \
  --account-name greenchainzstorage \
  --container-name epd-pdfs \
  --name test-epd.pdf \
  --file test-epd.pdf \
  --account-key $STORAGE_KEY

# Get blob URL
az storage blob url \
  --account-name greenchainzstorage \
  --container-name epd-pdfs \
  --name test-epd.pdf \
  --account-key $STORAGE_KEY
```

### 9.4 Verify Monitoring

1. Go to Azure Portal → Application Insights → greenchainz-insights
2. Check "Live Metrics" - should show data flowing
3. Check "Failures" - should be empty
4. Check "Performance" - should show response times

## Step 10: Integration with Next.js (30 minutes)

See `azure-infrastructure/azure-config.ts` for complete integration code.

### Quick Integration Test

Add to your Next.js app:

```typescript
// pages/api/test-azure.ts
import { NextApiRequest, NextApiResponse } from "next";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const client = new OpenAIClient(
    process.env.AZURE_OPENAI_ENDPOINT!,
    new AzureKeyCredential(process.env.AZURE_OPENAI_KEY!)
  );

  const result = await client.getChatCompletions("gpt-4", [
    { role: "user", content: "Hello Azure!" },
  ]);

  res.status(200).json({ message: result.choices[0].message?.content });
}
```

Test: `curl http://localhost:3000/api/test-azure`

## Troubleshooting

### Issue: Azure OpenAI quota exceeded

**Solution**: Check quota in Azure Portal → Azure OpenAI → Quotas. Request increase if needed.

### Issue: Search index not found

**Solution**: Verify index creation with `curl` command in Step 3.2

### Issue: Storage upload fails

**Solution**: Check CORS settings and container permissions

### Issue: Function App not responding

**Solution**: Check logs: `az functionapp log tail --name greenchainz-functions --resource-group greenchainz-prod`

## Cost Optimization Tips

1. **Use Basic tier for Search** during MVP ($75/month)
2. **Set OpenAI token limits** to prevent runaway costs
3. **Use Consumption plan for Functions** (pay per execution)
4. **Enable storage lifecycle management** to archive old files
5. **Monitor daily** using Cost Analysis dashboard

## Next Steps

1. ✅ Complete this deployment guide
2. ✅ Test all services
3. ✅ Integrate with Next.js app (see `azure-config.ts`)
4. ✅ Deploy Azure Functions (see `azure-functions/`)
5. ✅ Set up CI/CD for functions
6. ✅ Monitor costs daily for first week

## Support

- **Azure Support**: https://portal.azure.com → Help + support
- **Documentation**: https://docs.microsoft.com/azure
- **GreenChainz Contact**: founder@greenchainz.com

---

**Deployment Checklist:**

- [ ] Resource group created
- [ ] Azure OpenAI deployed with GPT-4 and embeddings
- [ ] Cognitive Search created with indexes
- [ ] Storage account with containers
- [ ] Function App deployed
- [ ] Application Insights configured
- [ ] Cost alerts set ($50, $100, $200)
- [ ] Key Vault with secrets
- [ ] All services tested
- [ ] Next.js integration complete

**Estimated Total Time:** 3-4 hours  
**Estimated Monthly Cost:** $150-250 (within budget alerts)
