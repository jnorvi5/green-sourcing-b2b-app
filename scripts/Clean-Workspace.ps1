<#
.SYNOPSIS
    Cleans temporary and build artifacts from the GreenChainz B2B monorepo workspace.

.DESCRIPTION
    This script recursively finds and deletes temporary files and build artifacts to prevent IDE crashes
    and maintain a clean workspace. It handles both .NET/Visual Studio artifacts and Node.js/Next.js artifacts.
    
    The script:
    - Prints each folder/file before deletion
    - Handles permission errors gracefully
    - Does NOT delete source code or configuration files
    - Provides a summary of cleaned items and errors

.PARAMETER WhatIf
    Shows what would be deleted without actually deleting anything (dry-run mode)

.PARAMETER Force
    Forces deletion even if files are read-only (does not override file-in-use locks)

.EXAMPLE
    .\Clean-Workspace.ps1
    Performs cleanup with confirmation prompts

.EXAMPLE
    .\Clean-Workspace.ps1 -WhatIf
    Shows what would be deleted without actually deleting (dry-run)

.EXAMPLE
    .\Clean-Workspace.ps1 -Force
    Forces deletion of read-only files

.NOTES
    Author: GreenChainz DevOps
    Date: 2025-12-30
#>

[CmdletBinding(SupportsShouldProcess=$true)]
param(
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Statistics counters
$script:DeletedCount = 0
$script:ErrorCount = 0
$script:SkippedCount = 0
$script:TotalSizeFreed = 0

# Define patterns to clean
$DirectoriesToClean = @(
    # .NET/Visual Studio artifacts
    ".vs",
    "bin",
    "obj",
    
    # Node.js/Next.js artifacts
    ".next",
    "node_modules",
    "out",
    "coverage",
    ".turbo"
)

$FilesToClean = @(
    # .NET/Visual Studio artifacts
    "*.user",
    "*.suo",
    "*.userosscache",
    "*.sln.docstates",
    
    # System/Misc files
    ".DS_Store",
    "Thumbs.db"
)

# Get the root directory (script's parent directory's parent)
$RootPath = Split-Path -Parent $PSScriptRoot
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  GreenChainz Workspace Cleanup Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Root Path: $RootPath" -ForegroundColor Yellow
Write-Host ""

if ($WhatIfPreference) {
    Write-Host "[DRY RUN MODE] No files will be deleted" -ForegroundColor Magenta
    Write-Host ""
}

# Function to safely delete a directory
function Remove-DirectorySafely {
    param(
        [string]$Path,
        [switch]$ForceDelete
    )
    
    try {
        # Get size before deletion
        $size = 0
        try {
            $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
                     Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
            if ($null -eq $size) { $size = 0 }
        } catch {
            # If we can't calculate size, just continue
            $size = 0
        }
        
        Write-Host "[DELETING DIRECTORY] $Path" -ForegroundColor Red
        
        if (-not $WhatIfPreference) {
            if ($ForceDelete) {
                Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            } else {
                Remove-Item -Path $Path -Recurse -ErrorAction Stop
            }
            
            $script:DeletedCount++
            $script:TotalSizeFreed += $size
            Write-Host "  ✓ Deleted successfully" -ForegroundColor Green
        } else {
            Write-Host "  [WOULD DELETE]" -ForegroundColor Yellow
            $script:DeletedCount++
        }
    }
    catch {
        $script:ErrorCount++
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Yellow
        
        # Handle specific errors
        if ($_.Exception.Message -like "*being used by another process*") {
            Write-Host "    File is currently in use. Close the application and try again." -ForegroundColor Yellow
        }
        elseif ($_.Exception.Message -like "*Access*denied*") {
            Write-Host "    Permission denied. Try running as Administrator or use -Force flag." -ForegroundColor Yellow
        }
    }
}

# Function to safely delete a file
function Remove-FileSafely {
    param(
        [string]$Path,
        [switch]$ForceDelete
    )
    
    try {
        $size = 0
        try {
            $size = (Get-Item -Path $Path -ErrorAction SilentlyContinue).Length
            if ($null -eq $size) { $size = 0 }
        } catch {
            $size = 0
        }
        
        Write-Host "[DELETING FILE] $Path" -ForegroundColor Red
        
        if (-not $WhatIfPreference) {
            if ($ForceDelete) {
                Remove-Item -Path $Path -Force -ErrorAction Stop
            } else {
                Remove-Item -Path $Path -ErrorAction Stop
            }
            
            $script:DeletedCount++
            $script:TotalSizeFreed += $size
            Write-Host "  ✓ Deleted successfully" -ForegroundColor Green
        } else {
            Write-Host "  [WOULD DELETE]" -ForegroundColor Yellow
            $script:DeletedCount++
        }
    }
    catch {
        $script:ErrorCount++
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Yellow
        
        if ($_.Exception.Message -like "*being used by another process*") {
            Write-Host "    File is currently in use. Close the application and try again." -ForegroundColor Yellow
        }
        elseif ($_.Exception.Message -like "*Access*denied*") {
            Write-Host "    Permission denied. Try running as Administrator or use -Force flag." -ForegroundColor Yellow
        }
    }
}

# Clean directories
Write-Host "Searching for directories to clean..." -ForegroundColor Cyan
Write-Host ""

foreach ($dirName in $DirectoriesToClean) {
    Write-Host "Searching for '$dirName' directories..." -ForegroundColor White
    
    $foundDirs = Get-ChildItem -Path $RootPath -Directory -Recurse -Force -Filter $dirName -ErrorAction SilentlyContinue
    
    if ($foundDirs) {
        foreach ($dir in $foundDirs) {
            # Skip if inside .git directory
            if ($dir.FullName -like "*\.git\*") {
                Write-Host "  [SKIPPING] $($dir.FullName) (inside .git)" -ForegroundColor DarkGray
                $script:SkippedCount++
                continue
            }
            
            Remove-DirectorySafely -Path $dir.FullName -ForceDelete:$Force
        }
    } else {
        Write-Host "  No '$dirName' directories found." -ForegroundColor DarkGray
    }
    
    Write-Host ""
}

# Clean files
Write-Host "Searching for files to clean..." -ForegroundColor Cyan
Write-Host ""

foreach ($filePattern in $FilesToClean) {
    Write-Host "Searching for '$filePattern' files..." -ForegroundColor White
    
    $foundFiles = Get-ChildItem -Path $RootPath -File -Recurse -Force -Filter $filePattern -ErrorAction SilentlyContinue
    
    if ($foundFiles) {
        foreach ($file in $foundFiles) {
            # Skip if inside .git directory
            if ($file.FullName -like "*\.git\*") {
                Write-Host "  [SKIPPING] $($file.FullName) (inside .git)" -ForegroundColor DarkGray
                $script:SkippedCount++
                continue
            }
            
            # Skip .env files explicitly (safety check)
            if ($file.Name -eq ".env" -or $file.Name -like ".env.*") {
                Write-Host "  [SKIPPING] $($file.FullName) (configuration file)" -ForegroundColor DarkGray
                $script:SkippedCount++
                continue
            }
            
            Remove-FileSafely -Path $file.FullName -ForceDelete:$Force
        }
    } else {
        Write-Host "  No '$filePattern' files found." -ForegroundColor DarkGray
    }
    
    Write-Host ""
}

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Cleanup Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if ($WhatIfPreference) {
    Write-Host "Mode: DRY RUN (no actual deletions performed)" -ForegroundColor Magenta
}

Write-Host "Items deleted: $script:DeletedCount" -ForegroundColor Green
Write-Host "Errors encountered: $script:ErrorCount" -ForegroundColor $(if ($script:ErrorCount -gt 0) { "Yellow" } else { "Green" })
Write-Host "Items skipped: $script:SkippedCount" -ForegroundColor Cyan

if (-not $WhatIfPreference -and $script:TotalSizeFreed -gt 0) {
    $sizeInMB = [math]::Round($script:TotalSizeFreed / 1MB, 2)
    $sizeInGB = [math]::Round($script:TotalSizeFreed / 1GB, 2)
    
    if ($sizeInGB -ge 1) {
        Write-Host "Disk space freed: $sizeInGB GB" -ForegroundColor Green
    } else {
        Write-Host "Disk space freed: $sizeInMB MB" -ForegroundColor Green
    }
}

Write-Host ""

if ($script:ErrorCount -gt 0) {
    Write-Host "⚠ Some items could not be deleted. Review the errors above." -ForegroundColor Yellow
    Write-Host "  Common solutions:" -ForegroundColor White
    Write-Host "  - Close Visual Studio, VS Code, and other IDEs" -ForegroundColor White
    Write-Host "  - Stop any running dev servers (npm run dev, etc.)" -ForegroundColor White
    Write-Host "  - Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "  - Use the -Force flag to delete read-only files" -ForegroundColor White
} else {
    Write-Host "✓ Workspace cleanup completed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
