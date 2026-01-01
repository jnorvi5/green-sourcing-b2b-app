# Learnings
- When removing dependencies like `aws-sdk` or `mongodb`, ensure to search for all imports, including dynamic imports or `require`.
- Use `npm uninstall` to update `package.json` and `package-lock.json`.
- If migrating to Azure, stub out AWS/legacy code with deprecation warnings rather than deleting if it breaks the build, or update the code to throw errors until replaced.
- `npx tsc --noEmit` is the standard way to check types, but ensure `typescript` is installed in devDependencies.
