#!/bin/bash
# Fix Index Signature Access in Test Files
# This script converts dot notation to bracket notation for process.env access
# in test files to comply with noPropertyAccessFromIndexSignature TypeScript rule

set -e

echo "🔧 Fixing index signature access in test files..."

# Find all test files
find app/api -name "*.test.ts" -type f | while read -r file; do
  echo "  Processing: $file"
  
  # Create backup
  cp "$file" "$file.bak"
  
  # Fix common process.env accesses
  sed -i \
    -e 's/process\.env\.RESEND_API_KEY/process.env["RESEND_API_KEY"]/g' \
    -e 's/process\.env\.NEXT_PUBLIC_BASE_URL/process.env["NEXT_PUBLIC_BASE_URL"]/g' \
    -e 's/process\.env\.NEXT_PUBLIC_SUPABASE_URL/process.env["NEXT_PUBLIC_SUPABASE_URL"]/g' \
    -e 's/process\.env\.SUPABASE_SERVICE_ROLE_KEY/process.env["SUPABASE_SERVICE_ROLE_KEY"]/g' \
    "$file"
  
  # Remove backup if successful
  rm "$file.bak"
done

echo "✅ Fixed index signature access in test files"
echo ""
echo "Next steps:"
echo "  1. Run: npm run type-check"
echo "  2. Review changes with: git diff app/api"
echo "  3. Test: npm run test"
