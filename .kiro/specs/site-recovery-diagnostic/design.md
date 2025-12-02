# Design Document: Site Recovery and Diagnostic System

## Overview

The Site Recovery and Diagnostic System is a comprehensive toolset for identifying, diagnosing, and recovering from application failures in the GreenChainz B2B platform. The system consists of five specialized diagnostic agents (Git History Analyzer, Server Health Monitor, Dependency Auditor, Database Connector, and Component Inventory) that work together to provide a complete picture of system health and generate actionable recovery plans.

The system is designed as a CLI tool that can be invoked manually during incidents or integrated into CI/CD pipelines for automated health monitoring. It produces structured markdown reports with timestamped findings, exact recovery commands, and prioritized fix checklists.

## Architecture

### High-Level Architecture

```plaintext
┌─────────────────────────────────────────────────────────────┐
│                    Recovery CLI Interface                    │
│                  (scripts/recovery-cli.ts)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Diagnostic Orchestrator                     │
│              (lib/recovery/orchestrator.ts)                  │
│  - Coordinates diagnostic agents                             │
│  - Aggregates results                                        │
│  - Generates recovery plan                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Git History  │   │   Server     │   │  Dependency  │
│   Analyzer   │   │   Health     │   │   Auditor    │
│              │   │   Monitor    │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  Database    │   │  Component   │
│  Connector   │   │  Inventory   │
│              │   │              │
└──────────────┘   └──────────────┘
        │                   │
        └───────────────────┴───────────────────┐
                            ▼
                ┌─────────────────────────┐
                │   Report Generator      │
                │ (lib/recovery/report.ts)│
                └─────────────────────────┘
```

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **CLI Framework**: Commander.js for command-line interface
- **Git Operations**: simple-git library for repository analysis
- **Process Management**: child_process for running npm commands and server checks
- **HTTP Client**: node-fetch for API health checks
- **Database Client**: @supabase/supabase-js for database connectivity tests
- **File System**: fs/promises for reading configuration files
- **Reporting**: markdown-it for generating formatted reports

## Components and Interfaces

### 1. Diagnostic Orchestrator

**Purpose**: Coordinates all diagnostic agents and aggregates results

**Interface**:

```typescript
interface DiagnosticOrchestrator {
  runFullDiagnostic(): Promise<DiagnosticReport>;
  runSpecificDiagnostic(agent: DiagnosticAgent): Promise<AgentResult>;
  generateRecoveryPlan(report: DiagnosticReport): RecoveryPlan;
}

interface DiagnosticReport {
  timestamp: Date;
  gitAnalysis: GitAnalysisResult;
  serverHealth: ServerHealthResult;
  dependencyAudit: DependencyAuditResult;
  databaseStatus: DatabaseStatusResult;
  componentInventory: ComponentInventoryResult;
  overallStatus: "healthy" | "degraded" | "critical";
}
```

### 2. Git History Analyzer

**Purpose**: Analyzes commit history to identify breaking changes

**Interface**:

```typescript
interface GitHistoryAnalyzer {
  getRecentCommits(count: number): Promise<Commit[]>;
  identifyBreakingCommit(commits: Commit[]): Promise<Commit | null>;
  generateDiff(commitHash: string): Promise<CommitDiff>;
  createRecoveryBranch(fromCommit: string, branchName: string): Promise<string>;
}

interface Commit {
  hash: string;
  author: string;
  date: Date;
  message: string;
  filesChanged: string[];
}

interface CommitDiff {
  filesModified: FileDiff[];
  linesAdded: number;
  linesDeleted: number;
  suspiciousPatterns: string[];
}

interface GitAnalysisResult {
  recentCommits: Commit[];
  suspectedBreakingCommit: Commit | null;
  diff: CommitDiff | null;
  recoveryCommands: string[];
}
```

### 3. Server Health Monitor

**Purpose**: Validates development server functionality

**Interface**:

```typescript
interface ServerHealthMonitor {
  startServer(): Promise<ServerProcess>;
  checkServerStatus(): Promise<ServerStatus>;
  captureConsoleErrors(): Promise<ConsoleError[]>;
  checkNetworkCalls(): Promise<NetworkCall[]>;
  validateEnvironment(): Promise<EnvValidation>;
}

interface ServerStatus {
  isRunning: boolean;
  port: number;
  startupErrors: string[];
  responseTime: number;
}

interface ConsoleError {
  message: string;
  filePath: string;
  lineNumber: number;
  stackTrace: string;
}

interface NetworkCall {
  url: string;
  method: string;
  status: number;
  error: string | null;
}

interface ServerHealthResult {
  serverStatus: ServerStatus;
  consoleErrors: ConsoleError[];
  failingAPICalls: NetworkCall[];
  missingEnvVars: string[];
}
```

