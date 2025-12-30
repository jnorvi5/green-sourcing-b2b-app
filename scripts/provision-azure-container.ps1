# Usage: ./provision-azure-container.ps1
# Requires: Azure CLI (az login)

$ErrorActionPreference = "Stop"

# --- CONFIGURATION ---
$ResourceGroup = "rg-greenchainz-prod-container"
$Location = "eastus"
$AcrName = "acrgreenchainzprod$((Get-Random -Minimum 100 -Maximum 999))" # Must be unique/lowercase
$ContainerAppName = "ca-greenchainz-app"
$EnvName = "cae-greenchainz-env"

Write-Host "🚀 Starting GreenChainz Container Deployment..." -ForegroundColor Cyan

# 1. Create Resource Group
Write-Host "1️⃣  Creating Resource Group: $ResourceGroup..."
az group create --name $ResourceGroup --location $Location -o table

# 2. Create Container Registry (ACR) to store Docker images
Write-Host "2️⃣  Creating Azure Container Registry ($AcrName)..."
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --admin-enabled true -o table

# 3. Create Container Apps Environment
Write-Host "3️⃣  Creating Container Apps Environment..."
az containerapp env create --name $EnvName --resource-group $ResourceGroup --location $Location -o table

# 4. Get Credentials for GitHub Actions
$AcrServer = az acr show --name $AcrName --resource-group $ResourceGroup --query "loginServer" -o tsv
$AcrUsername = az acr credential show --name $AcrName --resource-group $ResourceGroup --query "username" -o tsv
$AcrPassword = az acr credential show --name $AcrName --resource-group $ResourceGroup --query "passwords[0].value" -o tsv

Write-Host "`n✅ Infrastructure Provisioned!" -ForegroundColor Green
Write-Host "--------------------------------------------------------"
Write-Host "ACTION REQUIRED: Add these secrets to GitHub Repo:"
Write-Host "1. AZURE_ACR_SERVER: $AcrServer"
Write-Host "2. AZURE_ACR_USERNAME: $AcrUsername"
Write-Host "3. AZURE_ACR_PASSWORD: [Hidden - Copied to Clipboard]"
Write-Host "4. AZURE_CONTAINER_APP_NAME: $ContainerAppName"
Write-Host "5. AZURE_RESOURCE_GROUP: $ResourceGroup"
Write-Host "--------------------------------------------------------"

# Copy password to clipboard for convenience
Set-Clipboard -Value $AcrPassword
Write-Host "🔑 Registry Password copied to clipboard!" -ForegroundColor Yellow
