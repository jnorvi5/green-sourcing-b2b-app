# Automation Scripts

This directory contains automation scripts to maintain code quality, fix common issues, and prepare for deployment.

## Quick Start - Deployment Preparation

For deployment readiness (NEW - Dec 2025):

```bash
# 1. Test if ready for deployment
bash scripts/test-deployment-readiness.sh

# 2. Auto-fix common deployment blockers
bash scripts/fix-deployment-issues.sh

# 3. Test again to verify fixes
bash scripts/test-deployment-readiness.sh

# 4. Manual fixes (see CODE_REVIEW_REPORT.md)
# - Fix duplicate code in app/supplier/rfqs/[id]/page.tsx
# - Set up Vercel environment variables (see VERCEL_ENV_CHECKLIST.md)
# - Add GitHub secrets

# 5. Test build locally
npm run build
```

## Quick Start - Code Quality

Run all recommended fixes in order:

```bash
# 1. Add Jest types to TypeScript (fixes ~150 test errors)
./scripts/add-jest-types.sh

# 2. Fix index signature access patterns (fixes ~40 test errors)
./scripts/fix-index-signatures.sh

# 3. Enable full TypeScript strict mode (architecture compliance)
./scripts/enable-strict-mode.sh

# 4. Clean up stale files (improves organization)
./scripts/cleanup-stale-files.sh

# 5. Verify fixes
npm run type-check
npm run lint
npm run test
```

## Available Scripts

---

## 🚀 Deployment Scripts (NEW)

### `test-deployment-readiness.sh`
**Purpose:** Pre-deployment test suite that checks for common deployment blockers  
**Category:** Deployment  
**Safe:** Yes, read-only checks  

**What it checks:**
- ✅ Node.js and npm installation
- ✅ Critical files existence
- ✅ Hardcoded secrets/credentials
- ✅ Known code issues (duplicate code)
- ✅ Environment variables
- ✅ Dependencies installation
- ✅ TypeScript compilation
- ✅ Build configuration
- ✅ Git status

**Usage:**
```bash
bash scripts/test-deployment-readiness.sh
# Returns exit code 0 if ready, 1 if issues found
```

**Output:**
- 🟢 Green checkmarks: Tests passed
- 🔴 Red X: Critical failures
- 🟡 Yellow warnings: Non-critical issues

---

### `fix-deployment-issues.sh`
**Purpose:** Automatically fixes common deployment issues  
**Category:** Deployment  
**Safe:** Yes, creates backups before modifying files  

**What it fixes:**
- 🔒 Removes hardcoded Sentry DSN
- 🔗 Fixes hardcoded Supabase URL in layout
- ⚙️ Updates Sentry org placeholder
- 🤖 Adds PUPPETEER_SKIP_DOWNLOAD to CI workflows
- 🔇 Disables problematic backend CI workflow
- 🔐 Generates secrets templates
- 📋 Creates environment variables checklist

**Usage:**
```bash
bash scripts/fix-deployment-issues.sh
# Creates backups in .backups/YYYYMMDD_HHMMSS/
```

**Generated Files:**
- `.env.secrets.template` - Template for generating secure secrets
- `VERCEL_ENV_CHECKLIST.md` - Complete environment variables checklist
- `.backups/*/` - Backup directory with original files

**Manual fixes still needed:**
- ❗ Fix duplicate code in `app/supplier/rfqs/[id]/page.tsx` (lines 334-468)
- ❗ Set up environment variables in Vercel
- ❗ Add GitHub secrets

---

## 🛠️ Code Quality Scripts

### `add-jest-types.sh`
**Purpose:** Adds Jest type definitions to `tsconfig.json`  
**Fixes:** ~150 TypeScript errors in test files (`Cannot find name 'describe'`, `jest`, `expect`, etc.)  
**Safe:** Yes, only modifies `tsconfig.json` types array  

**Usage:**
```bash
./scripts/add-jest-types.sh
```

