#!/bin/bash

# GreenChainz Quick Deployment Script
# Deploys all services with minimal configuration

set -e

echo "🚀 GreenChainz Quick Deploy"
echo "=========================="

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp .env.example .env
  echo "✅ Please configure .env with your credentials"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm run build
cd ..

# Build Next.js
echo "🏗️  Building Next.js app..."
npm run build

# Start services
echo "🎯 Starting services..."
echo "  - Backend API: http://localhost:3001"
echo "  - Frontend: http://localhost:5173"
echo "  - Admin Dashboard: http://localhost:3001/admin/dashboard"

# Start backend in background
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Start Next.js
npm start &
NEXTJS_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Admin Dashboard: http://localhost:3001/admin/dashboard"
echo "🛍️  Marketplace: http://localhost:5173"
echo "🔧 API: http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C and kill all processes
trap "kill $BACKEND_PID $FRONTEND_PID $NEXTJS_PID; exit" INT

wait