### 4. Dependency Auditor

**Purpose**: Validates and repairs package dependencies

**Interface**:

```typescript
interface DependencyAuditor {
  cleanDependencies(): Promise<void>;
  clearCache(): Promise<void>;
  installDependencies(): Promise<InstallResult>;
  runAudit(): Promise<AuditResult>;
  detectConflicts(): Promise<Conflict[]>;
}

interface InstallResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

interface AuditResult {
  vulnerabilities: Vulnerability[];
  outdatedPackages: Package[];
  missingPackages: string[];
}

interface DependencyAuditResult {
  installResult: InstallResult;
  auditResult: AuditResult;
  conflicts: Conflict[];
  recommendations: string[];
}
```

### 5. Database Connector

**Purpose**: Verifies database connectivity and configuration

**Interface**:

```typescript
interface DatabaseConnector {
  validateEnvVars(): Promise<EnvValidation>;
  testConnection(): Promise<ConnectionResult>;
  runTestQuery(): Promise<QueryResult>;
  checkRLSPolicies(): Promise<RLSStatus>;
}

interface ConnectionResult {
  connected: boolean;
  error: string | null;
  latency: number;
}

interface QueryResult {
  success: boolean;
  rowCount: number;
  error: string | null;
}

interface RLSStatus {
  enabled: boolean;
  blockingReads: boolean;
  policies: Policy[];
}

interface DatabaseStatusResult {
  envValidation: EnvValidation;
  connectionResult: ConnectionResult;
  testQuery: QueryResult;
  rlsStatus: RLSStatus;
}
```

### 6. Component Inventory

**Purpose**: Maps and validates frontend component health

**Interface**:

```typescript
interface ComponentInventory {
  scanRoutes(): Promise<Route[]>;
  analyzeComponent(route: Route): Promise<ComponentHealth>;
  captureErrors(route: Route): Promise<ConsoleError[]>;
  checkAssets(route: Route): Promise<AssetStatus[]>;
  prioritizeIssues(components: ComponentHealth[]): PrioritizedIssues;
}

interface Route {
  path: string;
  name: string;
  components: string[];
}

interface ComponentHealth {
  route: string;
  renderStatus: "working" | "broken" | "partial";
  errors: ConsoleError[];
  missingAssets: string[];
  missingData: string[];
}

interface PrioritizedIssues {
  p0: ComponentHealth[]; // Blocks launch
  p1: ComponentHealth[]; // Important
  p2: ComponentHealth[]; // Nice-to-have
}

interface ComponentInventoryResult {
  routes: Route[];
  componentHealth: ComponentHealth[];
  prioritizedIssues: PrioritizedIssues;
}
```

### 7. Report Generator

**Purpose**: Produces structured markdown reports

**Interface**:

```typescript
interface ReportGenerator {
  generateReport(diagnostic: DiagnosticReport): string;
  saveReport(report: string, filename: string): Promise<void>;
  formatCommands(commands: string[]): string;
  formatErrors(errors: ConsoleError[]): string;
}
```

## Data Models

### Recovery Plan

```typescript
interface RecoveryPlan {
  steps: RecoveryStep[];
  estimatedDuration: number;
  riskLevel: "low" | "medium" | "high";
  rollbackPlan: string[];
}

interface RecoveryStep {
  id: string;
  description: string;
  commands: string[];
  validation: ValidationCheck;
  dependencies: string[]; // IDs of steps that must complete first
  priority: "critical" | "high" | "medium" | "low";
}

interface ValidationCheck {
  type: "command" | "api" | "manual";
  check: string;
  expectedResult: string;
}
```

### Configuration

