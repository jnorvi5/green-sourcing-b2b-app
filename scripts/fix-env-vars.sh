#!/bin/bash
# Fix TypeScript environment variable access errors
# Converts process.env.VAR to process.env['VAR'] for strict mode compliance

echo "🔧 Fixing TypeScript environment variable access..."
echo ""

# Files that need fixing based on type-check errors
files=(
  "app/api/agent/draft-response/route.ts"
  "app/api/agent/find-suppliers/route.ts"
  "app/api/auth/linkedin/callback/route.ts"
  "app/api/auth/linkedin/route.ts"
  "lib/auth/constants.ts"
  "lib/autodesk-sda.ts"
  "lib/geocode.ts"
  "lib/intercom.ts"
  "lib/supabase/admin.ts"
  "app/projects/[id]/page.tsx"
)

FIXED=0
SKIPPED=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Create backup
    cp "$file" "${file}.bak"
    
    # Fix process.env.VARIABLE to process.env['VARIABLE']
    # This regex handles:
    # - process.env.VAR_NAME
    # - process.env.NEXT_PUBLIC_VAR_NAME
    # Does NOT change:
    # - process.env['VAR_NAME'] (already correct)
    sed -i.tmp -E "s/process\.env\.([A-Z_][A-Z0-9_]*)/process.env['\1']/g" "$file"
    
    # Remove temporary file
    rm -f "${file}.tmp"
    
    # Check if file was actually modified
    if ! cmp -s "$file" "${file}.bak"; then
      echo "  ✅ Fixed"
      rm -f "${file}.bak"
      ((FIXED++))
    else
      echo "  ⏭️  No changes needed"
      rm -f "${file}.bak"
      ((SKIPPED++))
    fi
  else
    echo "  ⚠️  File not found: $file"
    ((SKIPPED++))
  fi
done

echo ""
echo "=========================================="
echo "Summary:"
echo "  Fixed: $FIXED files"
echo "  Skipped: $SKIPPED files"
echo ""

if [ $FIXED -gt 0 ]; then
  echo "✅ Environment variable access fixed in $FIXED files"
  echo ""
  echo "Run 'npm run type-check' to verify the fixes"
else
  echo "ℹ️  No files needed fixing"
fi

echo ""
echo "Note: Backups were created with .bak extension (if changes were made)"
echo "Run 'find . -name \"*.bak\" -delete' to remove backups after verification"
