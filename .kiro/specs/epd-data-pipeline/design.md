# Design Document

## Overview

The EPD Data Pipeline is an automated system that aggregates Environmental Product Declaration (EPD) data from multiple sources, normalizes it into a unified format, enriches it by linking to existing products, validates data quality, and provides a REST API for querying. The system operates as a serverless data pipeline with daily sync jobs, de-duplication, and comprehensive monitoring.

The pipeline supports four data sources:

1. **EPD International API** (free access, highest priority)
2. **Building Transparency EC3 API** (pending access)
3. **EPD Hub API** (commercial, pending configuration)
4. **Manual PDF uploads** (supplier-provided)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EPD Data Pipeline                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ EPD Intl API │  │   EC3 API    │  │ EPD Hub API  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                            ▼                                      │
│                  ┌──────────────────┐                           │
│                  │   Sync Service   │                           │
│                  │  (Edge Function) │                           │
│                  └────────┬─────────┘                           │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                  │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Parser    │  │Deduplication│  │ Validation  │           │
│  │   Module    │  │   Engine    │  │   Engine    │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                  │
│                           │                                      │
│                           ▼                                      │
│                  ┌──────────────────┐                           │
│                  │   Enrichment     │                           │
│                  │    Service       │                           │
│                  └────────┬─────────┘                           │
│                           │                                      │
│                           ▼                                      │
│                  ┌──────────────────┐                           │
│                  │  Supabase DB     │                           │
│                  │  (epd_data)      │                           │
│                  └────────┬─────────┘                           │
│                           │                                      │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │   REST API       │
                   │  /api/epd/*      │
                   └──────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │   Frontend       │
                   │  (Product Pages) │
                   └──────────────────┘
```

### Technology Stack

- **Serverless Runtime**: Supabase Edge Functions (Deno) or AWS Lambda (Node.js)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage or AWS S3 (for PDF uploads)
- **Scheduling**: Supabase pg_cron or AWS EventBridge
- **Monitoring**: Supabase Logs + Custom alerting
- **API Framework**: Supabase Edge Functions HTTP handlers

### Deployment Model

The system deploys as multiple Supabase Edge Functions:

1. **epd-sync-daily**: Main sync job (scheduled daily)
2. **epd-sync-source**: Per-source sync function (called by main job)
3. **epd-upload-handler**: Handles manual PDF uploads
4. **epd-search-api**: Public API for querying EPDs

## Components and Interfaces

### 1. Sync Service

**Purpose**: Orchestrates daily data fetching from all configured sources

**Interface**:

```typescript
interface SyncJobConfig {
  sources: DataSourceConfig[];
  batchSize: number;
  maxRetries: number;
}

interface DataSourceConfig {
  name: string;
  apiUrl: string;
  apiKey?: string;
  enabled: boolean;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

interface SyncResult {
  source: string;
  success: boolean;
  epdsProcessed: number;
  epdsFailed: number;
  duration: number;
  errors: string[];
}

async function runDailySync(): Promise<SyncResult[]>;
async function syncSource(source: DataSourceConfig): Promise<SyncResult>;
```

**Responsibilities**:

- Load configuration for all data sources
- Execute sync for each enabled source sequentially
- Track API usage and respect rate limits
- Aggregate results and generate summary report
- Handle source failures gracefully (continue with other sources)

### 2. Parser Module

**Purpose**: Parses EPD data from various formats (XML, JSON) into normalized structure

**Interface**:

```typescript
interface RawEPDData {
  format: "ILCD_XML" | "JSON" | "PDF";
  content: string | Buffer;
  source: string;
}

interface ParsedEPD {
  epdNumber: string;
  productName: string;
  manufacturer: string;
  carbonFootprint: {
    gwpA1A3: number | null; // kg CO2e
    gwpTotal: number | null; // kg CO2e
    gwpA4: number | null;
    gwpA5: number | null;
    gwpB: number | null;
    gwpC: number | null;
  };
  declaredUnit: string; // e.g., "1 kg", "1 m²", "1 piece"
  functionalUnit: string;
  validityDates: {
    issued: Date;
    expires: Date;
  };
  pcrReference: string;
  geographicScope: string[];
  dataSource: string;
  rawData: any;
}

interface ParseResult {
  success: boolean;
  epd: ParsedEPD | null;
  errors: string[];
  warnings: string[];
}

async function parseILCDXML(xml: string): Promise<ParseResult>;
async function parseJSON(json: any): Promise<ParseResult>;
async function parseEPD(raw: RawEPDData): Promise<ParseResult>;
```

**XML Parsing Strategy** (ILCD+EPD Format):

```xml
<!-- Example ILCD+EPD structure -->
<EPD>
  <registrationNumber>EPD-XXX-20240101</registrationNumber>
  <productName>Recycled Steel Rebar</productName>
  <manufacturer>SteelCorp Industries</manufacturer>
  <LCAResults>
    <indicator name="GWP-fossil" stage="A1-A3" value="450.2" unit="kg CO2e"/>
    <indicator name="GWP-total" value="485.5" unit="kg CO2e"/>
  </LCAResults>
  <declaredUnit>1 kg</declaredUnit>
  <validFrom>2024-01-01</validFrom>
  <validUntil>2029-01-01</validUntil>
  <PCR>EN 15804+A2</PCR>
  <geographicScope>Europe</geographicScope>
</EPD>
```

### 3. De-duplication Engine

**Purpose**: Identifies and merges duplicate EPD records

**Interface**:

```typescript
interface DeduplicationResult {
  action: "insert" | "update" | "skip";
  existingEpdId?: string;
  reason: string;
}

async function checkDuplicate(epdNumber: string): Promise<{
  exists: boolean;
  existingEpd?: StoredEPD;
}>;

async function deduplicateEPD(parsed: ParsedEPD): Promise<DeduplicationResult>;

async function mergeEPDData(
  existing: StoredEPD,
  incoming: ParsedEPD
): Promise<StoredEPD>;
```

**De-duplication Logic**:

1. Check if EPD number exists in database
2. If exists, compare modification dates or data freshness
3. If incoming is newer, update existing record
4. If existing is newer, skip update and log
5. If new, insert as new record

**Database Query**:

```sql
SELECT * FROM epd_data
WHERE epd_number = $1
LIMIT 1;
```

### 4. Enrichment Service

**Purpose**: Links EPDs to existing products using fuzzy matching

**Interface**:

```typescript
interface MatchCandidate {
  productId: string;
  productName: string;
  manufacturer: string;
  similarityScore: number;
}

interface EnrichmentResult {
  matched: boolean;
  productId?: string;
  matchScore?: number;
  requiresManualReview: boolean;
  reason: string;
}

async function findMatchingProducts(epd: ParsedEPD): Promise<MatchCandidate[]>;

async function enrichEPD(epd: ParsedEPD): Promise<EnrichmentResult>;

function calculateSimilarity(str1: string, str2: string): number; // 0-1 score
```

**Matching Algorithm**:

1. **Manufacturer Match**: Exact or fuzzy match on manufacturer name (threshold: 85%)
2. **Product Name Match**: Fuzzy string matching using Levenshtein distance (threshold: 80%)
3. **Score Calculation**:
   - Manufacturer exact match: +50 points
   - Manufacturer fuzzy match: +30 points
   - Product name similarity: +50 points (scaled by similarity %)
   - Total score: 0-100

**Fuzzy Matching Implementation**:

```typescript
// Using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; i <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}
```

**Database Query**:

```sql
-- Find potential product matches
SELECT
  p.ProductID,
  p.ProductName,
  c.CompanyName as Manufacturer,
  similarity(p.ProductName, $1) as name_similarity,
  similarity(c.CompanyName, $2) as manufacturer_similarity
FROM Products p
JOIN Suppliers s ON p.SupplierID = s.SupplierID
JOIN Companies c ON s.CompanyID = c.CompanyID
WHERE
  similarity(c.CompanyName, $2) > 0.85
  AND similarity(p.ProductName, $1) > 0.80
ORDER BY
  (similarity(p.ProductName, $1) + similarity(c.CompanyName, $2)) DESC
LIMIT 5;
```

### 5. Validation Engine

**Purpose**: Validates EPD data quality and flags issues

**Interface**:

```typescript
interface ValidationRule {
  name: string;
  check: (epd: ParsedEPD) => boolean;
  severity: "error" | "warning";
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validationStatus: "valid" | "invalid" | "suspicious";
}

async function validateEPD(epd: ParsedEPD): Promise<ValidationResult>;
```

**Validation Rules**:

1. **Required Fields**:

   - EPD number must be present
   - Product name must be present
   - Manufacturer must be present
   - At least one GWP value must be present

2. **EPD Number Format**:

   - Pattern: `/^EPD-[A-Z0-9]+-\d{8}$/` or similar
   - Examples: `EPD-XXX-20240101`, `S-P-00123`

3. **Date Validation**:

   - Expiry date must be in the future
   - Issue date must be before expiry date
   - Validity period typically 5 years

4. **Data Quality**:

   - GWP values should not be exactly zero (suspicious)
   - GWP values should be within reasonable ranges
   - Declared unit should be valid (kg, m², m³, piece, etc.)

5. **Geographic Scope**:
   - Should contain valid region/country codes

**Implementation**:

```typescript
const validationRules: ValidationRule[] = [
  {
    name: "epd_number_required",
    check: (epd) => !!epd.epdNumber,
    severity: "error",
    message: "EPD number is required",
  },
  {
    name: "not_expired",
    check: (epd) => new Date(epd.validityDates.expires) > new Date(),
    severity: "error",
    message: "EPD has expired",
  },
  {
    name: "gwp_not_zero",
    check: (epd) => epd.carbonFootprint.gwpTotal !== 0,
    severity: "warning",
    message: "GWP value is zero (suspicious)",
  },
  {
    name: "valid_declared_unit",
    check: (epd) => /^(kg|m²|m³|piece|ton|liter)$/i.test(epd.declaredUnit),
    severity: "warning",
    message: "Declared unit format is non-standard",
  },
];
```

### 6. API Service

**Purpose**: Provides REST API for querying EPD data

**Interface**:

```typescript
interface EPDSearchParams {
  material_type?: string;
  max_carbon?: number;
  manufacturer?: string;
  min_recycled_content?: number;
  geographic_scope?: string;
  valid_only?: boolean;
  page?: number;
  limit?: number;
}

interface EPDSearchResponse {
  epds: StoredEPD[];
  total: number;
  page: number;
  limit: number;
  filters: EPDSearchParams;
}

async function searchEPDs(params: EPDSearchParams): Promise<EPDSearchResponse>;

async function getEPDById(id: string): Promise<StoredEPD | null>;
async function getEPDByNumber(epdNumber: string): Promise<StoredEPD | null>;
```

**API Endpoints**:

1. **GET /api/epd/search**

   - Query parameters: material_type, max_carbon, manufacturer, etc.
   - Returns: Paginated list of EPDs
   - Example: `/api/epd/search?material_type=insulation&max_carbon=15`

2. **GET /api/epd/:id**

   - Returns: Single EPD by database ID

3. **GET /api/epd/number/:epdNumber**

   - Returns: Single EPD by EPD number

4. **POST /api/epd/upload**
   - Body: PDF file + metadata
   - Returns: Upload confirmation and pending EPD ID

**Database Query** (Search):

```sql
SELECT
  e.*,
  p.ProductName,
  p.ProductID,
  c.CompanyName as Manufacturer
FROM epd_data e
LEFT JOIN Products p ON e.linked_product_id = p.ProductID
LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
LEFT JOIN Companies c ON s.CompanyID = c.CompanyID
WHERE
  ($1::text IS NULL OR e.material_type = $1)
  AND ($2::numeric IS NULL OR e.gwp_total <= $2)
  AND ($3::text IS NULL OR c.CompanyName ILIKE '%' || $3 || '%')
  AND ($4::boolean IS FALSE OR e.expiry_date > CURRENT_DATE)
  AND e.validation_status = 'valid'
ORDER BY e.created_at DESC
LIMIT $5 OFFSET $6;
```

## Data Models

### EPD Data Model

```typescript
interface StoredEPD {
  // Primary identifiers
  id: string; // UUID
  epdNumber: string; // Unique EPD registration number

  // Product information
  productName: string;
  manufacturer: string;
  materialType?: string; // Lumber, Steel, Concrete, etc.

  // Carbon footprint data
  gwpA1A3: number | null; // kg CO2e (cradle to gate)
  gwpTotal: number | null; // kg CO2e (full lifecycle)
  gwpA4: number | null; // Transport
  gwpA5: number | null; // Installation
  gwpB: number | null; // Use phase
  gwpC: number | null; // End of life

  // Units and scope
  declaredUnit: string; // "1 kg", "1 m²"
  functionalUnit: string;
  geographicScope: string[]; // ["Europe", "North America"]

  // Validity
  issuedDate: Date;
  expiryDate: Date;

  // Standards and verification
  pcrReference: string; // Product Category Rules
  verifiedBy: string; // "EPD International"
  dataSource: string; // "EPD International API"
  dataSourceUrl?: string;

  // Enrichment
  linkedProductId?: string; // Foreign key to Products table
  matchScore?: number; // 0-100
  requiresManualReview: boolean;

  // Validation
  validationStatus: "valid" | "invalid" | "suspicious" | "pending";
  validationErrors: string[];
  validationWarnings: string[];

  // Metadata
  rawData: any; // Original API response
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt: Date;
  syncSource: string; // "daily_sync", "manual_upload"
}
```

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS epd_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  epd_number VARCHAR(255) UNIQUE NOT NULL,

  -- Product information
  product_name VARCHAR(500) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  material_type VARCHAR(100),

  -- Carbon footprint (kg CO2e)
  gwp_a1_a3 DECIMAL(15, 4),
  gwp_total DECIMAL(15, 4),
  gwp_a4 DECIMAL(15, 4),
  gwp_a5 DECIMAL(15, 4),
  gwp_b DECIMAL(15, 4),
  gwp_c DECIMAL(15, 4),

  -- Units and scope
  declared_unit VARCHAR(50) NOT NULL,
  functional_unit VARCHAR(255),
  geographic_scope TEXT[], -- Array of regions

  -- Validity
  issued_date DATE NOT NULL,
  expiry_date DATE NOT NULL,

  -- Standards
  pcr_reference VARCHAR(255),
  verified_by VARCHAR(255) NOT NULL,
  data_source VARCHAR(255) NOT NULL,
  data_source_url TEXT,

  -- Enrichment
  linked_product_id BIGINT REFERENCES Products(ProductID) ON DELETE SET NULL,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  requires_manual_review BOOLEAN DEFAULT FALSE,

  -- Validation
  validation_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('valid', 'invalid', 'suspicious', 'pending')),
  validation_errors TEXT[],
  validation_warnings TEXT[],

  -- Metadata
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sync_source VARCHAR(100) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_epd_data_epd_number ON epd_data(epd_number);
CREATE INDEX idx_epd_data_manufacturer ON epd_data(manufacturer);
CREATE INDEX idx_epd_data_material_type ON epd_data(material_type);
CREATE INDEX idx_epd_data_gwp_total ON epd_data(gwp_total);
CREATE INDEX idx_epd_data_expiry_date ON epd_data(expiry_date);
CREATE INDEX idx_epd_data_validation_status ON epd_data(validation_status);
CREATE INDEX idx_epd_data_linked_product ON epd_data(linked_product_id);
CREATE INDEX idx_epd_data_requires_review ON epd_data(requires_manual_review)
  WHERE requires_manual_review = TRUE;

-- Full-text search index
CREATE INDEX idx_epd_data_search ON epd_data
  USING gin(to_tsvector('english', product_name || ' ' || manufacturer));
```

### Sync Log Model

```sql
CREATE TABLE IF NOT EXISTS epd_sync_log (
  sync_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(255) NOT NULL,

  -- Results
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  epds_fetched INTEGER DEFAULT 0,
  epds_inserted INTEGER DEFAULT 0,
  epds_updated INTEGER DEFAULT 0,
  epds_failed INTEGER DEFAULT 0,
  epds_skipped INTEGER DEFAULT 0,

  -- Performance
  duration_seconds INTEGER,
  api_calls_made INTEGER DEFAULT 0,

  -- Errors
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_epd_sync_log_date ON epd_sync_log(sync_date DESC);
CREATE INDEX idx_epd_sync_log_source ON epd_sync_log(data_source, sync_date DESC);
CREATE INDEX idx_epd_sync_log_status ON epd_sync_log(status);
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Property 1: EPD fetching from EPD International
_For any_ sync job execution, the system should attempt to fetch EPDs from the EPD International API and log the results
**Validates: Requirements 1.1**

Property 2: EPD fetching from EC3 when configured
_For any_ sync job execution where EC3 API credentials are configured, the system should fetch EPDs from the EC3 API
**Validates: Requirements 1.2**

Property 3: EPD fetching from EPD Hub when configured
_For any_ sync job execution where EPD Hub API credentials are configured, the system should fetch EPDs from the EPD Hub API
**Validates: Requirements 1.3**

Property 4: Fetch operation logging
_For any_ data source fetch operation, the system should log the number of EPDs retrieved and the timestamp
**Validates: Requirements 1.4**

Property 5: Graceful source failure handling
_For any_ data source that fails, the system should log the failure and continue processing remaining sources
**Validates: Requirements 1.5**

Property 6: XML parsing completeness
_For any_ valid ILCD+EPD XML input, the parser should extract all required fields without errors
**Validates: Requirements 2.1**

Property 7: Required field extraction
_For any_ EPD data extraction, all required fields (EPD number, product name, manufacturer, GWP, declared unit, functional unit, validity dates, PCR, geographic scope) should be captured
**Validates: Requirements 2.2**

Property 8: Parsing error handling
_For any_ field that fails to parse, the system should log the parsing error and store null for that field
**Validates: Requirements 2.3**

Property 9: Data normalization
_For any_ successfully extracted EPD data, the normalized output should conform to the database schema format
**Validates: Requirements 2.4**

Property 10: Post-normalization validation
_For any_ normalized EPD data, the system should validate that EPD number and product name are present
**Validates: Requirements 2.5**

Property 11: Duplicate detection
_For any_ EPD being processed, the system should check if the EPD number already exists in the database
**Validates: Requirements 3.1**

Property 12: Modification date comparison
_For any_ EPD with a matching EPD number, the system should compare modification dates to determine update action
**Validates: Requirements 3.2**

Property 13: Update on newer data
_For any_ incoming EPD that is more recent than the existing record, the system should update the existing record
**Validates: Requirements 3.3**

Property 14: Skip on older data
_For any_ incoming EPD that is older than the existing record, the system should skip the update and log the duplicate
**Validates: Requirements 3.4**

Property 15: Insert new EPDs
_For any_ EPD with a new EPD number, the system should insert it as a new record
**Validates: Requirements 3.5**

Property 16: Manufacturer matching attempt
_For any_ EPD being processed, the enrichment service should attempt to match it to existing products by manufacturer name
**Validates: Requirements 4.1**

Property 17: Fuzzy product name matching
_For any_ EPD where manufacturer names match, the system should perform fuzzy matching on product names
**Validates: Requirements 4.2**

Property 18: Linking on high similarity
_For any_ EPD-product pair with name similarity exceeding 80%, the system should link the EPD to the product
**Validates: Requirements 4.3**

Property 19: Manual review flagging
_For any_ EPD with no matching products, the system should flag it for manual review
**Validates: Requirements 4.4**

Property 20: Highest score selection
_For any_ EPD with multiple matching products, the system should select the product with the highest similarity score
**Validates: Requirements 4.5**

Property 21: Expiry date validation
_For any_ EPD being validated, the system should check that the expiry date is in the future
**Validates: Requirements 5.1**

Property 22: EPD number format validation
_For any_ EPD being validated, the system should verify the EPD number matches the expected format pattern
**Validates: Requirements 5.2**

Property 23: Zero GWP flagging
_For any_ EPD with GWP equal to zero, the system should flag it as suspicious
**Validates: Requirements 5.3**

Property 24: Validation failure marking
_For any_ EPD that fails validation, the system should mark it with a validation status and log specific errors
**Validates: Requirements 5.4**

Property 25: Validation success marking
_For any_ EPD that passes validation, the system should mark it as validated and available for use
**Validates: Requirements 5.5**

Property 26: API search filtering
_For any_ GET request to /api/epd/search with query parameters, the system should return a filtered list of EPDs
**Validates: Requirements 6.1**

Property 27: Material type filtering
_For any_ search with material_type parameter, all returned EPDs should match the specified material type
**Validates: Requirements 6.2**

Property 28: Carbon footprint filtering
_For any_ search with max_carbon parameter, all returned EPDs should have GWP total less than or equal to the specified value
**Validates: Requirements 6.3**

Property 29: Manufacturer filtering
_For any_ search with manufacturer parameter, all returned EPDs should be from the specified manufacturer
**Validates: Requirements 6.4**

Property 30: Default search behavior
_For any_ search with no filters, the system should return all valid (non-expired) EPDs with pagination
**Validates: Requirements 6.5**

Property 31: PDF storage on upload
_For any_ supplier-uploaded EPD PDF, the system should store it in cloud storage
**Validates: Requirements 7.1**

Property 32: Pending extraction record creation
_For any_ stored PDF, the system should create an EPD record with status "pending_extraction"
**Validates: Requirements 7.2**

Property 33: Extraction completion update
_For any_ completed manual extraction, the system should update the EPD record with extracted data
**Validates: Requirements 7.3**

Property 34: Source status marking
_For any_ EPD linked to a product, the system should mark it as "verified" or "supplier_provided"
**Validates: Requirements 7.4**

Property 35: Source indication in display
_For any_ EPD displayed, the system should indicate whether it is API-sourced or supplier-uploaded
**Validates: Requirements 7.5**

Property 36: Sync job completion logging
_For any_ completed sync job, the system should log success/failure status, EPD counts, and execution time
**Validates: Requirements 8.1**

Property 37: High failure rate alerting
_For any_ sync job where more than 10% of EPDs fail validation, the system should send an alert to the administrator
**Validates: Requirements 8.2**

Property 38: Consecutive failure alerting
_For any_ data source with more than 3 consecutive failures, the system should send an alert
**Validates: Requirements 8.3**

Property 39: Weekly report completeness
_For any_ weekly report generated, it should include counts of new EPDs added, expired EPDs, and duplicates removed
**Validates: Requirements 8.4**

Property 40: Critical error alerting
_For any_ critical error, the system should send immediate alerts via email or monitoring service
**Validates: Requirements 8.5**

Property 41: Rate limit compliance
_For any_ data source, API requests should not exceed the specified rate limits
**Validates: Requirements 9.1**

Property 42: Exponential backoff on rate limit approach
_For any_ situation approaching rate limits, the system should implement exponential backoff and retry logic
**Validates: Requirements 9.2**

Property 43: Quota exhaustion handling
_For any_ API quota exhaustion, the system should log it and pause requests until quota resets
**Validates: Requirements 9.3**

Property 44: Resume after quota reset
_For any_ quota reset, the system should continue processing from where it stopped
**Validates: Requirements 9.4**

Property 45: API usage tracking
_For any_ API call made, the system should log the call count per source per day
**Validates: Requirements 9.5**

Property 46: Batch processing for large datasets
_For any_ large dataset being processed, the system should implement batch processing to stay within memory limits
**Validates: Requirements 10.3**

## Error Handling

### Error Categories

1. **API Errors**: External API failures, rate limits, authentication issues

   - Action: Retry with exponential backoff (3 attempts)
   - Log error details and continue with other sources
   - Alert admin if consecutive failures exceed threshold

2. **Parsing Errors**: Invalid XML/JSON format, missing required fields

   - Action: Log parsing error with context
   - Store partial data with null fields
   - Flag for manual review

3. **Validation Errors**: Expired EPDs, invalid formats, suspicious data

   - Action: Mark EPD with validation status
   - Log specific validation failures
   - Allow storage but flag as invalid/suspicious

4. **Database Errors**: Connection failures, constraint violations, query errors

   - Action: Retry with exponential backoff (3 attempts)
   - Log error and affected EPD
   - Alert admin on persistent failures

5. **Storage Errors**: PDF upload failures, cloud storage issues
   - Action: Retry upload (3 attempts)
   - Return error to user if all retries fail
   - Log failure for admin review

### Retry Strategy

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on validation or parsing errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

### Alert Thresholds

- **Immediate**: Critical errors, API authentication failures, database connection failures
- **Hourly**: High validation failure rate (>10%), consecutive source failures (>3)
- **Daily**: Sync job failures, quota exhaustion
- **Weekly**: Summary report with statistics

## Testing Strategy

### Unit Testing

Unit tests will verify individual components:

1. **Parser Module**:

   - Test XML parsing with valid ILCD+EPD format
   - Test JSON parsing from different APIs
   - Test error handling for malformed data
   - Test field extraction completeness

2. **De-duplication Engine**:

   - Test duplicate detection by EPD number
   - Test date comparison logic
   - Test update vs skip decisions
   - Test new record insertion

3. **Enrichment Service**:

   - Test manufacturer name matching (exact and fuzzy)
   - Test product name similarity calculation
   - Test linking logic with various similarity scores
   - Test manual review flagging

4. **Validation Engine**:

   - Test expiry date validation
   - Test EPD number format validation
   - Test GWP zero detection
   - Test validation status marking

5. **API Service**:
   - Test search with various filter combinations
   - Test pagination
   - Test response format
   - Test error handling

### Property-Based Testing

Property-based tests will use **fast-check** library (100 iterations per property):

**Configuration**:

```typescript
import fc from "fast-check";

const testConfig = { numRuns: 100 };
```

**Example Property Test**:

```typescript
// Feature: epd-data-pipeline, Property 27: Material type filtering
test("Property 27: Material type filter returns only matching EPDs", () => {
  fc.assert(
    fc.property(
      fc.constantFrom("Lumber", "Steel", "Concrete", "Glass", "Insulation"),
      async (materialType) => {
        const results = await searchEPDs({ material_type: materialType });

        // Property: All results must match the material type
        for (const epd of results.epds) {
          expect(epd.material_type).toBe(materialType);
        }
      }
    ),
    testConfig
  );
});
```

**Generators (Arbitraries)**:

```typescript
const epdDataArbitrary = fc.record({
  epdNumber: fc.string({ minLength: 10, maxLength: 30 }),
  productName: fc.string({ minLength: 5, maxLength: 200 }),
  manufacturer: fc.string({ minLength: 3, maxLength: 100 }),
  materialType: fc.constantFrom(
    "Lumber",
    "Steel",
    "Concrete",
    "Glass",
    "Insulation"
  ),
  gwpA1A3: fc.double({ min: -1000, max: 10000 }),
  gwpTotal: fc.double({ min: -1000, max: 10000 }),
  declaredUnit: fc.constantFrom("kg", "m²", "m³", "piece", "ton"),
  issuedDate: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  expiryDate: fc.date({ min: new Date(), max: new Date("2030-12-31") }),
});

const xmlEPDArbitrary = fc
  .record({
    registrationNumber: fc.string({ minLength: 10 }),
    productName: fc.string({ minLength: 5 }),
    manufacturer: fc.string({ minLength: 3 }),
    gwpA1A3: fc.double({ min: 0, max: 10000 }),
    validFrom: fc.date(),
    validUntil: fc.date(),
  })
  .map(
    (data) => `
<EPD>
  <registrationNumber>${data.registrationNumber}</registrationNumber>
  <productName>${data.productName}</productName>
  <manufacturer>${data.manufacturer}</manufacturer>
  <LCAResults>
    <indicator name="GWP-fossil" stage="A1-A3" value="${
      data.gwpA1A3
    }" unit="kg CO2e"/>
  </LCAResults>
  <validFrom>${data.validFrom.toISOString()}</validFrom>
  <validUntil>${data.validUntil.toISOString()}</validUntil>
</EPD>
`
  );
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Full Sync Pipeline**:

   - Fetch from mock API → Parse → Deduplicate → Enrich → Validate → Store
   - Verify database state at each step
   - Verify logging and metrics

2. **API Search**:

   - Seed database with test EPDs
   - Execute various search queries
   - Verify filtering and pagination

3. **PDF Upload Flow**:

   - Upload PDF → Store → Create record → Extract → Link
   - Verify storage and database state

4. **Error Recovery**:
   - Simulate API failures
   - Verify retry logic and error logging
   - Verify graceful degradation

## Performance Considerations

### Scalability

- **Batch Processing**: Process EPDs in batches of 100 to manage memory
- **Concurrent API Calls**: Fetch from multiple sources in parallel (with rate limiting)
- **Database Indexing**: Optimize queries with appropriate indexes
- **Caching**: Cache frequently accessed EPDs (1 hour TTL)

### Optimization Strategies

1. **Database Optimization**:

   - Use JSONB for flexible raw_data storage
   - Create GIN index for full-text search
   - Use partial indexes for filtered queries
   - Implement connection pooling

2. **API Optimization**:

   - Implement request batching where supported
   - Use conditional requests (If-Modified-Since)
   - Cache API responses (5 minutes)
   - Implement circuit breaker pattern

3. **Memory Management**:
   - Stream large XML files instead of loading entirely
   - Process EPDs in batches
   - Clear processed data from memory
   - Monitor memory usage and adjust batch size

### Monitoring Metrics

- **Sync Performance**:

  - EPDs processed per minute
  - API response times (p50, p95, p99)
  - Parse success rate
  - Validation pass rate

- **Data Quality**:

  - Percentage of EPDs requiring manual review
  - Average match score for enriched EPDs
  - Validation error distribution

- **System Health**:
  - API failure rate by source
  - Database query performance
  - Memory usage
  - Function execution time

## Security Considerations

### API Key Management

- Store all API keys in environment variables
- Rotate keys quarterly
- Use separate keys for production and development
- Never log API keys

### Data Protection

- Validate and sanitize all input data
- Prevent XML External Entity (XXE) attacks in XML parsing
- Use parameterized queries to prevent SQL injection
- Encrypt sensitive data at rest

### Access Control

- Require authentication for upload endpoints
- Implement rate limiting on public API endpoints
- Use service role key for database access
- Audit log all data modifications

## Deployment

### Environment Variables

```bash
# Data Source APIs
EPD_INTERNATIONAL_API_KEY=your_key
EC3_API_KEY=your_key
EPD_HUB_API_KEY=your_key

# Database
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key

# Storage
SUPABASE_STORAGE_BUCKET=epd-pdfs
# OR
AWS_S3_BUCKET=greenchainz-epd-pdfs
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_key

# Monitoring
ADMIN_EMAIL=admin@greenchainz.com
ALERT_WEBHOOK_URL=https://hooks.slack.com/...

# Configuration
SYNC_BATCH_SIZE=100
MAX_RETRIES=3
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### Deployment Steps

1. **Database Setup**:

   ```sql
   -- Run migration
   psql -h [db-host] -U postgres -d postgres -f migrations/epd_data_schema.sql
   ```

2. **Edge Functions Deployment**:

   ```bash
   # Deploy sync function
   supabase functions deploy epd-sync-daily

   # Deploy API function
   supabase functions deploy epd-search-api

   # Deploy upload handler
   supabase functions deploy epd-upload-handler

   # Set secrets
   supabase secrets set EPD_INTERNATIONAL_API_KEY=your_key
   supabase secrets set EC3_API_KEY=your_key
   # ... set all other secrets
   ```

3. **Schedule Daily Sync**:

   ```sql
   -- Create cron job for daily sync at 2 AM UTC
   SELECT cron.schedule(
     'epd-daily-sync',
     '0 2 * * *',
     $$
     SELECT net.http_post(
       url := 'https://[project-ref].supabase.co/functions/v1/epd-sync-daily',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
       )
     );
     $$
   );
   ```

4. **Verification**:
   - Trigger manual sync and verify EPDs are fetched
   - Test API endpoints with sample queries
   - Upload test PDF and verify storage
   - Check logs for errors
   - Verify monitoring alerts work

### Rollback Plan

1. Disable cron job:

   ```sql
   SELECT cron.unschedule('epd-daily-sync');
   ```

2. Revert Edge Functions:

   ```bash
   supabase functions deploy epd-sync-daily --version [previous-version]
   ```

3. Restore database if needed:
   ```sql
   -- Restore from backup
   pg_restore -h [db-host] -U postgres -d postgres [backup-file]
   ```