```typescript
interface RecoveryConfig {
  gitRepoPath: string;
  serverPort: number;
  serverStartCommand: string;
  testRoutes: string[];
  requiredEnvVars: string[];
  supabaseConfig: {
    urlVar: string;
    keyVar: string;
    testTable: string;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I've identified several opportunities to consolidate redundant properties:

1. **Error Structure Properties (2.3, 5.3, 7.3)**: All three criteria verify that errors include file paths and line numbers. These can be consolidated into a single property about error data structure.

2. **Environment Variable Validation (2.5, 4.1, 4.4)**: Multiple criteria check for missing environment variables. These can be combined into one comprehensive property.

3. **Report Structure Properties (7.1, 7.2, 7.4, 7.5)**: Several criteria validate different aspects of report generation. These can be consolidated into properties about report completeness and formatting.

4. **Validation Properties (6.5, 8.1)**: Both criteria ensure validation checks exist for recovery steps. These represent the same underlying requirement.

The consolidated properties below eliminate this redundancy while maintaining complete coverage of all requirements.

### Consolidated Correctness Properties

**Property 1: Commit retrieval count accuracy**
_For any_ repository, when retrieving recent commits with a specified count N, the returned array SHALL contain exactly N commits or fewer if the repository has fewer than N total commits
**Validates: Requirements 1.1**

**Property 2: Commit data completeness**
_For any_ commit retrieved by the Git History Analyzer, the commit object SHALL contain non-empty values for hash, author, date, message, and filesChanged fields
**Validates: Requirements 1.2**

**Property 3: Breaking commit identification**
_For any_ commit that modifies package.json, deletes files, or contains error-related keywords in the message, the Git History Analyzer SHALL flag it as a potentially breaking commit
**Validates: Requirements 1.3**

**Property 4: Diff summary structure**
_For any_ commit identified as breaking, the generated diff summary SHALL contain filesModified array, non-negative linesAdded count, non-negative linesDeleted count, and suspiciousPatterns array
**Validates: Requirements 1.4**

**Property 5: Recovery command generation**
_For any_ valid commit hash, the Recovery System SHALL generate git commands that include the exact commit hash and follow valid git command syntax
**Validates: Requirements 1.5**

**Property 6: Server startup error detection**
_For any_ server startup attempt, if the server fails to start, the Server Health Monitor SHALL capture and report at least one startup error
**Validates: Requirements 2.1**

**Property 7: Port identification accuracy**
_For any_ running development server, the Server Health Monitor SHALL extract and report a port number that matches the actual port the server is listening on
**Validates: Requirements 2.2**

**Property 8: Error data structure consistency**
_For any_ error captured by the Recovery System (console errors, component errors, or documented errors), the error object SHALL include non-empty filePath, lineNumber, and message fields
**Validates: Requirements 2.3, 5.3, 7.3**

**Property 9: API failure classification**
_For any_ HTTP API call with a status code outside the 2xx range, the Server Health Monitor SHALL classify it as a failing call
**Validates: Requirements 2.4**

**Property 10: Environment variable validation completeness**
_For any_ list of required environment variables and any environment configuration, the Recovery System SHALL identify all variables that are missing from the configuration with no false positives
**Validates: Requirements 2.5, 4.1, 4.4**

**Property 11: Dependency cleanup verification**
_For any_ dependency cleanup operation, after completion, the node_modules directory and package-lock.json file SHALL not exist in the file system
**Validates: Requirements 3.1**

**Property 12: Cache clear execution**
_For any_ dependency cleaning operation, the npm cache clear command SHALL execute and complete without throwing an exception
**Validates: Requirements 3.2**

**Property 13: Install error capture**
_For any_ npm install operation that fails, the Dependency Auditor SHALL capture and include error messages in the InstallResult
**Validates: Requirements 3.3**

**Property 14: Audit result structure**
_For any_ completed npm audit, the AuditResult SHALL contain arrays for vulnerabilities, outdatedPackages, and missingPackages
**Validates: Requirements 3.4, 3.5**

**Property 15: Database connection status binary**
_For any_ database connection test, the ConnectionResult status SHALL be exactly one of: connected (true) or failed (false)
**Validates: Requirements 4.3**

**Property 16: Test query execution**
_For any_ database health check where required environment variables are present, the Database Connector SHALL attempt to execute a test query
**Validates: Requirements 4.2**

**Property 17: RLS blocking detection**
_For any_ database test where Row Level Security policies block read operations, the RLS status SHALL report blockingReads as true
**Validates: Requirements 4.5**

**Property 18: Route scanning completeness**
_For any_ application with a defined set of routes, the Component Inventory SHALL scan and return results for all routes in the configuration
**Validates: Requirements 5.1**

**Property 19: Component render status classification**
_For any_ scanned component, the ComponentHealth SHALL assign a renderStatus of exactly one of: 'working', 'broken', or 'partial'
**Validates: Requirements 5.2**

**Property 20: Missing asset identification**
_For any_ component analysis, all referenced assets (images, stylesheets, scripts) that return 404 errors SHALL be included in the missingAssets array
**Validates: Requirements 5.4**

**Property 21: Priority classification completeness**
_For any_ set of component issues, each issue SHALL be assigned to exactly one priority level: P0, P1, or P2
**Validates: Requirements 5.5**

**Property 22: Diagnostic aggregation completeness**
_For any_ full diagnostic run, the unified DiagnosticReport SHALL include non-null results from all five diagnostic agents: gitAnalysis, serverHealth, dependencyAudit, databaseStatus, and componentInventory
**Validates: Requirements 6.1**

**Property 23: Recovery step prioritization**
_For any_ recovery plan with multiple steps, steps marked as 'critical' priority SHALL appear before steps marked as 'high', 'medium', or 'low' priority
**Validates: Requirements 6.2**

**Property 24: Recovery step actionability**
_For any_ recovery step in a recovery plan, the step SHALL include a non-empty commands array
**Validates: Requirements 6.3**

**Property 25: Risk-based path recommendation**
_For any_ set of alternative recovery paths, the recommended path SHALL have a riskLevel less than or equal to all other paths
**Validates: Requirements 6.4**

**Property 26: Validation check presence**
_For any_ recovery step, the step SHALL include a ValidationCheck object with non-empty type, check, and expectedResult fields
**Validates: Requirements 6.5, 8.1**

**Property 27: Report markdown validity**
_For any_ generated diagnostic report, the report string SHALL be valid markdown syntax and contain all required sections: Git Analysis, Server Health, Dependency Audit, Database Status, and Component Inventory
**Validates: Requirements 7.1, 7.2**

**Property 28: Command formatting consistency**
_For any_ commands included in a report, each command SHALL be wrapped in markdown code fence blocks (triple backticks)
**Validates: Requirements 7.4**

**Property 29: Report filename timestamp format**
_For any_ saved report file, the filename SHALL include a timestamp in ISO 8601 format (YYYY-MM-DD-HH-mm-ss)
**Validates: Requirements 7.5**

**Property 30: Post-step validation execution**
_For any_ applied recovery step, the Recovery System SHALL execute the step's ValidationCheck before marking the step as complete
**Validates: Requirements 8.1**

**Property 31: Success status propagation**
_For any_ recovery step where validation succeeds, the step status SHALL transition to 'complete' and the next step SHALL begin execution
**Validates: Requirements 8.2**

**Property 32: Failure alternative provision**
_For any_ recovery step where validation fails, the failure result SHALL include at least one alternative recovery approach
**Validates: Requirements 8.3**

**Property 33: Final comprehensive health check**
_For any_ recovery sequence where all steps complete, the Recovery System SHALL execute a full diagnostic across all five agents before generating the success report
**Validates: Requirements 8.4**

**Property 34: Recovery comparison report**
_For any_ successful recovery, the success report SHALL include both the initial DiagnosticReport (before recovery) and final DiagnosticReport (after recovery)
**Validates: Requirements 8.5**

## Error Handling

### Error Categories

1. **Git Operation Errors**

   - Repository not found
   - Invalid commit hash
   - Branch creation conflicts
   - Insufficient git permissions

2. **Server Errors**

   - Port already in use
   - Server startup timeout
   - Missing dependencies preventing server start
   - Configuration errors

3. **Dependency Errors**

   - npm not installed
   - Network errors during package download
   - Version conflicts
   - Corrupted package cache

4. **Database Errors**

   - Connection timeout
   - Invalid credentials
   - RLS policy blocking access
   - Network connectivity issues

5. **File System Errors**
   - Permission denied
   - Disk space full
   - File not found
   - Invalid path

### Error Handling Strategy

**Graceful Degradation**: Each diagnostic agent operates independently. If one agent fails, others continue and the failure is reported in the final diagnostic report.

**Retry Logic**: Network-dependent operations (database connections, npm installs) implement exponential backoff retry with a maximum of 3 attempts.

**Timeout Protection**: All long-running operations (server startup, npm install) have configurable timeouts to prevent indefinite hanging.

**Error Context**: All errors include contextual information (which agent, what operation, relevant configuration) to aid debugging.

**Rollback Safety**: Recovery operations that modify the file system or git repository provide rollback commands in case of failure.

### Error Response Format

```typescript
interface RecoveryError {
  agent: string;
  operation: string;
  error: Error;
  context: Record<string, any>;
  recoverable: boolean;
  suggestedAction: string;
}
```

## Testing Strategy

### Unit Testing

The recovery system will use **Jest** as the testing framework for unit tests. Unit tests will focus on:

1. **Individual Agent Logic**

   - Git commit parsing and analysis
   - Environment variable validation
   - Error message parsing
   - Priority classification logic

2. **Data Transformation**

   - Converting raw git output to Commit objects
   - Parsing npm audit JSON to AuditResult
   - Formatting markdown reports

3. **Edge Cases**
   - Empty repositories (< 20 commits)
   - Missing configuration files
   - Malformed environment variables
   - Empty diagnostic results

### Property-Based Testing

The recovery system will use **fast-check** as the property-based testing library. Property-based tests will verify the 34 correctness properties defined above. Each property test will:

- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the specific correctness property from the design document
- Use the format: `**Feature: site-recovery-diagnostic, Property {number}: {property_text}**`

**Generator Strategy**:

- **Commit Generator**: Creates random commits with varying file patterns, messages, and metadata
- **Server Status Generator**: Generates various server states (running, stopped, error states)
- **Environment Config Generator**: Creates env configurations with random subsets of required variables
- **Component Health Generator**: Generates component states with various error conditions
- **Diagnostic Report Generator**: Creates complete diagnostic reports with random agent results

**Key Property Tests**:

1. **Commit Retrieval (Property 1)**: Generate repositories with varying commit counts, verify returned array length
2. **Error Structure (Property 8)**: Generate various error types, verify all have required fields
3. **Priority Ordering (Property 23)**: Generate random recovery steps, verify critical steps come first
4. **Report Completeness (Property 27)**: Generate random diagnostic data, verify all sections present in report

### Integration Testing

Integration tests will verify:

1. **End-to-End Diagnostic Flow**: Run full diagnostic on a test repository and verify report generation
2. **Recovery Execution**: Apply recovery steps to a broken test environment and verify fixes
3. **Agent Coordination**: Verify orchestrator correctly aggregates results from all agents
4. **File System Operations**: Test actual dependency cleanup and reinstallation

### Test Environment Setup

- **Test Repository**: A git repository with known good and bad commits for testing git analysis
- **Mock Server**: A configurable test server that can simulate various failure modes
- **Test Database**: A Supabase test instance with controlled RLS policies
- **Test Application**: A minimal Next.js app with intentionally broken components for inventory testing

## Implementation Notes

### CLI Commands

```bash
# Run full diagnostic
npm run recovery:diagnose

