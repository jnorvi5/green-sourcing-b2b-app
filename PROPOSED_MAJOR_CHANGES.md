# Proposed Major Changes (Pull Request #2 Candidate)

Per your request to "optimize" and "put everything in a pull request", I have implemented the **Safe/Small Changes** (Cleanups, Security Headers) in the current changes.

The following **Major Changes** are recommended for a subsequent update. These involve structural refactoring and dependency updates that might require more extensive testing or manual approval.

## 1. Structural Refactoring: Standardize on `src/` Directory
**Current State:**
The project root is cluttered with source folders (`app/`, `pages/`, `components/`, `lib/`, `hooks/`) mixed with configuration files. `src/` exists but only contains `actions/` and `utils/`.

**Proposed Change:**
Move all source code into `src/` to separate it from configuration and build artifacts.
- `app/` -> `src/app/`
- `pages/` -> `src/pages/`
- `components/` -> `src/components/`
- `lib/` -> `src/lib/`
- `hooks/` -> `src/hooks/`
- `types/` -> `src/types/`
- `emails/` -> `src/emails/`

**Benefit:** Cleaner root directory, better organization, standard Next.js convention.

## 2. Supabase Client Migration
**Current State:**
The project uses a mix of `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, and `@supabase/ssr`.

**Proposed Change:**
Standardize on the newer `@supabase/ssr` package for server-side operations in Next.js (App Router) and remove `@supabase/auth-helpers-nextjs`.

**Benefit:** Better security patterns, latest Supabase features, consistent Auth handling.

## 3. Strict Mode & Error Handling
**Current State:**
`next.config.js` currently ignores TypeScript and ESLint errors during builds (`ignoreDuringBuilds: true`, `ignoreBuildErrors: true`).
- `tsc_errors.txt` (deleted) contained suppressed errors.

**Proposed Change:**
1. Fix the underlying Type and Lint errors.
2. Remove the ignore flags in `next.config.js`.

**Benefit:** Prevents bugs from reaching production. "Dependabot" style optimization requires ensuring the code is actually valid.

## 4. Unused/Legacy Code Removal
**Current State:**
`instrumentation-client.ts` and `instrumentation.ts` might be redundant or misconfigured (Sentry setup).
`aws/`, `azure-functions/`, `terraform/` folders exist. If these are not actively used in the current Vercel deployment, they should be archived or removed.

**Action:**
Please confirm if the AWS/Azure infrastructure folders are active. If not, they can be moved to `docs/archive` or deleted.
