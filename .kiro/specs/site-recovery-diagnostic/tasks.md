# Implementation Plan: Site Recovery and Diagnostic System

- [ ] 1. Set up project structure and core interfaces

  - Create directory structure: `lib/recovery/`, `scripts/`, `.recovery/reports/`
  - Define TypeScript interfaces for all diagnostic agents and data models
  - Set up configuration file schema (`.recovery.config.json`)
  - Install dependencies: `simple-git`, `commander`, `@supabase/supabase-js`, `fast-check`, `jest`
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ]\* 1.1 Write property test for configuration validation

  - **Property 26: Validation check presence**
  - **Validates: Requirements 6.5, 8.1**

- [ ] 2. Implement Git History Analyzer

  - Create `lib/recovery/git-analyzer.ts` with GitHistoryAnalyzer class
  - Implement `getRecentCommits()` to retrieve last N commits using simple-git
  - Implement `identifyBreakingCommit()` with pattern matching for suspicious changes
  - Implement `generateDiff()` to analyze file changes, lines added/deleted
  - Implement `createRecoveryBranch()` to generate git commands for branch creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]\* 2.1 Write property test for commit retrieval count

  - **Property 1: Commit retrieval count accuracy**
  - **Validates: Requirements 1.1**

- [ ]\* 2.2 Write property test for commit data completeness

  - **Property 2: Commit data completeness**
  - **Validates: Requirements 1.2**

- [ ]\* 2.3 Write property test for breaking commit identification

  - **Property 3: Breaking commit identification**
  - **Validates: Requirements 1.3**

- [ ]\* 2.4 Write property test for diff summary structure

  - **Property 4: Diff summary structure**
  - **Validates: Requirements 1.4**

- [ ]\* 2.5 Write property test for recovery command generation

  - **Property 5: Recovery command generation**
  - **Validates: Requirements 1.5**

- [ ] 3. Implement Server Health Monitor

  - Create `lib/recovery/server-monitor.ts` with ServerHealthMonitor class
  - Implement `startServer()` to spawn dev server process and capture output
  - Implement `checkServerStatus()` to detect port, startup errors, and response time
  - Implement `captureConsoleErrors()` to parse error logs with file paths and line numbers
  - Implement `checkNetworkCalls()` to test API endpoints and identify failures
  - Implement `validateEnvironment()` to check for required env variables
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]\* 3.1 Write property test for server startup error detection

  - **Property 6: Server startup error detection**
  - **Validates: Requirements 2.1**

- [ ]\* 3.2 Write property test for port identification

  - **Property 7: Port identification accuracy**
  - **Validates: Requirements 2.2**

- [ ]\* 3.3 Write property test for error data structure

  - **Property 8: Error data structure consistency**
  - **Validates: Requirements 2.3, 5.3, 7.3**

- [ ]\* 3.4 Write property test for API failure classification

  - **Property 9: API failure classification**
  - **Validates: Requirements 2.4**

- [ ]\* 3.5 Write property test for environment variable validation

  - **Property 10: Environment variable validation completeness**
  - **Validates: Requirements 2.5, 4.1, 4.4**

- [ ] 4. Implement Dependency Auditor

  - Create `lib/recovery/dependency-auditor.ts` with DependencyAuditor class
  - Implement `cleanDependencies()` to remove node_modules and package-lock.json
  - Implement `clearCache()` to execute npm cache clean command
  - Implement `installDependencies()` to run npm install and capture output
  - Implement `runAudit()` to execute npm audit and parse JSON results
  - Implement `detectConflicts()` to identify version mismatches and missing packages
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]\* 4.1 Write property test for dependency cleanup

  - **Property 11: Dependency cleanup verification**
  - **Validates: Requirements 3.1**

- [ ]\* 4.2 Write property test for cache clear execution

  - **Property 12: Cache clear execution**
  - **Validates: Requirements 3.2**

- [ ]\* 4.3 Write property test for install error capture

  - **Property 13: Install error capture**
  - **Validates: Requirements 3.3**

- [ ]\* 4.4 Write property test for audit result structure

  - **Property 14: Audit result structure**
  - **Validates: Requirements 3.4, 3.5**

- [ ] 5. Implement Database Connector

  - Create `lib/recovery/database-connector.ts` with DatabaseConnector class
  - Implement `validateEnvVars()` to check for Supabase URL and key
  - Implement `testConnection()` to create Supabase client and measure latency
  - Implement `runTestQuery()` to execute SELECT query on test table
  - Implement `checkRLSPolicies()` to detect if RLS is blocking reads
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 5.1 Write property test for database connection status

  - **Property 15: Database connection status binary**
  - **Validates: Requirements 4.3**

- [ ]\* 5.2 Write property test for test query execution

  - **Property 16: Test query execution**
  - **Validates: Requirements 4.2**

- [ ]\* 5.3 Write property test for RLS blocking detection

  - **Property 17: RLS blocking detection**
  - **Validates: Requirements 4.5**

