# Lambda Functions

This directory contains AWS Lambda functions for GreenChainz B2B application.

## Available Functions

### 1. EPD Sync (`epd-sync/`)
Synchronizes Environmental Product Declaration (EPD) data from external sources.

### 2. EC3 Sync (`ec3-sync/`)
Integrates with Building Transparency's EC3 (Embodied Carbon in Construction Calculator) database.

### 3. Supabase Backup (`supabase-backup/`)
Automated backup functionality for Supabase database.

### 4. Cost Monitor (`cost-monitor/`)
Monitors and reports on AWS resource costs.

### 5. GreenChainz EPD Sync (`greenchainz-epd-sync/`)
Custom EPD synchronization logic for GreenChainz platform.

### 6. Antigravity Editor Sanitizer (`antigravity-editor-sanitizer/`)
Sanitizes and validates editor input to prevent XSS and other security issues.

## Deployment

Each function directory contains its own deployment configuration. See individual function directories for specific deployment instructions.

## Development

To develop locally:
1. Install AWS SAM CLI or Serverless Framework
2. Navigate to the specific function directory
3. Follow the README in that directory for local development instructions

## Related Documentation

- [AWS Deployment Guide](../aws/DEPLOYMENT.md)
- [AWS IAM Roles and Policies](../aws/IAM_ROLES_AND_POLICIES.md)
