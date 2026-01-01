#!/bin/bash

# ============================================
# Azure Deployment Script for GreenChainz
# Builds and deploys to Azure Container Apps
# ============================================

set -e

echo "🚀 GreenChainz Azure Deployment"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGISTRY="acrgreenchainzprod916.azurecr.io"
IMAGE_NAME="greenchainz-backend"
CONTAINER_APP="greenchainz-container"
RESOURCE_GROUP="rg-greenchainz-prod-container"
TAG="$(date +%Y%m%d-%H%M%S)"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not installed${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi

# Check login
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure${NC}"
    az login
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}"
echo ""

# Step 1: Login to ACR
echo -e "${BLUE}🔐 Logging into Azure Container Registry...${NC}"
az acr login --name acrgreenchainzprod916

# Step 2: Build Docker image
echo -e "${BLUE}🏗️  Building Docker image...${NC}"
cd backend
docker build -t $REGISTRY/$IMAGE_NAME:$TAG -t $REGISTRY/$IMAGE_NAME:latest .
cd ..

echo -e "${GREEN}✅ Image built: $IMAGE_NAME:$TAG${NC}"

# Step 3: Push to ACR
echo -e "${BLUE}📤 Pushing to Azure Container Registry...${NC}"
docker push $REGISTRY/$IMAGE_NAME:$TAG
docker push $REGISTRY/$IMAGE_NAME:latest

echo -e "${GREEN}✅ Image pushed to ACR${NC}"

# Step 4: Deploy to Container Apps
echo -e "${BLUE}🚀 Deploying to Azure Container Apps...${NC}"
az containerapp update \
  --name $CONTAINER_APP \
  --resource-group $RESOURCE_GROUP \
  --image $REGISTRY/$IMAGE_NAME:$TAG \
  --set-env-vars \
    NODE_ENV=production \
    AZURE_ENVIRONMENT=true \
    AZURE_REDIS_ENABLED=true \
    AZURE_KEYVAULT_ENABLED=true \
    AZURE_APPINSIGHTS_ENABLED=true \
    AZURE_DOC_INTEL_ENABLED=true \
    PORT=3001

echo -e "${GREEN}✅ Deployment initiated${NC}"

# Step 5: Get deployment URL
echo -e "${BLUE}🌐 Getting application URL...${NC}"
APP_URL=$(az containerapp show \
  --name $CONTAINER_APP \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Application URL: ${BLUE}https://$APP_URL${NC}"
echo ""

# Step 6: Health check
echo -e "${BLUE}🏥 Running health check...${NC}"
sleep 10

if curl -f -s "https://$APP_URL/" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Check logs with: az containerapp logs show --name $CONTAINER_APP --resource-group $RESOURCE_GROUP"
fi

echo ""
echo "View logs:"
echo "  az containerapp logs show --name $CONTAINER_APP --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "Scale container:"
echo "  az containerapp update --name $CONTAINER_APP --resource-group $RESOURCE_GROUP --min-replicas 1 --max-replicas 5"
