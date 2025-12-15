#!/bin/bash

# ============================================
# Jules Local Development Setup
# ============================================
# This script loads environment variables from .jules/secrets.json
# and runs the app locally with those secrets

set -e

echo "🚀 GreenChainz Jules Local Setup"
echo "================================="

# Check if secrets.json exists
if [ ! -f ".jules/secrets.json" ]; then
    echo "❌ Error: .jules/secrets.json not found"
    echo "Please create .jules/secrets.json with your secrets"
    exit 1
fi

echo "✅ Loading secrets from .jules/secrets.json"

# Use node to parse JSON and export as env vars
node -e "
const fs = require('fs');
const secrets = JSON.parse(fs.readFileSync('./.jules/secrets.json', 'utf8'));
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`export ${key}='${value}'`);
});
" > .env.local.tmp

# Source the temporary env file
source .env.local.tmp
rm .env.local.tmp

echo "✅ Environment variables loaded"
echo ""
echo "Environment variables set:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - NEXT_PUBLIC_BASE_URL"
echo ""

# Also create .env.local for IDE/editor support
echo "Creating .env.local for IDE support..."
cat > .env.local << 'EOF'
# These are loaded from .jules/secrets.json at runtime
# Update the secrets.json file if you need to change them
EOF

echo "✅ Created .env.local"
echo ""
echo "Starting development server..."
echo "http://localhost:3000"
echo ""

# Run the dev server
npm run dev
