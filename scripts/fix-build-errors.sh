#!/bin/bash
# Automated script to fix critical build errors identified in code review
# Run this script from the repository root: ./scripts/fix-build-errors.sh

set -e  # Exit on error

echo "🔧 GreenChainz Build Error Fix Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the repository root."
    exit 1
fi

# Fix #1: Add @/types/* path mapping to tsconfig.json
echo "📝 Fix #1: Adding @/types/* path mapping to tsconfig.json..."

# Check if the path already exists
if grep -q '"@/types/\*"' tsconfig.json; then
    echo "✅ @/types/* path already exists in tsconfig.json"
else
    # Use sed to add the path after @/lib/*
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|"@/lib/\*": \["lib/\*"\]|"@/lib/*": ["lib/*"],\
      "@/types/*": ["types/*"]|' tsconfig.json
    else
        # Linux
        sed -i 's|"@/lib/\*": \["lib/\*"\]|"@/lib/*": ["lib/*"],\n      "@/types/*": ["types/*"]|' tsconfig.json
    fi
    echo "✅ Added @/types/* path mapping"
fi

# Fix #2: Remove duplicate React imports in architect dashboard
echo ""
echo "📝 Fix #2: Fixing duplicate imports in app/architect/dashboard/page.tsx..."

if [ -f "app/architect/dashboard/page.tsx" ]; then
    # Check if duplicate imports exist
    if grep -q "^import { useState, useEffect } from 'react'$" app/architect/dashboard/page.tsx; then
        # Create a backup
        cp app/architect/dashboard/page.tsx app/architect/dashboard/page.tsx.backup
        
        # Remove the first duplicate import line
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' '/^import { useState, useEffect } from '\''react'\''$/d' app/architect/dashboard/page.tsx
        else
            # Linux
            sed -i '/^import { useState, useEffect } from '\''react'\''$/d' app/architect/dashboard/page.tsx
        fi
        
        echo "✅ Removed duplicate React imports"
        echo "   Backup saved at: app/architect/dashboard/page.tsx.backup"
    else
        echo "✅ No duplicate imports found (already fixed or different format)"
    fi
else
    echo "⚠️  File not found: app/architect/dashboard/page.tsx"
fi

# Fix #3: Add EPD_INTERNATIONAL_API_KEY to .env.example
echo ""
echo "📝 Fix #3: Adding EPD_INTERNATIONAL_API_KEY to .env.example..."

if [ -f ".env.example" ]; then
    if grep -q "EPD_INTERNATIONAL_API_KEY" .env.example; then
        echo "✅ EPD_INTERNATIONAL_API_KEY already in .env.example"
    else
        echo "" >> .env.example
        echo "# EPD International API" >> .env.example
        echo "EPD_INTERNATIONAL_API_KEY=your-epd-international-api-key" >> .env.example
        echo "✅ Added EPD_INTERNATIONAL_API_KEY to .env.example"
    fi
else
    echo "⚠️  .env.example not found"
fi

# Verify the fixes
echo ""
echo "🔍 Verifying fixes..."
echo ""

# Check tsconfig.json
echo "1. Checking tsconfig.json paths:"
if grep -q '"@/types/\*"' tsconfig.json; then
    echo "   ✅ @/types/* path mapping present"
else
    echo "   ❌ @/types/* path mapping missing"
fi

# Check architect dashboard
echo ""
echo "2. Checking architect dashboard imports:"
if [ -f "app/architect/dashboard/page.tsx" ]; then
    duplicate_count=$(grep -c "^import { useState, useEffect" app/architect/dashboard/page.tsx || echo "0")
    if [ "$duplicate_count" -le 1 ]; then
        echo "   ✅ No duplicate imports detected"
    else
        echo "   ⚠️  Still has duplicate imports"
    fi
else
    echo "   ⚠️  File not found"
fi

# Check .env.example
echo ""
echo "3. Checking .env.example:"
if [ -f ".env.example" ] && grep -q "EPD_INTERNATIONAL_API_KEY" .env.example; then
    echo "   ✅ EPD_INTERNATIONAL_API_KEY documented"
else
    echo "   ❌ EPD_INTERNATIONAL_API_KEY not documented"
fi

echo ""
echo "======================================"
echo "✨ Fix script completed!"
echo ""
echo "Next steps:"
echo "1. Review the changes in the files"
echo "2. Add EPD_INTERNATIONAL_API_KEY to your Vercel environment variables"
echo "3. Run 'npm run build' to verify the build succeeds"
echo "4. Commit and push the changes"
echo ""
echo "Commands to run:"
echo "  npm run build          # Test the build"
echo "  git add ."
echo "  git commit -m 'fix: resolve critical build errors'"
echo "  git push"
