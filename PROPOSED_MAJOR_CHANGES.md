# Proposed Major Changes (Pull Request #2 Candidate)

The following changes are recommended to be performed in a separate Pull Request to minimize risk and allow for focused review.

## 1. Structural Refactoring
**Goal:** Organize the codebase for scalability.
- [ ] **Move Infra:** Move `aws/`, `azure-functions/`, `terraform/`, `lambda/` into a new `infrastructure/` directory.
- [ ] **Move Tools:** Move `scripts/` to `tools/` and delete unused scripts.
- [ ] **Delete Junk:** Delete `.amazonq/`, `.kiro/`, `.snapshots/` directories (Tool artifacts).

## 2. Enable Strict Mode
**Goal:** Ensure code quality and catch bugs early.
- [ ] **Action:** Set `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false` in `next.config.js`.
- [ ] **Prerequisite:** Run `npm run type-check` and fix all remaining errors (reported in `CODE_REVIEW_REPORT.md` as "integration file errors").

## 3. Client Migration Validation
**Goal:** Ensure complete removal of legacy Supabase clients.
- [ ] **Action:** Grep for any remaining imports of `@supabase/auth-helpers-nextjs` (already uninstalled) to ensure no dead import statements remain.
- [ ] **Action:** Verify `lib/supabase/*` files all use `@supabase/ssr` correctly.

## 4. Environment Cleanup
**Goal:** Reduce confusion.
- [ ] **Action:** Audit `.env.example` vs `vercel.json` vs actual usage.
- [ ] **Action:** Remove `lib/aws/cloudfront.ts.disabled` and `lib/aws/ses-client.ts.disabled` if not needed.

## 5. Security Headers
**Goal:** harden the application.
- [ ] **Action:** Review CSP in `next.config.js` to ensure it's not too permissive (currently allows `unsafe-inline`).
