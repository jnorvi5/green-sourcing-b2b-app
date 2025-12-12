# Automation Scripts

This directory contains automation scripts to maintain code quality and fix common issues identified in code reviews.

## Quick Start

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

**Last Updated:** 2025-12-12  
**Maintained By:** Development Team
