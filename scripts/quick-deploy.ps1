# GreenChainz Quick Deployment Script (Windows PowerShell)
# Deploys all services with minimal configuration

Write-Host "🚀 GreenChainz Quick Deploy" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  No .env file found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Please configure .env with your credentials" -ForegroundColor Green
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
Set-Location frontend
npm install
Set-Location ..
Set-Location backend
npm install
Set-Location ..

# Build frontend
Write-Host "🏗️  Building frontend..." -ForegroundColor Cyan
Set-Location frontend
npm run build
Set-Location ..

# Build Next.js
Write-Host "🏗️  Building Next.js app..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start services, run:" -ForegroundColor Yellow
Write-Host "  Backend:  cd backend && npm start" -ForegroundColor White
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "  Next.js:  npm start" -ForegroundColor White
Write-Host ""
Write-Host "📊 Admin Dashboard: http://localhost:3001/admin/dashboard" -ForegroundColor Cyan
Write-Host "🛍️  Marketplace: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 API: http://localhost:3001/api" -ForegroundColor Cyan
