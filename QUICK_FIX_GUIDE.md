# Quick Fix Guide - GreenChainz Build Errors

**Last Updated**: December 9, 2024  
**Review Report**: See `CODE_REVIEW_REPORT.md` for detailed analysis

---

## 🚨 Critical Errors Summary

Your build is failing due to **3 critical errors**:

1. ❌ Missing `@/types/*` path in `tsconfig.json`
2. ❌ Duplicate React imports in `app/architect/dashboard/page.tsx`
3. ⚠️ Missing `EPD_INTERNATIONAL_API_KEY` environment variable

**Estimated Fix Time**: 15-20 minutes

---

## 🔧 Automated Fix (Recommended)

Run the automated fix script:

```bash
# From repository root
./scripts/fix-build-errors.sh

# Then test the build
npm run build
```

---

## 🛠️ Manual Fix (Step by Step)

### Fix #1: Add Types Path Mapping

**File**: `tsconfig.json`

Find this section (around line 8):
```json
"paths": {
  "@/app/*": ["app/*"],
  "@/components/*": ["components/*"],
  "@/lib/*": ["lib/*"]
}
```

Change to:
```json
"paths": {
  "@/app/*": ["app/*"],
  "@/components/*": ["components/*"],
  "@/lib/*": ["lib/*"],
  "@/types/*": ["types/*"]
}
```

---

### Fix #2: Remove Duplicate Imports

**File**: `app/architect/dashboard/page.tsx`

Find these lines (around lines 5-6):
```typescript
import { useState, useEffect } from 'react'
import { useState, useEffect, Suspense } from 'react'
```

Change to:
```typescript
import { useState, useEffect, Suspense } from 'react'
```

---

### Fix #3: Add EPD API Key

**File**: `.env.example`

Add to the end of the file:
```bash
# EPD International API
EPD_INTERNATIONAL_API_KEY=your-epd-international-api-key
```

**Also add to Vercel**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `EPD_INTERNATIONAL_API_KEY` = `<your-actual-key>`
3. Select: Production, Preview, and Development
4. Click "Save"

---

## ✅ Verification Steps

### 1. Test Build Locally

```bash
# Clean any cached files
rm -rf .next

# Install dependencies (if needed)
npm install

# Build the project
npm run build
```

**Expected Output**:
```
✓ Compiled successfully
✓ Generating static pages (62/62)
✓ Finalizing page optimization
```

### 2. Check for Errors

```bash
# Look for these success indicators:
# - No "Module not found: Can't resolve '@/types/stripe'" error
# - No "the name `useState` is defined multiple times" error
# - Build completes without webpack errors
```

### 3. Test Locally

```bash
# Start production server
npm run start

# Open browser to http://localhost:3001
# Test:
# - Homepage loads (Hero + EmailSignup)
# - Admin dashboard (if you have an admin account)
# - Supplier/Architect dashboards (if you have those accounts)
```

---

## 📤 Commit and Deploy

### Commit Your Fixes

```bash
# Add all changes
git add tsconfig.json app/architect/dashboard/page.tsx .env.example

# Commit
git commit -m "fix: resolve critical build errors

- Add @/types/* path mapping to tsconfig.json
- Remove duplicate React imports in architect dashboard
- Document EPD_INTERNATIONAL_API_KEY in .env.example"

# Push to your branch
git push origin copilot/refactor-dashboard-structure-again
```

### Create Pull Request

1. Go to GitHub repository
2. Create PR from `copilot/refactor-dashboard-structure-again` to `main`
3. Use title: "Dashboard Refactoring & EPD Sync Implementation"
4. Copy PR description from `CODE_REVIEW_REPORT.md` (bottom section)
5. Wait for CI/CD to run
6. Check Vercel preview deployment works

---

## 🧪 Testing Checklist

After deploying, verify:

- [ ] Homepage loads without errors
- [ ] Hero component renders
- [ ] EmailSignup component renders
- [ ] Admin dashboard accessible for admins
- [ ] Supplier dashboard accessible for suppliers
- [ ] Architect dashboard accessible for architects
- [ ] Navigation shows correct links based on role
- [ ] EPD sync route requires admin auth
- [ ] No console errors in browser
- [ ] Page loads are fast

---

## 🆘 Troubleshooting

### Build Still Fails After Fixes

**Check**:
```bash
# Verify changes were applied
git diff tsconfig.json
git diff app/architect/dashboard/page.tsx

# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm run build
```

### Vercel Deployment Fails

**Check**:
1. Vercel environment variables are set correctly
2. Build command is `npm run build`
3. Install command is `npm install`
4. Root directory is `.` (not a subdirectory)
5. Check Vercel deployment logs for specific errors

### EPD Sync Route Returns 500 Error

**Check**:
1. `EPD_INTERNATIONAL_API_KEY` is set in Vercel environment
2. API key is valid and not expired
3. Supabase migration `20251209_create_epd_database.sql` has been applied
4. User is logged in as admin

### Changes Don't Appear in Production

**Try**:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check if PR was merged to `main` branch
4. Verify Vercel is deploying from `main` branch
5. Check Vercel deployment logs

---

## 📋 Quick Commands Reference

```bash
# Fix build errors automatically
./scripts/fix-build-errors.sh

# Build the project
npm run build

# Start production server locally
npm run start

# Type check only
npx tsc --noEmit

# Clean build cache
rm -rf .next

# Full clean and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check git status
git status

# View diff
git diff

# Commit changes
git add .
git commit -m "fix: resolve build errors"
git push
```

---

## 📞 Need Help?

- **Full Analysis**: See `CODE_REVIEW_REPORT.md`
- **Repository Issues**: Create an issue on GitHub
- **Deployment Help**: Check Vercel documentation

---

**Remember**: After merging to `main`:
1. Apply Supabase migration manually: `npx supabase db push`
2. Verify production deployment in Vercel dashboard
3. Test the live site thoroughly
