#!/bin/bash
# GreenChainz Deployment Readiness Test
# Tests that the application is ready to deploy to Vercel

set -e  # Exit on error

echo "🧪 GreenChainz Deployment Readiness Test"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Function to check a file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1 found"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $1 missing"
    ((FAIL++))
  fi
}

# Function to check a directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} $1 found"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $1 missing"
    ((FAIL++))
  fi
}

# Test 1: Check critical configuration files
echo "1️⃣  Checking critical configuration files..."
check_file "package.json"
check_file "next.config.mjs"
check_file "vercel.json"
check_file "tsconfig.json"
check_file ".env.example"
echo ""

# Test 2: Check critical directories
echo "2️⃣  Checking critical directories..."
check_dir "app"
check_dir "components"
check_dir "lib"
check_dir "public"
echo ""

# Test 3: Check dependencies installed
echo "3️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
  echo -e "${GREEN}✅${NC} node_modules found"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️${NC}  node_modules not found. Installing dependencies..."
  npm ci
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅${NC} Dependencies installed successfully"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} Failed to install dependencies"
    ((FAIL++))
    exit 1
  fi
fi
echo ""

# Test 4: Run production build
echo "4️⃣  Running production build..."
echo "   This may take 2-3 minutes..."
if npm run build > /tmp/build-output.log 2>&1; then
  echo -e "${GREEN}✅${NC} Build completed successfully"
  ((PASS++))
  
  # Check for warnings
  if grep -q "⚠" /tmp/build-output.log; then
    echo -e "${YELLOW}⚠️${NC}  Build completed with warnings (non-blocking)"
    grep "⚠" /tmp/build-output.log | head -5
  fi
else
  echo -e "${RED}❌${NC} Build failed"
  echo ""
  echo "Build errors:"
  tail -20 /tmp/build-output.log
  ((FAIL++))
  exit 1
fi
echo ""

# Test 5: Check for required environment variable examples
echo "5️⃣  Checking environment variable documentation..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.example; then
  echo -e "${GREEN}✅${NC} Supabase config documented in .env.example"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️${NC}  Supabase config not documented in .env.example"
fi
echo ""

# Test 6: Check critical files exist
echo "6️⃣  Checking critical application files..."
check_file "app/layout.tsx"
check_file "app/page.tsx"
check_file "middleware.ts"
check_file "lib/supabase/client.ts"
check_file "lib/supabase/server.ts"
echo ""

# Test 7: Check for common deployment issues
echo "7️⃣  Checking for common deployment issues..."

# Check for hardcoded secrets (basic check)
if grep -r "sk_live_" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".env" | grep -q "sk_live_"; then
  echo -e "${RED}❌${NC} WARNING: Potential hardcoded Stripe key found"
  ((FAIL++))
else
  echo -e "${GREEN}✅${NC} No hardcoded Stripe keys detected"
  ((PASS++))
fi

# Check for console.logs in production code (warning only)
LOG_COUNT=$(grep -r "console.log" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -gt 50 ]; then
  echo -e "${YELLOW}⚠️${NC}  Found $LOG_COUNT console.log statements (consider removing for production)"
else
  echo -e "${GREEN}✅${NC} Console.log usage reasonable ($LOG_COUNT occurrences)"
  ((PASS++))
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! App is ready to deploy to Vercel.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Configure environment variables in Vercel"
  echo "2. Push to GitHub: git push origin main"
  echo "3. Monitor deployment in Vercel dashboard"
  echo ""
  echo "See CODE_REVIEW_REPORT.md for detailed deployment instructions."
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please fix the issues before deploying.${NC}"
  echo ""
  echo "Check the output above for specific errors."
  exit 1
fi
