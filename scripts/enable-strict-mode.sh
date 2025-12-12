#!/bin/bash
# Enable Full TypeScript Strict Mode
# Updates tsconfig.json to enable full strict mode as per architecture requirements
# This ensures maximum type safety across the codebase

set -e

echo "🔧 Enabling full TypeScript strict mode..."

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
  
  let changes = [];
  
  // Enable strict mode
  if (tsconfig.compilerOptions.strict !== true) {
    tsconfig.compilerOptions.strict = true;
    changes.push('strict: true');
  }
  
  // Enable noUncheckedIndexedAccess for array safety
  if (tsconfig.compilerOptions.noUncheckedIndexedAccess !== true) {
    tsconfig.compilerOptions.noUncheckedIndexedAccess = true;
    changes.push('noUncheckedIndexedAccess: true');
  }
  
  if (changes.length > 0) {
    fs.writeFileSync(path, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log('✅ Enabled full strict mode in tsconfig.json:');
    changes.forEach(change => console.log('   -', change));
    console.log('');
    console.log('⚠️  This may reveal additional type errors that need fixing');
  } else {
    console.log('✅ Full strict mode already enabled');
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error updating tsconfig.json:', error.message);
  process.exit(1);
}
"

echo ""
echo "Next steps:"
echo "  1. Run: npm run type-check"
echo "  2. Review and fix any new errors revealed by strict mode"
echo "  3. Test: npm run test"
echo "  4. Build: npm run build"
