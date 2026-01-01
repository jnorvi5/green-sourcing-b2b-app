#!/bin/bash

# ============================================
# Azure Setup Script for GreenChainz Platform
# Retrieves all resource credentials and generates .env.azure file
# ============================================

set -e

echo "🔷 GreenChainz Azure Setup Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    echo "Install it from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI found${NC}"

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure${NC}"
    echo "Running: az login"
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo -e "${GREEN}✅ Logged in to Azure${NC}"
echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Tenant ID: $TENANT_ID"
echo ""

# Create output file
OUTPUT_FILE=".env.azure"
echo "# Azure Configuration - Generated $(date)" > $OUTPUT_FILE
echo "# GreenChainz Platform" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Function to add to env file
add_to_env() {
    echo "$1=$2" >> $OUTPUT_FILE
}

echo -e "${BLUE}📦 Retrieving Azure resources...${NC}"
echo ""

# Subscription & Tenant
add_to_env "AZURE_SUBSCRIPTION_ID" "$SUBSCRIPTION_ID"
add_to_env "AZURE_TENANT_ID" "$TENANT_ID"
add_to_env "AZURE_ENVIRONMENT" "true"
echo "" >> $OUTPUT_FILE

# Resource Groups
echo -e "${BLUE}📋 Resource Groups${NC}"
add_to_env "AZURE_RG_CORE" "greenchainz-core-start"
add_to_env "AZURE_RG_PRODUCTION" "greenchainz-production"
add_to_env "AZURE_RG_SCRAPER" "greenchainzscraper"
add_to_env "AZURE_RG_CONTAINER" "rg-greenchainz-prod-container"
add_to_env "AZURE_RG_AI" "greenchainz-ai"
add_to_env "AZURE_RG_MAIN" "rg-greenchainz"
echo "" >> $OUTPUT_FILE

# Container Registry
echo -e "${BLUE}🐳 Container Registry${NC}"
ACR_USERNAME=$(az acr credential show --name acrgreenchainzprod916 --query username -o tsv 2>/dev/null || echo "")
ACR_PASSWORD=$(az acr credential show --name acrgreenchainzprod916 --query passwords[0].value -o tsv 2>/dev/null || echo "")

if [ ! -z "$ACR_USERNAME" ]; then
    echo -e "${GREEN}✅ ACR credentials retrieved${NC}"
    add_to_env "AZURE_REGISTRY_NAME" "acrgreenchainzprod916"
    add_to_env "AZURE_REGISTRY_SERVER" "acrgreenchainzprod916.azurecr.io"
    add_to_env "AZURE_REGISTRY_USERNAME" "$ACR_USERNAME"
    add_to_env "AZURE_REGISTRY_PASSWORD" "$ACR_PASSWORD"
else
    echo -e "${RED}❌ Could not retrieve ACR credentials${NC}"
fi
echo "" >> $OUTPUT_FILE

# Redis Cache
echo -e "${BLUE}⚡ Redis Cache${NC}"
REDIS_KEY=$(az redis list-keys --name greenchainz --resource-group greenchainz-production --query primaryKey -o tsv 2>/dev/null || echo "")

if [ ! -z "$REDIS_KEY" ]; then
    echo -e "${GREEN}✅ Redis key retrieved${NC}"
    add_to_env "AZURE_REDIS_ENABLED" "true"
    add_to_env "AZURE_REDIS_HOST" "greenchainz.redis.cache.windows.net"
    add_to_env "AZURE_REDIS_PORT" "6380"
    add_to_env "AZURE_REDIS_KEY" "$REDIS_KEY"
    add_to_env "AZURE_REDIS_TLS" "true"
else
    echo -e "${RED}❌ Could not retrieve Redis key${NC}"
fi
echo "" >> $OUTPUT_FILE

# Key Vault
echo -e "${BLUE}🔐 Key Vault${NC}"
add_to_env "AZURE_KEYVAULT_ENABLED" "true"
add_to_env "AZURE_KEYVAULT_NAME" "greenchianz-vault"
add_to_env "AZURE_KEYVAULT_URL" "https://greenchianz-vault.vault.azure.net/"
echo -e "${GREEN}✅ Key Vault configured${NC}"
echo "" >> $OUTPUT_FILE

