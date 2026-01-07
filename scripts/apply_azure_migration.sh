#!/bin/bash
# This script applies the "Major Changes" requested for Azure migration.
# It performs actions that involve deleting or renaming core configuration files.

set -e

echo "Starting Azure Migration Standardization..."

# 1. Standardize Backend Dockerfile
# The goal is to use the Azure-optimized Dockerfile as the main Dockerfile.
if [ -f "backend/Dockerfile.azure" ]; then
    echo "Found backend/Dockerfile.azure"
    if [ -f "backend/Dockerfile" ]; then
        echo "Removing legacy backend/Dockerfile..."
        rm backend/Dockerfile
    fi
    echo "Renaming backend/Dockerfile.azure to backend/Dockerfile..."
    mv backend/Dockerfile.azure backend/Dockerfile
else
    echo "backend/Dockerfile.azure not found. Skipping Dockerfile standardization."
fi

# 2. Cleanup Proposal Files
if [ -f "MAJOR_CHANGES_PROPOSAL.md" ]; then
    echo "Removing MAJOR_CHANGES_PROPOSAL.md..."
    rm MAJOR_CHANGES_PROPOSAL.md
fi

echo "Major changes applied successfully."
echo "Please verify your setup by running: docker-compose build"
