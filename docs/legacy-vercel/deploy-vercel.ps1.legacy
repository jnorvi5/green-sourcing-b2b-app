# Deploy GreenChainz to Vercel (Windows PowerShell)

Write-Host "🚀 Deploying GreenChainz to Vercel..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if logged in
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Cyan
vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Vercel:" -ForegroundColor Yellow
    vercel login
}

# Build project
Write-Host "🏗️  Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
$deployType = Read-Host "Deploy to (1) Production or (2) Preview? [1/2]"

if ($deployType -eq "1") {
    Write-Host "Deploying to PRODUCTION..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host "Deploying to PREVIEW..." -ForegroundColor Yellow
    vercel
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure environment variables in Vercel Dashboard" -ForegroundColor White
    Write-Host "2. Test admin dashboard: /admin/dashboard" -ForegroundColor White
    Write-Host "3. Check API health: /api/health" -ForegroundColor White
    Write-Host "4. Set up custom domain (optional)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
}