# Storage Account
echo -e "${BLUE}💾 Storage Accounts${NC}"
STORAGE_CONN=$(az storage account show-connection-string --name greenchainzscraper --resource-group greenchainzscraper --query connectionString -o tsv 2>/dev/null || echo "")

if [ ! -z "$STORAGE_CONN" ]; then
    echo -e "${GREEN}✅ Storage connection string retrieved${NC}"
    add_to_env "AZURE_STORAGE_ACCOUNT_NAME" "greenchainzscraper"
    add_to_env "AZURE_STORAGE_CONNECTION_STRING" "$STORAGE_CONN"
else
    echo -e "${RED}❌ Could not retrieve storage connection string${NC}"
fi
echo "" >> $OUTPUT_FILE

# Application Insights
echo -e "${BLUE}📊 Application Insights${NC}"
APPINSIGHTS_CONN=$(az monitor app-insights component show --app greenchainz-platform --resource-group rg-greenchainz --query connectionString -o tsv 2>/dev/null || echo "")

if [ ! -z "$APPINSIGHTS_CONN" ]; then
    echo -e "${GREEN}✅ Application Insights connection string retrieved${NC}"
    add_to_env "AZURE_APPINSIGHTS_ENABLED" "true"
    add_to_env "APPLICATIONINSIGHTS_CONNECTION_STRING" "$APPINSIGHTS_CONN"
else
    echo -e "${RED}❌ Could not retrieve Application Insights connection${NC}"
fi
echo "" >> $OUTPUT_FILE

# Document Intelligence
echo -e "${BLUE}🤖 Document Intelligence${NC}"
DOC_INTEL_KEY=$(az cognitiveservices account keys list --name greenchainz-content-intel --resource-group greenchainz-ai --query key1 -o tsv 2>/dev/null || echo "")

if [ ! -z "$DOC_INTEL_KEY" ]; then
    echo -e "${GREEN}✅ Document Intelligence key retrieved${NC}"
    add_to_env "AZURE_DOC_INTEL_ENABLED" "true"
    add_to_env "AZURE_DOC_INTEL_ENDPOINT" "https://greenchainz-content-intel.cognitiveservices.azure.com/"
    add_to_env "AZURE_DOC_INTEL_KEY" "$DOC_INTEL_KEY"
else
    echo -e "${RED}❌ Could not retrieve Document Intelligence key${NC}"
fi
echo "" >> $OUTPUT_FILE

# Container Apps
echo -e "${BLUE}🚀 Container Apps${NC}"
add_to_env "AZURE_CONTAINER_ENV" "cae-greenchainz-env"
add_to_env "AZURE_CONTAINER_APP" "greenchainz-container"
echo "" >> $OUTPUT_FILE

# API Management
echo -e "${BLUE}🔌 API Management${NC}"
add_to_env "AZURE_APIM_ENABLED" "true"
add_to_env "AZURE_APIM_NAME" "greenchainz-scraper-apim"
add_to_env "AZURE_APIM_ENDPOINT" "https://greenchainz-scraper-apim.azure-api.net"
echo "" >> $OUTPUT_FILE

# Function Apps
add_to_env "AZURE_FUNCTION_SCRAPER" "greenchainz-scraper"
echo "" >> $OUTPUT_FILE

# Regions
add_to_env "AZURE_PRIMARY_REGION" "eastus"
add_to_env "AZURE_SECONDARY_REGION" "eastus2"

echo ""
echo -e "${GREEN}✅ Azure configuration complete!${NC}"
echo ""
echo -e "Configuration saved to: ${BLUE}$OUTPUT_FILE${NC}"
echo ""
echo "Next steps:"
echo "1. Review the generated .env.azure file"
echo "2. Copy values to your .env file or use directly"
echo "3. Run: npm install (to install Azure SDKs)"
echo "4. Deploy: ./scripts/azure-deploy.sh"
echo ""
echo "For detailed setup instructions, see: AZURE-SETUP-GUIDE.md"
