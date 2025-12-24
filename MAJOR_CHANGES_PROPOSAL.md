# Major Changes Proposal

The following changes are significant and require your approval. These will be handled in a separate PR if approved.

## 1. Delete Legacy Cloud Infrastructure
**Paths:** `aws/`, `azure-functions/`, `lambda/`

**Reasoning:**
- The project is now consolidated on Vercel + Supabase.
- `aws/` contains CloudFormation templates.
- `azure-functions/` and `lambda/` appear to be unused or legacy remnants.
- This will significantly reduce codebase noise.

## 2. Dependencies Update
- Update `next` to v15 (currently `14.2.35`).
- Clean up `puppeteer` version (currently `24.33.0` which looks incorrect/ahead of stable).
- Standardize other dependencies.

## 3. Delete `cloudflare-landing`
**Path:** `cloudflare-landing/`

**Reasoning:**
- The Next.js app is now the primary frontend.
- `cloudflare-landing/` contains static HTML files for the Phase 1 landing page.
- *Question:* Is this still needed for a separate deployment, or should the Next.js app handle the landing page?

## 4. Delete Unused Scripts
**Path:** `scripts/`

**Reasoning:**
- Contains various scripts like `linkedin_rogue_bot.py` (which might violate ToS) and `test_ai_connection.ts`.
- Many seem to be one-off utilities.
- Propose reviewing and deleting non-essential scripts.

**Please review and let me know if I should proceed with these deletions/updates.**
This document outlines proposed major changes to the codebase to improve maintainability, security, and performance.

## 1. Delete Legacy Cloud Infrastructure
The following directories appear to be unused templates or legacy code not aligned with the current Vercel + Supabase stack:
- `aws/` (CloudFormation templates)
- `azure-functions/` (Azure function app)
- `lambda/` (AWS Lambda functions)

**Reasoning:** The project architecture is defined as Next.js on Vercel with Supabase. Keeping these folders creates confusion and security risks if they contain unmaintained code.

## 2. Dependency Updates
- **Update Next.js to v15:** The current version is 14.2.35. Updating to v15 brings performance improvements but may include breaking changes.
- **Review `puppeteer` version:** The version `24.33.0` in `package.json` seems incorrect (current stable is ~23).

## 3. Merge Conflict Cleanup
The lint check revealed several files with git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). These need immediate attention as they break the build.
- `app/search/page.tsx`
- `app/supplier/rfqs/[id]/page.tsx`
- `lib/agents/email/zoho-client.ts`
- `lib/chat-provider.ts`

**Note:** I will fix the merge conflicts in the "Small Changes" PR as they are critical bugs.

## 4. Delete Unused Scripts
Review scripts in `scripts/` folder.
