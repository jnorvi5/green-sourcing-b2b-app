# Major Changes Proposal

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
