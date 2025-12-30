# Deploy GreenChainz to Azure App Service (Windows PowerShell)

Write-Host "🚀 Deploying GreenChainz to Azure..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if Azure CLI is installed
$azInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azInstalled) {
    Write-Host "❌ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "🔐 Checking Azure authentication..." -ForegroundColor Cyan
az account show | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Azure:" -ForegroundColor Yellow
    az login
}

# Configuration
$resourceGroup = "greenchainz-prod"
$appName = "greenchainz-platform"

# Verify app exists
Write-Host "🔍 Verifying Azure App Service exists..." -ForegroundColor Cyan
az webapp show --name $appName --resource-group $resourceGroup | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ App Service '$appName' not found in resource group '$resourceGroup'!" -ForegroundColor Red
    Write-Host "Please create it first using AZURE-DEPLOYMENT.md guide" -ForegroundColor Yellow
    exit 1
}

# Build project
Write-Host "🏗️  Building Next.js standalone build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}

# Verify standalone folder exists
if (-not (Test-Path ".next/standalone")) {
    Write-Host "❌ Standalone build not found!" -ForegroundColor Red
    Write-Host "Ensure 'output: standalone' is set in next.config.mjs" -ForegroundColor Yellow
    exit 1
}

# Copy public and static files
Write-Host "📦 Preparing deployment package..." -ForegroundColor Cyan
if (Test-Path "public") {
    Copy-Item -Path "public" -Destination ".next/standalone/public" -Recurse -Force
}
if (Test-Path ".next/static") {
    Copy-Item -Path ".next/static" -Destination ".next/standalone/.next/static" -Recurse -Force
}

# Create deployment package
Write-Host "📦 Creating deployment zip..." -ForegroundColor Cyan
Push-Location ".next/standalone"
if (Test-Path "../../release.zip") {
    Remove-Item "../../release.zip"
}
Compress-Archive -Path * -DestinationPath "../../release.zip"
Pop-Location

if (-not (Test-Path "release.zip")) {
    Write-Host "❌ Failed to create deployment package!" -ForegroundColor Red
    exit 1
}

$zipSize = (Get-Item "release.zip").Length / 1MB
Write-Host "✅ Package created: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

# Deploy to Azure
Write-Host "🚀 Deploying to Azure App Service..." -ForegroundColor Cyan
Write-Host "   Resource Group: $resourceGroup" -ForegroundColor White
Write-Host "   App Service: $appName" -ForegroundColor White

az webapp deployment source config-zip `
    --resource-group $resourceGroup `
    --name $appName `
    --src release.zip

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your app is deploying at:" -ForegroundColor Cyan
    Write-Host "   https://$appName.azurewebsites.net" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Monitor deployment: Portal → $appName → Deployment Center" -ForegroundColor White
    Write-Host "2. View logs: az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor White
    Write-Host "3. Test the app: https://$appName.azurewebsites.net" -ForegroundColor White
    Write-Host "4. Configure environment variables (if not done): Portal → Configuration" -ForegroundColor White
    Write-Host "5. Set up custom domain (optional): Portal → Custom domains" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 View real-time logs:" -ForegroundColor Cyan
    Write-Host "   az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Verify Azure credentials: az account show" -ForegroundColor White
    Write-Host "2. Check app service exists: az webapp show --name $appName --resource-group $resourceGroup" -ForegroundColor White
    Write-Host "3. View Azure logs: az webapp log tail --name $appName --resource-group $resourceGroup" -ForegroundColor White
    Write-Host "4. Consult documentation: docs/AZURE-DEPLOYMENT.md" -ForegroundColor White
}

# Clean up
Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
if (Test-Path "release.zip") {
    Remove-Item "release.zip"
}
Write-Host "✅ Done!" -ForegroundColor Green