- [ ] 6. Implement Component Inventory

  - Create `lib/recovery/component-inventory.ts` with ComponentInventory class
  - Implement `scanRoutes()` to discover all application routes from config
  - Implement `analyzeComponent()` to check render status for each route
  - Implement `captureErrors()` to extract console errors with file paths
  - Implement `checkAssets()` to verify images, stylesheets, and scripts load
  - Implement `prioritizeIssues()` to classify issues as P0, P1, or P2
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]\* 6.1 Write property test for route scanning completeness

  - **Property 18: Route scanning completeness**
  - **Validates: Requirements 5.1**

- [ ]\* 6.2 Write property test for component render status

  - **Property 19: Component render status classification**
  - **Validates: Requirements 5.2**

- [ ]\* 6.3 Write property test for missing asset identification

  - **Property 20: Missing asset identification**
  - **Validates: Requirements 5.4**

- [ ]\* 6.4 Write property test for priority classification

  - **Property 21: Priority classification completeness**
  - **Validates: Requirements 5.5**

- [ ] 7. Implement Diagnostic Orchestrator

  - Create `lib/recovery/orchestrator.ts` with DiagnosticOrchestrator class
  - Implement `runFullDiagnostic()` to execute all agents in parallel
  - Implement `runSpecificDiagnostic()` to execute a single agent
  - Implement `generateRecoveryPlan()` to create prioritized recovery steps
  - Add error handling for agent failures with graceful degradation
  - Implement retry logic with exponential backoff for network operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 7.1 Write property test for diagnostic aggregation

  - **Property 22: Diagnostic aggregation completeness**
  - **Validates: Requirements 6.1**

- [ ]\* 7.2 Write property test for recovery step prioritization

  - **Property 23: Recovery step prioritization**
  - **Validates: Requirements 6.2**

- [ ]\* 7.3 Write property test for recovery step actionability

  - **Property 24: Recovery step actionability**
  - **Validates: Requirements 6.3**

- [ ]\* 7.4 Write property test for risk-based path recommendation

  - **Property 25: Risk-based path recommendation**
  - **Validates: Requirements 6.4**

- [ ] 8. Implement Report Generator

  - Create `lib/recovery/report-generator.ts` with ReportGenerator class
  - Implement `generateReport()` to create markdown report from diagnostic data
  - Implement `saveReport()` to write report to timestamped file
  - Implement `formatCommands()` to wrap commands in code blocks
  - Implement `formatErrors()` to display errors with file paths and line numbers
  - Add credential redaction for environment variables and API keys
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 8.1 Write property test for report markdown validity

  - **Property 27: Report markdown validity**
  - **Validates: Requirements 7.1, 7.2**

- [ ]\* 8.2 Write property test for command formatting

  - **Property 28: Command formatting consistency**
  - **Validates: Requirements 7.4**

- [ ]\* 8.3 Write property test for report filename timestamp

  - **Property 29: Report filename timestamp format**
  - **Validates: Requirements 7.5**

- [ ] 9. Implement Recovery Execution Engine

  - Create `lib/recovery/executor.ts` with RecoveryExecutor class
  - Implement `executeStep()` to run commands for a single recovery step
  - Implement `validateStep()` to run validation checks after each step
  - Implement `handleFailure()` to provide alternative approaches on validation failure
  - Implement `executeFullRecovery()` to run all steps in sequence
  - Implement `generateSuccessReport()` to create before/after comparison
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]\* 9.1 Write property test for post-step validation

  - **Property 30: Post-step validation execution**
  - **Validates: Requirements 8.1**

- [ ]\* 9.2 Write property test for success status propagation

  - **Property 31: Success status propagation**
  - **Validates: Requirements 8.2**

- [ ]\* 9.3 Write property test for failure alternatives

  - **Property 32: Failure alternative provision**
  - **Validates: Requirements 8.3**

- [ ]\* 9.4 Write property test for final health check

  - **Property 33: Final comprehensive health check**
  - **Validates: Requirements 8.4**

- [ ]\* 9.5 Write property test for recovery comparison report

  - **Property 34: Recovery comparison report**
  - **Validates: Requirements 8.5**

- [ ] 10. Implement CLI Interface

  - Create `scripts/recovery-cli.ts` with Commander.js setup
  - Add `diagnose` command with optional --agent flag
  - Add `execute` command with --plan flag for recovery execution
  - Add `report` command with --input flag for report generation
  - Implement progress indicators and colored output for better UX
  - Add interactive prompts for confirmation before destructive operations
  - _Requirements: All requirements (CLI entry point)_

- [ ]\* 10.1 Write integration tests for CLI commands

  - Test full diagnostic flow end-to-end
  - Test recovery execution with mock recovery plan
  - Test report generation from sample diagnostic data
  - _Requirements: All requirements_

- [ ] 11. Create configuration and documentation

  - Create `.recovery.config.json` template with sensible defaults
  - Write README.md with usage examples and configuration options
  - Document each diagnostic agent's capabilities and limitations
  - Create troubleshooting guide for common issues
  - Add JSDoc comments to all public interfaces
  - _Requirements: All requirements (documentation)_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
