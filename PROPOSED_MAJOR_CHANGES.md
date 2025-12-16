# Proposed Major Changes (Pull Request #2 Candidate)

I have implemented the **Safe/Small Changes** (Cleanups, Security Headers, Secret fixes) in the current update.

The following **Major Changes** are recommended for the next phase. These involve structural refactoring and dependency updates.

## 1. Structural Refactoring: Standardize on `src/` Directory
**Current State:** Project root is cluttered (`app/`, `pages/`, `components/`, etc.).
**Proposed Change:** Move all source code into `src/`.

## 2. Supabase Client Migration
**Current State:** Mix of `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, and `@supabase/ssr`.
**Proposed Change:** Standardize on `@supabase/ssr`.

## 3. Strict Mode & Error Handling
**Current State:** `next.config.js` ignores TypeScript and ESLint errors (`ignoreDuringBuilds: true`).
**Proposed Change:**
1. Fix the underlying Type and Lint errors.
2. Remove the ignore flags in `next.config.js`.

## 4. Infrastructure Cleanup
**Current State:** `aws/`, `azure-functions/`, `lambda/`, `terraform/` folders exist.
**Action:**
- Confirm if these are legacy/unused.
- Delete if not needed for the Vercel deployment.

## 5. Dependency Updates
**Current State:** Some packages might be outdated.
**Action:** Run `npm update` and test.
