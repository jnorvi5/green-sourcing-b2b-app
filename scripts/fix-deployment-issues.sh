#!/bin/bash

# ============================================================================
# GreenChainz Deployment Issues Auto-Fix Script
# ============================================================================
# This script automates fixes for common deployment blockers
# Run with: bash scripts/fix-deployment-issues.sh
# ============================================================================

set -e  # Exit on error

echo "🔧 GreenChainz Deployment Auto-Fix Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track fixes
FIXES_APPLIED=0
MANUAL_FIXES_NEEDED=0

# ============================================================================
# 1. Backup critical files
# ============================================================================
echo "📦 Creating backups..."
mkdir -p .backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backups/$(date +%Y%m%d_%H%M%S)"

cp next.config.js "$BACKUP_DIR/" 2>/dev/null || true
cp sentry.server.config.ts "$BACKUP_DIR/" 2>/dev/null || true
cp app/layout.tsx "$BACKUP_DIR/" 2>/dev/null || true
cp app/supplier/rfqs/\[id\]/page.tsx "$BACKUP_DIR/" 2>/dev/null || true

echo -e "${GREEN}✓${NC} Backups created in $BACKUP_DIR"
echo ""

# ============================================================================
# 2. Fix Sentry hardcoded DSN
# ============================================================================
echo "🔒 Fixing Sentry hardcoded DSN..."
if grep -q "7eaf7cc60234118db714b516e9228e49" sentry.server.config.ts 2>/dev/null; then
  sed -i.bak 's/dsn: process\.env\['\''NEXT_PUBLIC_SENTRY_DSN'\''\] || "https:\/\/[^"]*"/dsn: process.env[\x27NEXT_PUBLIC_SENTRY_DSN\x27]/' sentry.server.config.ts
  echo -e "${GREEN}✓${NC} Removed hardcoded Sentry DSN from sentry.server.config.ts"
  FIXES_APPLIED=$((FIXES_APPLIED + 1))
else
  echo -e "${YELLOW}⊘${NC} Sentry DSN already fixed or file not found"
fi
echo ""

# ============================================================================
# 3. Fix hardcoded Supabase URL in layout
# ============================================================================
echo "🔗 Fixing hardcoded Supabase URL in layout..."
if grep -q "ezgnhyymoqxaplungbabj.supabase.co" app/layout.tsx 2>/dev/null; then
  # Create a backup
  cp app/layout.tsx app/layout.tsx.bak
  
  # Replace hardcoded URLs with environment variable
  cat > /tmp/layout_fix.txt << 'EOF'
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        )}
EOF
  
  # Use sed to replace the hardcoded section
  sed -i.bak '/rel="preconnect"/,/rel="dns-prefetch"/c\        {process.env.NEXT_PUBLIC_SUPABASE_URL && (\
          <>\
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />\
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />\
          </>\
        )}' app/layout.tsx || true
  
  echo -e "${GREEN}✓${NC} Updated Supabase URLs to use environment variable"
  FIXES_APPLIED=$((FIXES_APPLIED + 1))
else
  echo -e "${YELLOW}⊘${NC} Supabase URL already fixed or file not found"
fi
echo ""

# ============================================================================
# 4. Fix Sentry config in next.config.js
# ============================================================================
echo "⚙️  Fixing Sentry org placeholder in next.config.js..."
if grep -q 'org: "your-org"' next.config.js 2>/dev/null; then
  sed -i.bak 's/org: "your-org"/org: process.env.SENTRY_ORG || "greenchainz"/' next.config.js
  echo -e "${GREEN}✓${NC} Updated Sentry org to use environment variable"
  FIXES_APPLIED=$((FIXES_APPLIED + 1))
else
  echo -e "${YELLOW}⊘${NC} Sentry org already fixed or file not found"
fi
echo ""

# ============================================================================
# 5. Add PUPPETEER_SKIP_DOWNLOAD to workflows
# ============================================================================
echo "🤖 Fixing Puppeteer download in CI workflows..."
for workflow in .github/workflows/vercel-deploy.yml .github/workflows/deploy-production.yml; do
  if [ -f "$workflow" ]; then
    if ! grep -q "PUPPETEER_SKIP_DOWNLOAD" "$workflow"; then
      # Add environment variable to npm install steps
      sed -i.bak '/npm ci/i\        env:\n          PUPPETEER_SKIP_DOWNLOAD: '\''true'\''' "$workflow"
      echo -e "${GREEN}✓${NC} Added PUPPETEER_SKIP_DOWNLOAD to $workflow"
      FIXES_APPLIED=$((FIXES_APPLIED + 1))
    else
      echo -e "${YELLOW}⊘${NC} PUPPETEER_SKIP_DOWNLOAD already present in $workflow"
    fi
  fi
done
echo ""

# ============================================================================
# 6. Disable problematic CI workflow
# ============================================================================
echo "🔇 Disabling problematic backend CI workflow..."
if [ -f ".github/workflows/ci.yml" ]; then
  if ! [ -f ".github/workflows/ci.yml.disabled" ]; then
    mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
    echo -e "${GREEN}✓${NC} Disabled ci.yml workflow (references non-existent backend)"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
  else
    echo -e "${YELLOW}⊘${NC} ci.yml already disabled"
  fi
else
  echo -e "${YELLOW}⊘${NC} ci.yml not found"
fi
echo ""

