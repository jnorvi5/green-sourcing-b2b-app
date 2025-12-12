#!/bin/bash
# Add Jest Types to TypeScript Configuration
# This script adds 'jest' to the types array in tsconfig.json
# to resolve ~150 test file errors related to missing Jest type definitions

set -e

echo "🔧 Adding Jest types to tsconfig.json..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found"
    exit 1
fi

# Use Node.js to safely update JSON
node -e "
const fs = require('fs');
const path = 'tsconfig.json';

try {
  const tsconfig = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  // Ensure types array exists
  if (!tsconfig.compilerOptions.types) {
    tsconfig.compilerOptions.types = [];
  }
  
  // Add jest if not present
  if (!tsconfig.compilerOptions.types.includes('jest')) {
    tsconfig.compilerOptions.types.push('jest');
    fs.writeFileSync(path, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log('✅ Added \"jest\" to types array in tsconfig.json');
    process.exit(0);
  } else {
    console.log('✅ \"jest\" already in types array');
    process.exit(0);
  }
} catch (error) {
  console.error('❌ Error updating tsconfig.json:', error.message);
  process.exit(1);
}
"

echo ""
echo "Next steps:"
echo "  1. Run: npm run type-check"
echo "  2. Verify Jest test globals are recognized"
echo "  3. Test: npm run test"