# Run specific diagnostic agent
npm run recovery:diagnose --agent=git
npm run recovery:diagnose --agent=server
npm run recovery:diagnose --agent=dependencies
npm run recovery:diagnose --agent=database
npm run recovery:diagnose --agent=components

# Execute recovery plan
npm run recovery:execute --plan=./recovery-plan.json

# Generate report only
npm run recovery:report --input=./diagnostic-results.json
```

### Configuration File

The system reads from `.recovery.config.json`:

```json
{
  "gitRepoPath": ".",
  "serverPort": 3001,
  "serverStartCommand": "npm run dev",
  "testRoutes": ["/", "/products", "/dashboard", "/search"],
  "requiredEnvVars": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "DATABASE_URL"
  ],
  "supabaseConfig": {
    "urlVar": "NEXT_PUBLIC_SUPABASE_URL",
    "keyVar": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "testTable": "suppliers"
  },
  "timeouts": {
    "serverStart": 30000,
    "databaseConnection": 5000,
    "npmInstall": 300000
  }
}
```

### Output Structure

Reports are saved to `.recovery/reports/` with timestamped filenames:

- `diagnostic-2025-12-01-14-30-00.md` - Full diagnostic report
- `recovery-plan-2025-12-01-14-30-00.json` - Executable recovery plan
- `recovery-success-2025-12-01-15-00-00.md` - Post-recovery comparison

### Performance Considerations

- **Parallel Execution**: Independent diagnostic agents run in parallel to minimize total diagnostic time
- **Caching**: Git commit data is cached during a diagnostic run to avoid repeated git operations
- **Streaming Output**: Large outputs (npm install logs) are streamed to avoid memory issues
- **Incremental Reports**: Progress updates are written to the report file as agents complete

### Security Considerations

- **Credential Protection**: Environment variables and API keys are redacted in reports
- **Command Injection Prevention**: All shell commands are parameterized to prevent injection
- **File System Boundaries**: All file operations are restricted to the project directory
- **Git Safety**: Recovery branch creation requires confirmation before overwriting existing branches
