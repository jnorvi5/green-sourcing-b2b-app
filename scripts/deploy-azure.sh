#!/bin/bash

# Deploy GreenChainz to Azure App Service (Linux/Mac)

set -e  # Exit on error

echo "🚀 Deploying GreenChainz to Azure..."
echo "======================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed!"
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
echo "🔐 Checking Azure authentication..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure:"
    az login
fi

# Configuration
RESOURCE_GROUP="greenchainz-prod"
APP_NAME="greenchainz-platform"

# Verify app exists
echo "🔍 Verifying Azure App Service exists..."
if ! az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo "❌ App Service '$APP_NAME' not found in resource group '$RESOURCE_GROUP'!"
    echo "Please create it first using AZURE-DEPLOYMENT.md guide"
    exit 1
fi

# Build project
echo "🏗️  Building Next.js standalone build..."
npm run build

# Verify standalone folder exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Standalone build not found!"
    echo "Ensure 'output: standalone' is set in next.config.mjs"
    exit 1
fi

# Copy public and static files
echo "📦 Preparing deployment package..."
if [ -d "public" ]; then
    cp -r public .next/standalone/public
fi
if [ -d ".next/static" ]; then
    cp -r .next/static .next/standalone/.next/static
fi

# Create deployment package
echo "📦 Creating deployment zip..."
cd .next/standalone
rm -f ../../release.zip
zip -r ../../release.zip .
cd ../..

if [ ! -f "release.zip" ]; then
    echo "❌ Failed to create deployment package!"
    exit 1
fi

ZIP_SIZE=$(du -h release.zip | cut -f1)
echo "✅ Package created: $ZIP_SIZE"

# Deploy to Azure
echo "🚀 Deploying to Azure App Service..."
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Service: $APP_NAME"

az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src release.zip

echo ""
echo "✅ Deployment successful!"
echo ""
echo "🌐 Your app is deploying at:"
echo "   https://$APP_NAME.azurewebsites.net"
echo ""
echo "📊 Next steps:"
echo "1. Monitor deployment: Portal → $APP_NAME → Deployment Center"
echo "2. View logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "3. Test the app: https://$APP_NAME.azurewebsites.net"
echo "4. Configure environment variables (if not done): Portal → Configuration"
echo "5. Set up custom domain (optional): Portal → Custom domains"
echo ""
echo "🔍 View real-time logs:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"

# Clean up
echo ""
echo "🧹 Cleaning up..."
rm -f release.zip
echo "✅ Done!"