# ============================================================================
# 7. Generate secrets template
# ============================================================================
echo "🔐 Generating secrets template..."
cat > .env.secrets.template << 'EOF'
# ============================================================================
# REQUIRED SECRETS FOR DEPLOYMENT
# ============================================================================
# Generate these and add to Vercel Environment Variables
# DO NOT commit this file with actual values
# ============================================================================

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=

# Generate with: openssl rand -base64 32
CRON_SECRET=

# Get from Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=

# Get from email provider
RESEND_API_KEY=
# OR
ZOHO_SMTP_PASS=

# Optional but recommended
AWS_SECRET_ACCESS_KEY=
AZURE_OPENAI_KEY=
STRIPE_SECRET_KEY=
SENTRY_AUTH_TOKEN=
EOF

echo -e "${GREEN}✓${NC} Created .env.secrets.template"
echo "   Run: openssl rand -base64 32  # To generate secrets"
FIXES_APPLIED=$((FIXES_APPLIED + 1))
echo ""

# ============================================================================
# 8. MANUAL FIX NEEDED: Duplicate code in supplier RFQ page
# ============================================================================
echo "⚠️  CRITICAL: Manual fix required for duplicate code"
echo ""
echo -e "${RED}📝 Action Required:${NC}"
echo "   File: app/supplier/rfqs/[id]/page.tsx"
echo "   Issue: Duplicate component definition starting at line 334"
echo "   Fix: Remove lines 334-468 (duplicate code)"
echo ""
echo "   The file appears to have duplicate code pasted in the middle of JSX."
echo "   This must be fixed manually to restore proper TypeScript compilation."
echo ""
echo "   Backup created at: $BACKUP_DIR/page.tsx"
echo ""
MANUAL_FIXES_NEEDED=$((MANUAL_FIXES_NEEDED + 1))

# ============================================================================
# 9. Create environment variable checklist
# ============================================================================
echo "📋 Creating environment variables checklist..."
cat > VERCEL_ENV_CHECKLIST.md << 'EOF'
# Vercel Environment Variables Checklist

## Required for Basic Deployment

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - https://your-project.supabase.co
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Get from Supabase Dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard (Server-side only)
- [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `CRON_SECRET` - Generate with `openssl rand -base64 32`

## Email (Choose ONE)

### Option A: Resend (Recommended)
- [ ] `RESEND_API_KEY` - Get from Resend Dashboard
- [ ] `RESEND_FROM_EMAIL` - noreply@greenchainz.com

### Option B: Zoho Mail
- [ ] `ZOHO_SMTP_USER` - noreply@greenchainz.com
- [ ] `ZOHO_SMTP_PASS` - App password from Zoho
- [ ] `ZOHO_SMTP_HOST` - smtp.zoho.com
- [ ] `ZOHO_SMTP_PORT` - 587

## Optional Services

### AWS S3 (File Uploads)
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` - us-east-1
- [ ] `AWS_BUCKET_NAME` - greenchainz-production

### Azure OpenAI (AI Features)
- [ ] `AZURE_OPENAI_ENDPOINT`
- [ ] `AZURE_OPENAI_KEY`
- [ ] `AZURE_OPENAI_DEPLOYMENT_NAME` - gpt-4o

### Stripe (Payments)
- [ ] `STRIPE_SECRET_KEY` - sk_live_...
- [ ] `STRIPE_PUBLISHABLE_KEY` - pk_live_...
- [ ] `STRIPE_WEBHOOK_SECRET` - whsec_...

### Sentry (Error Tracking)
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_ORG` - Your organization slug
- [ ] `SENTRY_PROJECT` - greenchainz-production
- [ ] `SENTRY_AUTH_TOKEN` - For source map upload

### Analytics & Support
- [ ] `NEXT_PUBLIC_INTERCOM_APP_ID`
- [ ] `NEXT_PUBLIC_GA_ID` - G-XXXXXXXXXX

## How to Add in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable
5. Select appropriate scope (Production/Preview/Development)
6. Redeploy after adding variables

## GitHub Secrets

Add these to GitHub → Settings → Secrets and variables → Actions:

- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
EOF

echo -e "${GREEN}✓${NC} Created VERCEL_ENV_CHECKLIST.md"
FIXES_APPLIED=$((FIXES_APPLIED + 1))
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "=========================================="
echo "🎉 Auto-Fix Complete!"
echo "=========================================="
echo ""
echo -e "${GREEN}Automatic fixes applied: $FIXES_APPLIED${NC}"
echo -e "${YELLOW}Manual fixes needed: $MANUAL_FIXES_NEEDED${NC}"
echo ""

if [ $MANUAL_FIXES_NEEDED -gt 0 ]; then
  echo -e "${RED}⚠️  CRITICAL: Manual intervention required${NC}"
  echo ""
  echo "Please complete these manual fixes before deploying:"
  echo "1. Fix duplicate code in app/supplier/rfqs/[id]/page.tsx (lines 334-468)"
  echo "2. Review and test the automatic changes"
  echo "3. Set up environment variables in Vercel (see VERCEL_ENV_CHECKLIST.md)"
  echo "4. Add GitHub secrets for deployment workflows"
  echo ""
fi

echo "📚 Next Steps:"
echo "1. Review CODE_REVIEW_REPORT.md for detailed analysis"
echo "2. Review VERCEL_ENV_CHECKLIST.md for environment setup"
echo "3. Fix the critical TypeScript error in supplier RFQ page"
echo "4. Test build locally: npm run build"
echo "5. Commit and push changes"
echo ""

echo "📦 Backups stored in: $BACKUP_DIR"
echo ""
echo "✅ Done!"
