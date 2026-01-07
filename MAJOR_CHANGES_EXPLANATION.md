# Major Changes Proposal (Azure Migration & Cleanup)

This file explains the major changes prepared for the repository.
The user requested these be separated so a decision can be made.

## Prepared Changes

A script `scripts/apply_azure_migration.sh` has been created to automate the following actions:

### 1. Standardize Dockerfiles
*   **Action:** Deletes `backend/Dockerfile` (legacy/generic).
*   **Action:** Renames `backend/Dockerfile.azure` to `backend/Dockerfile`.
*   **Reason:** We are migrating to Azure. The `Dockerfile.azure` is optimized for production (security, size). Standardizing on one file prevents confusion and deployment errors.

### 2. File Cleanup
*   **Action:** Deletes `MAJOR_CHANGES_PROPOSAL.md`.
*   **Reason:** The proposal is now superseded by this explanation and the automation script.

## How to Apply
To apply these changes, run:
```bash
./scripts/apply_azure_migration.sh
```

## Other Optimizations (Already Applied)
*   **Dependencies:** Attempted to prune unused MongoDB instrumentation (transitive dependency note: it remains due to Application Insights requirements).
*   **Security:** Added explicit comment in `backend/routes/payments.js` regarding `JWT_SECRET` handling in production.
*   **Git:** Updated `.gitignore` to exclude editor files (`.vscode`, `.idea`, `*.swp`).
