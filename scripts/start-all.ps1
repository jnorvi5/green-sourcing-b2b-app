# Start all GreenChainz services (Windows PowerShell)

Write-Host "🚀 Starting GreenChainz Services..." -ForegroundColor Green

# Start backend
Write-Host "Starting Backend API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Start Next.js
Write-Host "Starting Next.js..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host ""
Write-Host "✅ All services starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Admin Dashboard: http://localhost:3001/admin/dashboard" -ForegroundColor Yellow
Write-Host "🛍️  Marketplace: http://localhost:5173" -ForegroundColor Yellow
Write-Host "🔧 API: http://localhost:3001/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the terminal windows to stop services" -ForegroundColor Gray
