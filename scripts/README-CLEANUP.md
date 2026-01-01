# Workspace Cleanup Script

## Overview

The `Clean-Workspace.ps1` PowerShell script helps maintain a clean development environment by removing temporary files and build artifacts that can cause IDE performance issues or crashes.

## What Gets Cleaned

### .NET/Visual Studio Artifacts
- `.vs/` - Visual Studio cache and settings
- `bin/` - Compiled binaries
- `obj/` - Intermediate build files
- `*.user` - User-specific project settings
- `*.suo` - Solution user options
- `*.userosscache` - User-specific cache files
- `*.sln.docstates` - Solution document states

### Node.js/Next.js Artifacts
- `.next/` - Next.js build output
- `node_modules/` - NPM dependencies
- `out/` - Next.js static export output
- `coverage/` - Test coverage reports
- `.turbo/` - Turborepo cache

### System Files
- `.DS_Store` - macOS folder metadata
- `Thumbs.db` - Windows thumbnail cache

## Usage

### Basic Usage (with confirmation)
```powershell
.\scripts\Clean-Workspace.ps1
```

### Dry Run (preview what would be deleted)
```powershell
.\scripts\Clean-Workspace.ps1 -WhatIf
```

### Force Deletion (including read-only files)
```powershell
.\scripts\Clean-Workspace.ps1 -Force
```

## Features

✅ **Safe Deletion**: Prints each item before deletion  
✅ **Error Handling**: Gracefully handles permission errors and files in use  
✅ **Smart Skipping**: Preserves source code and configuration files (like `.env`)  
✅ **Statistics**: Shows summary of deleted items, errors, and disk space freed  
✅ **Dry Run Mode**: Preview changes with `-WhatIf` flag  

## Before Running

1. **Close All IDEs**: Close Visual Studio, VS Code, and any other editors
2. **Stop Dev Servers**: Terminate any running `npm run dev` or similar processes
3. **Save Your Work**: Commit any important changes to Git

## Troubleshooting

### "File is currently in use" errors
- Close Visual Studio, VS Code, and other IDEs
- Stop any running dev servers (`npm run dev`, etc.)
- Close any applications that might be accessing the files

### "Permission denied" or "Access denied" errors
- Run PowerShell as Administrator
- Use the `-Force` flag: `.\scripts\Clean-Workspace.ps1 -Force`

### Files inside `.git/` directory
The script automatically skips files inside the `.git/` directory to preserve your repository integrity.

## After Cleanup

### Restore Dependencies
After cleanup, you'll need to reinstall Node.js dependencies:

```bash
# Root project
npm install

# Other Node.js projects (if applicable)
cd sda-connector && npm install
cd azure-functions && npm install
cd lambda/supabase-backup && npm install
# etc.
```

### Rebuild .NET Projects
If you have .NET/Revit plugins, rebuild them in Visual Studio:
```
Build -> Rebuild Solution
```

## .gitignore Coverage

The root `.gitignore` file has been updated to ensure all these temporary files and directories are ignored by Git:

- ✅ `.next/`, `out/`, `.turbo/` - Next.js artifacts
- ✅ `node_modules/` - NPM dependencies  
- ✅ `coverage/` - Test coverage
- ✅ `.vs/`, `bin/`, `obj/`, `*.user` - .NET artifacts
- ✅ `.DS_Store`, `Thumbs.db` - System files

## Examples

### Example 1: Preview Before Cleaning
```powershell
PS> .\scripts\Clean-Workspace.ps1 -WhatIf

==================================================
  GreenChainz Workspace Cleanup Script
==================================================

Root Path: C:\Projects\green-sourcing-b2b-app

[DRY RUN MODE] No files will be deleted

Searching for directories to clean...

Searching for '.next' directories...
[DELETING DIRECTORY] C:\Projects\green-sourcing-b2b-app\.next
  [WOULD DELETE]

Searching for 'node_modules' directories...
[DELETING DIRECTORY] C:\Projects\green-sourcing-b2b-app\node_modules
  [WOULD DELETE]
...

==================================================
  Cleanup Summary
==================================================
Mode: DRY RUN (no actual deletions performed)
Items deleted: 8
Errors encountered: 0
Items skipped: 2
```

### Example 2: Actual Cleanup
```powershell
PS> .\scripts\Clean-Workspace.ps1

==================================================
  GreenChainz Workspace Cleanup Script
==================================================

Root Path: C:\Projects\green-sourcing-b2b-app

Searching for directories to clean...

Searching for '.next' directories...
[DELETING DIRECTORY] C:\Projects\green-sourcing-b2b-app\.next
  ✓ Deleted successfully

Searching for 'node_modules' directories...
[DELETING DIRECTORY] C:\Projects\green-sourcing-b2b-app\node_modules
  ✓ Deleted successfully
...

==================================================
  Cleanup Summary
==================================================
Items deleted: 8
Errors encountered: 0
Items skipped: 2
Disk space freed: 1.25 GB

✓ Workspace cleanup completed successfully!

==================================================
```

## Safety Features

The script includes several safety features:

1. **No Source Code Deletion**: Only deletes known temporary/build artifacts
2. **Configuration File Protection**: Explicitly skips `.env` files
3. **Git Directory Protection**: Skips anything inside `.git/`
4. **Error Recovery**: Continues even if some items can't be deleted
5. **Detailed Logging**: Shows exactly what's being deleted

## When to Run This Script

Run the cleanup script when:
- Your IDE is running slowly or crashing
- You're running out of disk space
- You want to ensure a clean build
- You're switching between Git branches with different dependencies
- You're troubleshooting build issues

## Notes

- The script searches recursively from the root directory
- It automatically handles both forward and backward slashes in paths
- Read-only files require the `-Force` flag or Administrator privileges
- Files currently in use by applications cannot be deleted until those applications are closed
