#!/bin/bash

# ============================================================================
# GreenChainz Pre-Deployment Test Script
# ============================================================================
# This script tests if the application is ready for deployment
# Run with: bash scripts/test-deployment-readiness.sh
# ============================================================================

set -e

echo "🧪 GreenChainz Pre-Deployment Test"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

# ============================================================================
# Test Functions
# ============================================================================

test_passed() {
  echo -e "${GREEN}✓${NC} $1"
  PASSED=$((PASSED + 1))
}

test_failed() {
  echo -e "${RED}✗${NC} $1"
  FAILED=$((FAILED + 1))
}

test_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

# ============================================================================
# 1. Check Node.js and npm
# ============================================================================
echo -e "${BLUE}1. Checking Node.js environment...${NC}"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  test_passed "Node.js installed: $NODE_VERSION"
else
  test_failed "Node.js not found"
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  test_passed "npm installed: $NPM_VERSION"
else
  test_failed "npm not found"
fi

echo ""

# ============================================================================
# 2. Check package.json integrity
# ============================================================================
echo -e "${BLUE}2. Checking package.json...${NC}"

if [ -f "package.json" ]; then
  test_passed "package.json exists"
  
  if node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>/dev/null; then
    test_passed "package.json is valid JSON"
  else
    test_failed "package.json is invalid JSON"
  fi
else
  test_failed "package.json not found"
fi

echo ""

# ============================================================================
# 3. Check critical files
# ============================================================================
echo -e "${BLUE}3. Checking critical files...${NC}"

CRITICAL_FILES=(
  "next.config.js"
  "tsconfig.json"
  "app/layout.tsx"
  "lib/supabase/client.ts"
  "lib/supabase/server.ts"
  "middleware.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    test_passed "$file exists"
  else
    test_failed "$file missing"
  fi
done

echo ""

# ============================================================================
# 4. Check for hardcoded secrets
# ============================================================================
echo -e "${BLUE}4. Checking for hardcoded secrets...${NC}"

HARDCODED_PATTERNS=(
  "7eaf7cc60234118db714b516e9228e49:sentry.server.config.ts:Hardcoded Sentry DSN"
  "ezgnhyymoqxaplungbabj:app/layout.tsx:Hardcoded Supabase URL"
  "your-org:next.config.js:Placeholder Sentry org"
)

for pattern in "${HARDCODED_PATTERNS[@]}"; do
  IFS=':' read -r search_term file description <<< "$pattern"
  if grep -q "$search_term" "$file" 2>/dev/null; then
    test_failed "$description found in $file"
  else
    test_passed "$description not found in $file"
  fi
done

echo ""

# ============================================================================
# 5. Check for duplicate code issue
# ============================================================================
echo -e "${BLUE}5. Checking for known code issues...${NC}"

SUPPLIER_RFQ_FILE="app/supplier/rfqs/[id]/page.tsx"
if [ -f "$SUPPLIER_RFQ_FILE" ]; then
  # Check if line 334 has the problematic pattern
  if sed -n '334p' "$SUPPLIER_RFQ_FILE" | grep -q "export const dynamic"; then
    test_failed "Duplicate code detected in $SUPPLIER_RFQ_FILE (line 334)"
  else
    test_passed "No duplicate code in $SUPPLIER_RFQ_FILE"
  fi
fi

echo ""

# ============================================================================
# 6. Check environment variables
# ============================================================================
echo -e "${BLUE}6. Checking environment variables...${NC}"

REQUIRED_ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
  if [ -n "${!var}" ]; then
    test_passed "$var is set"
  else
    test_warning "$var not set (required for deployment)"
  fi
done

echo ""

# ============================================================================
# 7. Check dependencies installation
# ============================================================================
echo -e "${BLUE}7. Checking dependencies...${NC}"

if [ -d "node_modules" ]; then
  test_passed "node_modules directory exists"
  
  # Check critical packages
  CRITICAL_PACKAGES=(
    "next"
    "@supabase/supabase-js"
    "@supabase/ssr"
    "react"
    "react-dom"
  )
  
  for pkg in "${CRITICAL_PACKAGES[@]}"; do
    if [ -d "node_modules/$pkg" ]; then
      test_passed "$pkg installed"
    else
      test_failed "$pkg not installed"
    fi
  done
else
  test_failed "node_modules not found - run 'npm install'"
fi

echo ""

# ============================================================================
# 8. Check TypeScript configuration
# ============================================================================
echo -e "${BLUE}8. Checking TypeScript...${NC}"

if [ -f "tsconfig.json" ]; then
  if command -v npx &> /dev/null; then
    echo "   Running TypeScript check (this may take a moment)..."
    
    if npx tsc --noEmit 2>&1 | head -20 > /tmp/tsc_errors.txt; then
      test_passed "TypeScript check passed"
    else
      ERROR_COUNT=$(grep -c "error TS" /tmp/tsc_errors.txt 2>/dev/null || echo "0")
      if [ "$ERROR_COUNT" -gt 0 ]; then
        test_failed "TypeScript errors found ($ERROR_COUNT errors)"
        echo ""
        echo "   First few errors:"
        head -10 /tmp/tsc_errors.txt | sed 's/^/   /'
      else
        test_warning "TypeScript check completed with warnings"
      fi
    fi
  else
    test_warning "Cannot run TypeScript check (npx not found)"
  fi
fi

echo ""

# ============================================================================
# 9. Check build configuration
# ============================================================================
echo -e "${BLUE}9. Checking build configuration...${NC}"

if grep -q "ignoreBuildErrors: true" next.config.js 2>/dev/null; then
  test_warning "TypeScript errors are ignored during build (next.config.js)"
fi

if grep -q "ignoreDuringBuilds: true" next.config.js 2>/dev/null; then
  test_warning "ESLint errors are ignored during build (next.config.js)"
fi

if [ -f ".env.local" ]; then
  test_warning ".env.local found - ensure secrets are not committed"
fi

if [ -f ".env" ]; then
  test_failed ".env found - should not be committed (use .env.local instead)"
fi

echo ""

# ============================================================================
# 10. Check Git status
# ============================================================================
echo -e "${BLUE}10. Checking Git status...${NC}"

if command -v git &> /dev/null; then
  if git rev-parse --git-dir > /dev/null 2>&1; then
    test_passed "Git repository detected"
    
    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
      test_passed "No uncommitted changes"
    else
      test_warning "Uncommitted changes detected"
    fi
    
    # Check branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo "   Current branch: $CURRENT_BRANCH"
    
  else
    test_warning "Not a Git repository"
  fi
else
  test_warning "Git not installed"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "===================================="
echo "📊 Test Summary"
echo "===================================="
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Commit your changes: git add . && git commit -m 'Ready for deployment'"
    echo "2. Push to trigger deployment: git push"
    echo "3. Monitor deployment in Vercel dashboard"
    exit 0
  else
    echo -e "${YELLOW}⚠️  Tests passed with warnings.${NC}"
    echo ""
    echo "Review warnings above before deploying."
    echo "You can proceed, but consider fixing warnings first."
    exit 0
  fi
else
  echo -e "${RED}❌ Deployment readiness check failed!${NC}"
  echo ""
  echo "Fix the issues above before deploying:"
  echo "1. Review CODE_REVIEW_REPORT.md for detailed solutions"
  echo "2. Run scripts/fix-deployment-issues.sh to auto-fix some issues"
  echo "3. Manually fix critical issues (especially duplicate code)"
  echo "4. Re-run this test: bash scripts/test-deployment-readiness.sh"
  exit 1
fi
