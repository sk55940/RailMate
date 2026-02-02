# RailMate Quick Start Script
# This script starts both backend and frontend servers

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "      🚂 RailMate Starting Up       " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exist
$backendModules = Test-Path "backend\node_modules"
$frontendModules = Test-Path "frontend\node_modules"

if (-not $backendModules -or -not $frontendModules) {
    Write-Host "⚠️  Dependencies not installed!" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $backendModules) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        Set-Location backend
        npm install
        Set-Location ..
    }
    
    if (-not $frontendModules) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        Set-Location frontend
        npm install
        Set-Location ..
    }
    
    Write-Host ""
}

# Check if .env files exist
$backendEnv = Test-Path "backend\.env"
$frontendEnv = Test-Path "frontend\.env"

if (-not $backendEnv -or -not $frontendEnv) {
    Write-Host "⚠️  Environment files missing!" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $backendEnv) {
        Write-Host "❌ backend/.env not found" -ForegroundColor Red
        Write-Host "Please copy .env.example to backend/.env and fill in your credentials" -ForegroundColor Yellow
    }
    
    if (-not $frontendEnv) {
        Write-Host "❌ frontend/.env not found" -ForegroundColor Red
        Write-Host "Please copy .env.example to frontend/.env and add your Clerk key" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Start Backend Server
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend Server' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🚀 Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '💻 Frontend Server' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   ✅ RailMate Started Successfully  " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend API:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "📍 Frontend App: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Two terminal windows have opened:" -ForegroundColor Cyan
Write-Host "   1. Backend Server (Node.js + Express)" -ForegroundColor Gray
Write-Host "   2. Frontend Server (React + Vite)" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop servers: Press Ctrl+C in each terminal" -ForegroundColor Magenta
Write-Host ""
Write-Host "📖 Need help? Check README.md or SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