**Before:**
```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

**After:**
```json
{
  "compilerOptions": {
    "types": ["node", "jest"]
  }
}
```

---

### `fix-index-signatures.sh`
**Purpose:** Converts dot notation to bracket notation for `process.env` access in test files  
**Fixes:** ~40 TypeScript errors (`Property 'X' comes from an index signature, so it must be accessed with ['X']`)  
**Safe:** Creates backups (`.bak`) before modifying  

**Usage:**
```bash
./scripts/fix-index-signatures.sh
```

**Before:**
```typescript
process.env.RESEND_API_KEY
process.env.NEXT_PUBLIC_BASE_URL
```

**After:**
```typescript
process.env['RESEND_API_KEY']
process.env['NEXT_PUBLIC_BASE_URL']
```

**Affected Files:**
- `app/api/**/__tests__/*.test.ts`

---

### `enable-strict-mode.sh`
**Purpose:** Enables full TypeScript strict mode as per architecture requirements  
**Fixes:** Ensures `strict: true` and `noUncheckedIndexedAccess: true` in `tsconfig.json`  
**Safe:** Yes, only modifies `tsconfig.json` compiler options  

**Usage:**
```bash
./scripts/enable-strict-mode.sh
```

**Changes:**
```json
{
  "compilerOptions": {
    "strict": true,              // Was: false
    "noUncheckedIndexedAccess": true  // Was: false
  }
}
```

**⚠️ Warning:** May reveal additional type errors that need manual fixing

---

### `cleanup-stale-files.sh`
**Purpose:** Moves marketing pitch HTML files from root to `docs/marketing/pitches/`  
**Fixes:** Repository organization, prevents Next.js routing conflicts  
**Safe:** Yes, only moves files (doesn't delete)  

**Usage:**
```bash
./scripts/cleanup-stale-files.sh
```

**Files Moved:**
- `architects-pitch.html`
- `buyers-pitch.html`
- `data-providers-pitch.html`
- `founding-50.html`
- `suppliers-pitch.html`
- `temp-landing.html`

**Note:** `index.html` requires manual review (may conflict with Next.js)

---

## Testing After Fixes

After running scripts, verify everything works:

```bash
# Check TypeScript compilation
npm run type-check

# Check linting
npm run lint

# Run tests
npm run test

# Build project
npm run build
```

## Troubleshooting

### "Permission denied" error
```bash
chmod +x scripts/*.sh
```

### "Node.js not found" error
Scripts require Node.js for JSON manipulation:
```bash
# Check Node version
node --version  # Should be v18 or higher
```

### Unexpected changes
All scripts create backups or are non-destructive:
- `fix-index-signatures.sh` creates `.bak` files
- Other scripts only modify configuration files
- Review changes before committing:
  ```bash
  git diff
  ```

## Related Documentation

- **CODE_REVIEW_REPORT.md** - Comprehensive deployment issues analysis (NEW - Dec 2025)
- **VERCEL_ENV_CHECKLIST.md** - Environment variables checklist (generated by fix-deployment-issues.sh)
- **CODE_REVIEW_REPORT_COMPREHENSIVE.md** - Full code quality analysis
- **.github/copilot-instructions.md** - Architecture and coding standards
- **tsconfig.json** - TypeScript configuration
- **jest.config.js** - Jest test configuration

## Typical Workflow

### First Time Deployment Setup

```bash
# 1. Clone and setup
git clone <repo>
cd green-sourcing-b2b-app

# 2. Install dependencies
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 3. Run deployment readiness test
bash scripts/test-deployment-readiness.sh

# 4. Fix issues automatically
bash scripts/fix-deployment-issues.sh

# 5. Manually fix remaining issues
# - Fix duplicate code in app/supplier/rfqs/[id]/page.tsx
# - Review CODE_REVIEW_REPORT.md for details

# 6. Test again
bash scripts/test-deployment-readiness.sh

# 7. Setup environment variables
# - Follow VERCEL_ENV_CHECKLIST.md
# - Generate secrets: openssl rand -base64 32
# - Add to Vercel dashboard

# 8. Test build locally
npm run build

# 9. Deploy
git add .
git commit -m "Fix deployment issues"
git push
```

### Before Each Deployment

```bash
# Quick pre-deployment check
bash scripts/test-deployment-readiness.sh

# If issues found, review and fix
# Then test again
```

---

## Related Documentation

- **CODE_REVIEW_REPORT_COMPREHENSIVE.md** - Full analysis and recommendations
- **.github/copilot-instructions.md** - Architecture and coding standards
- **tsconfig.json** - TypeScript configuration
- **jest.config.js** - Jest test configuration

## Contributing

When adding new automation scripts:

1. Follow the existing format (include purpose, usage, example)
2. Make scripts idempotent (safe to run multiple times)
3. Add error handling (`set -e`)
4. Provide clear output with emoji indicators (✅ ⚠️ ❌)
5. Update this README
6. Test on a clean branch before committing

---

**Last Updated:** 2025-12-23  
**Maintained By:** Development Team  
**Latest Changes:** Added deployment readiness scripts (test-deployment-readiness.sh, fix-deployment-issues.sh)
