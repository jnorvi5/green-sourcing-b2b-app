# Requirements Document

## Introduction

This document specifies the requirements for a Site Recovery and Diagnostic System for the GreenChainz B2B application. The system provides automated tools and procedures to identify, diagnose, and recover from site failures, including git history analysis, dependency issues, database connectivity problems, and frontend component failures. The system aims to minimize downtime and provide clear recovery paths when the application enters a broken state.

## Glossary

- **Recovery System**: The automated diagnostic and recovery tooling that identifies and resolves site failures
- **Diagnostic Agent**: A component that performs specific health checks on system subsystems
- **Git History Analyzer**: A tool that examines commit history to identify breaking changes
- **Dependency Auditor**: A component that validates and repairs package dependencies
- **Database Connector**: A component that verifies and tests database connectivity
- **Component Inventory**: A system that maps and validates frontend UI component health
- **Recovery Branch**: A git branch created from the last known working commit
- **Health Check**: An automated test that verifies a specific system capability
- **Breaking Commit**: A git commit that introduced failures to the application

## Requirements

### Requirement 1

**User Story:** As a developer, I want to analyze git commit history to identify breaking changes, so that I can pinpoint when the site stopped working and create a recovery point.

#### Acceptance Criteria

1. WHEN the Git History Analyzer is invoked THEN the Recovery System SHALL retrieve the last 20 commits from the repository
2. WHEN commits are retrieved THEN the Recovery System SHALL display commit hash, author, date, message, and files changed for each commit
3. WHEN analyzing commits THEN the Recovery System SHALL identify potential breaking commits based on file patterns and commit messages
4. WHEN a breaking commit is identified THEN the Recovery System SHALL generate a diff summary showing files modified, lines added, and lines deleted
5. WHEN the last good commit is identified THEN the Recovery System SHALL provide exact git commands to create a recovery branch from that commit

### Requirement 2

**User Story:** As a developer, I want to perform automated health checks on the local development server, so that I can quickly identify configuration and runtime errors.

#### Acceptance Criteria

1. WHEN the Diagnostic Agent performs a server health check THEN the Recovery System SHALL verify the development server starts without errors
2. WHEN checking server status THEN the Recovery System SHALL identify the port number the server is running on
3. WHEN the server is running THEN the Recovery System SHALL capture and report all console errors with file paths and line numbers
4. WHEN checking network health THEN the Recovery System SHALL identify failing API calls and their error responses
5. WHEN validating configuration THEN the Recovery System SHALL verify all required environment variables are present in the .env file

### Requirement 3

**User Story:** As a developer, I want to audit and repair dependency issues, so that I can resolve corrupted package installations that break the application.

#### Acceptance Criteria

1. WHEN the Dependency Auditor is invoked THEN the Recovery System SHALL remove existing node_modules and package-lock.json files
2. WHEN cleaning dependencies THEN the Recovery System SHALL clear the npm cache
3. WHEN reinstalling dependencies THEN the Recovery System SHALL perform a fresh npm install and capture any errors
4. WHEN dependencies are installed THEN the Recovery System SHALL run npm audit and report vulnerabilities
5. WHEN audit completes THEN the Recovery System SHALL document dependency conflicts, version mismatches, and missing packages

### Requirement 4

**User Story:** As a developer, I want to verify database connectivity, so that I can identify and resolve Supabase connection failures.

#### Acceptance Criteria

1. WHEN the Database Connector performs a health check THEN the Recovery System SHALL verify the presence of NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables
2. WHEN environment variables are present THEN the Recovery System SHALL execute a test query against the Supabase database
3. WHEN the test query executes THEN the Recovery System SHALL report connection status as connected or failed
4. WHEN connection fails THEN the Recovery System SHALL identify missing environment variables and provide remediation steps
5. WHEN testing database access THEN the Recovery System SHALL verify Row Level Security policies are not blocking legitimate reads

### Requirement 5

**User Story:** As a developer, I want to inventory all frontend components and their health status, so that I can prioritize fixes for broken UI elements.

#### Acceptance Criteria

1. WHEN the Component Inventory is invoked THEN the Recovery System SHALL scan all application routes including homepage, product listings, supplier dashboard, and search pages
2. WHEN scanning each route THEN the Recovery System SHALL identify components that render correctly versus those that are broken
3. WHEN a broken component is detected THEN the Recovery System SHALL capture console errors specific to that component with file paths and line numbers
4. WHEN analyzing component health THEN the Recovery System SHALL identify missing images, assets, and data sources
5. WHEN inventory completes THEN the Recovery System SHALL generate a prioritized checklist with P0 (blocks launch), P1 (important), and P2 (nice-to-have) classifications

### Requirement 6

**User Story:** As a developer, I want a unified recovery plan generated from all diagnostic results, so that I can follow a clear sequence of steps to restore the site.

#### Acceptance Criteria

1. WHEN all diagnostic agents complete THEN the Recovery System SHALL aggregate results into a unified recovery report
2. WHEN generating the recovery plan THEN the Recovery System SHALL prioritize fixes based on severity and dependencies
3. WHEN the recovery plan is generated THEN the Recovery System SHALL provide exact commands and code changes needed for each fix
4. WHEN multiple recovery paths exist THEN the Recovery System SHALL recommend the safest and fastest recovery approach
5. WHEN the recovery plan is complete THEN the Recovery System SHALL include verification steps to confirm each fix was successful

### Requirement 7

**User Story:** As a developer, I want the diagnostic system to output structured reports, so that I can share findings with team members and track recovery progress.

#### Acceptance Criteria

1. WHEN diagnostics complete THEN the Recovery System SHALL generate a markdown report with all findings
2. WHEN the report is generated THEN the Recovery System SHALL include timestamps, system state, and diagnostic results for each subsystem
3. WHEN errors are documented THEN the Recovery System SHALL include file paths, line numbers, error messages, and stack traces
4. WHEN the report includes commands THEN the Recovery System SHALL format them as executable code blocks
5. WHEN the report is saved THEN the Recovery System SHALL store it in a timestamped file for historical reference

### Requirement 8

**User Story:** As a developer, I want the recovery system to validate fixes after applying them, so that I can confirm the site is fully operational.

#### Acceptance Criteria

1. WHEN a recovery step is applied THEN the Recovery System SHALL re-run the relevant health check to verify the fix
2. WHEN validation succeeds THEN the Recovery System SHALL mark the recovery step as complete and proceed to the next step
3. WHEN validation fails THEN the Recovery System SHALL report the failure and suggest alternative recovery approaches
4. WHEN all recovery steps complete THEN the Recovery System SHALL perform a full system health check across all subsystems
5. WHEN the final health check passes THEN the Recovery System SHALL generate a recovery success report with before and after states
