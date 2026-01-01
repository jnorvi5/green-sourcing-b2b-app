# Learnings
- **Azure Migration:** AWS SDK and MongoDB were removed. S3 logic stubbed.
- **Dependency Management:** Use `npm uninstall` to cleanly remove packages. Do not manually edit `package.json` versions to non-existent ones (like TypeScript 5.9.3).
- **Code Restoration:** When fixing corrupted files (like `app/api/agents/email-writer/route.ts`), carefully trace logic flow and ensure all variables are defined.
