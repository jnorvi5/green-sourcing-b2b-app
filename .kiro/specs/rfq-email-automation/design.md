# Design Document

## Overview

The RFQ Email Automation system is a serverless workflow that automatically connects architects submitting RFQs with the most suitable suppliers through intelligent matching and email notifications. The system leverages Supabase Edge Functions for serverless execution, Zoho Mail API for supplier notifications, MailerLite for architect confirmations, and implements comprehensive tracking and error handling.

The system operates as an event-driven architecture triggered by RFQ submissions, executing a multi-stage pipeline: validation → matching → notification → tracking → follow-up.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Architect      │
│  Submits RFQ    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Edge Function: rfq-email-automation          │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Validation  │→ │   Matching   │→ │ Notification │ │
│  │   Module     │  │    Engine    │  │   Service    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Tracking   │  │   Follow-up  │  │    Error     │ │
│  │   Service    │  │   Scheduler  │  │   Handler    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Zoho Mail    │    │  MailerLite  │    │  Supabase    │
│     API      │    │     API      │    │   Database   │
└──────────────┘    └──────────────┘    └──────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Suppliers   │    │  Architects  │    │  Tracking &  │
│  (3 matched) │    │ (Confirmation)│    │  Error Logs  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Technology Stack

- **Serverless Runtime**: Supabase Edge Functions (Deno runtime)
- **Database**: Supabase PostgreSQL
- **Email Services**:
  - Zoho Mail REST API (supplier notifications)
  - MailerLite API (architect confirmations)
- **Scheduling**: Supabase pg_cron for follow-up reminders
- **Error Handling**: Exponential backoff with retry logic

### Deployment Model

The system deploys as a Supabase Edge Function triggered by database events (RFQ insertion) or HTTP requests. The function executes in an isolated Deno runtime with access to environment variables for API credentials.

## Components and Interfaces

### 1. Validation Module

**Purpose**: Validates incoming RFQ data before processing

**Interface**:

```typescript
interface RFQValidationResult {
  isValid: boolean;
  errors: string[];
  rfq: RFQData | null;
}

function validateRFQ(rfqData: unknown): RFQValidationResult;
```

**Responsibilities**:

- Validate required fields (material type, location, budget, timeline, certifications)
- Sanitize input data
- Check data types and formats
- Return structured validation results

### 2. Matching Engine

**Purpose**: Identifies the top 3 suppliers matching RFQ criteria

**Interface**:

```typescript
interface MatchingCriteria {
  materialType: string;
  projectLocation: { lat: number; lon: number };
  radius: number; // in kilometers
  requiredCertifications: string[]; // ['FSC', 'LEED', 'C2C']
  budgetRange: { min: number; max: number };
}

interface MatchedSupplier {
  supplierId: number;
  supplierName: string;
  email: string;
  matchScore: number;
  tier: "verified" | "standard";
  certifications: string[];
  distance: number;
}

async function matchSuppliers(
  criteria: MatchingCriteria
): Promise<MatchedSupplier[]>;
```

**Matching Algorithm**:

1. **Material Type Filter**: Exact match on product category
2. **Geographic Filter**: Calculate distance using Haversine formula, filter by radius
3. **Certification Filter**: Prioritize suppliers with all required certifications
4. **Tier Ranking**: Verified tier suppliers ranked higher than standard
5. **Score Calculation**:
   - Material match: 40 points
   - All certifications: 30 points
   - Verified tier: 20 points
   - Distance proximity: 10 points (closer = higher)
6. **Selection**: Return top 3 by score

**Database Query**:

```sql
WITH supplier_matches AS (
  SELECT
    s.SupplierID,
    s.CompanyID,
    c.CompanyName,
    u.Email,
    sp.Tier,
    -- Calculate distance using Haversine formula
    (6371 * acos(
      cos(radians($projectLat)) *
      cos(radians(c.Latitude)) *
      cos(radians(c.Longitude) - radians($projectLon)) +
      sin(radians($projectLat)) *
      sin(radians(c.Latitude))
    )) AS distance,
    -- Count matching certifications
    (SELECT COUNT(*)
     FROM Supplier_Certifications sc
     JOIN Certifications cert ON sc.CertificationID = cert.CertificationID
     WHERE sc.SupplierID = s.SupplierID
     AND cert.Name = ANY($requiredCerts)
     AND sc.Status = 'Valid'
    ) AS matching_certs
  FROM Suppliers s
  JOIN Companies c ON s.CompanyID = c.CompanyID
  JOIN Users u ON u.CompanyID = c.CompanyID AND u.Role = 'Supplier'
  JOIN Supplier_Profiles sp ON s.SupplierID = sp.SupplierID
  WHERE EXISTS (
    SELECT 1 FROM Products p
    JOIN Product_Categories pc ON p.CategoryID = pc.CategoryID
    WHERE p.SupplierID = s.SupplierID
    AND pc.CategoryName = $materialType
  )
)
SELECT *,
  (40 + -- Material match base score
   (matching_certs * 10) + -- 10 points per matching cert
   (CASE WHEN Tier = 'verified' THEN 20 ELSE 0 END) + -- Tier bonus
   (10 * (1 - (distance / $radius))) -- Distance score (closer = higher)
  ) AS match_score
FROM supplier_matches
WHERE distance <= $radius
ORDER BY match_score DESC
LIMIT 3;
```

### 3. Email Service

**Purpose**: Sends emails via Zoho Mail and MailerLite APIs

**Interface**:

```typescript
interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
  trackingId: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount: number;
}

async function sendSupplierEmail(
  supplier: MatchedSupplier,
  rfq: RFQData,
  trackingId: string
): Promise<EmailResult>;

async function sendArchitectConfirmation(
  architect: ArchitectData,
  supplierCount: number,
  rfqId: string
): Promise<EmailResult>;

async function sendManualReviewAlert(rfq: RFQData): Promise<EmailResult>;
```

**Email Templates**:

**Supplier Notification Template**:

```
Subject: New RFQ from {architectCompanyName} - {materialType}

Body:
Hello {supplierName},

You have a new Request for Quote from {architectCompanyName}.

PROJECT DETAILS:
- Company: {architectCompanyName}
- Location: {projectLocation}
- Material: {materialSpecifications}
- Budget Range: {budgetRange}
- Delivery Timeline: {deliveryTimeline}
- Required Certifications: {requiredCertifications}

RESPOND TO THIS RFQ:
{responseLink}

This RFQ was matched to you based on your product offerings and certifications.
Please respond within 48 hours to maintain your response rate.

Best regards,
GreenChainz Team
```

**Architect Confirmation Template**:

```
Subject: Your RFQ has been sent to {supplierCount} suppliers

Body:
Hi {architectName},

Your Request for Quote has been successfully sent to {supplierCount} verified suppliers.

WHAT HAPPENS NEXT:
- Suppliers will review your RFQ within 48 hours
- You'll receive email notifications when suppliers respond
- Track your RFQ status: {trackingLink}

EXPECTED TIMELINE:
- First responses: Within 24-48 hours
- All responses: Within 3-5 business days

Questions? Reply to this email or visit our Help Center.

Best regards,
GreenChainz Team
```

### 4. Tracking Service

**Purpose**: Logs email delivery and engagement metrics

**Interface**:

```typescript
interface EmailTracking {
  trackingId: string;
  rfqId: string;
  supplierId: number;
  status: "sent" | "opened" | "clicked" | "bounced";
  timestamp: Date;
  metadata: Record<string, any>;
}

async function logEmailSent(tracking: EmailTracking): Promise<void>;
async function updateEmailStatus(
  trackingId: string,
  status: EmailTracking["status"]
): Promise<void>;
async function getEmailMetrics(rfqId: string): Promise<EmailTracking[]>;
```

**Database Schema Addition**:

```sql
CREATE TABLE IF NOT EXISTS RFQ_Email_Tracking (
  TrackingID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  RFQID BIGINT REFERENCES RFQs(RFQID) ON DELETE CASCADE,
  SupplierID BIGINT REFERENCES Suppliers(SupplierID) ON DELETE CASCADE,
  EmailType VARCHAR(50) NOT NULL CHECK (EmailType IN ('supplier_notification', 'architect_confirmation', 'reminder', 'manual_review')),
  Status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (Status IN ('sent', 'opened', 'clicked', 'bounced', 'failed')),
  MessageID VARCHAR(255),
  SentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  OpenedAt TIMESTAMP,
  ClickedAt TIMESTAMP,
  BouncedAt TIMESTAMP,
  RetryCount INTEGER DEFAULT 0,
  ErrorMessage TEXT,
  Metadata JSONB
);

CREATE INDEX idx_rfq_email_tracking_rfq ON RFQ_Email_Tracking(RFQID, SentAt DESC);
CREATE INDEX idx_rfq_email_tracking_supplier ON RFQ_Email_Tracking(SupplierID, Status);
CREATE INDEX idx_rfq_email_tracking_status ON RFQ_Email_Tracking(Status, SentAt DESC);
```

### 5. Follow-up Scheduler

**Purpose**: Sends reminder emails to non-responsive suppliers

**Interface**:

```typescript
interface FollowUpCheck {
  rfqId: string;
  supplierId: number;
  initialEmailSentAt: Date;
  hasResponded: boolean;
}

async function checkFollowUpNeeded(): Promise<FollowUpCheck[]>;
async function sendReminderEmail(
  supplier: MatchedSupplier,
  rfq: RFQData
): Promise<EmailResult>;
```

**Implementation**:

- Supabase pg_cron job runs every hour
- Queries RFQ_Email_Tracking for emails sent 48+ hours ago
- Checks RFQ_Responses for supplier responses
- Sends reminder if no response found

**Cron Job SQL**:

```sql
-- Run every hour
SELECT cron.schedule(
  'rfq-follow-up-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/rfq-follow-up',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  );
  $$
);
```

### 6. Error Handler

**Purpose**: Manages retries, logging, and alerting for failures

**Interface**:

```typescript
interface ErrorContext {
  component: string;
  operation: string;
  rfqId?: string;
  supplierId?: number;
  error: Error;
  metadata: Record<string, any>;
}

async function handleError(context: ErrorContext): Promise<void>;
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelay: number
): Promise<T>;
```

**Retry Strategy**:

- Max retries: 3
- Backoff delays: 2s, 4s, 8s (exponential)
- Retry on: Network errors, 5xx responses, timeouts
- No retry on: 4xx errors (except 429 rate limit), validation errors

**Error Logging Schema**:

```sql
CREATE TABLE IF NOT EXISTS RFQ_Error_Logs (
  ErrorID BIGSERIAL PRIMARY KEY,
  RFQID BIGINT REFERENCES RFQs(RFQID) ON DELETE SET NULL,
  Component VARCHAR(100) NOT NULL,
  Operation VARCHAR(100) NOT NULL,
  ErrorType VARCHAR(100) NOT NULL,
  ErrorMessage TEXT NOT NULL,
  StackTrace TEXT,
  Context JSONB,
  RetryCount INTEGER DEFAULT 0,
  Resolved BOOLEAN DEFAULT FALSE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rfq_error_logs_rfq ON RFQ_Error_Logs(RFQID, CreatedAt DESC);
CREATE INDEX idx_rfq_error_logs_component ON RFQ_Error_Logs(Component, Resolved);
CREATE INDEX idx_rfq_error_logs_created ON RFQ_Error_Logs(CreatedAt DESC);
```

## Data Models

### RFQ Data Model

```typescript
interface RFQData {
  rfqId: string;
  buyerId: number;
  architectCompanyName: string;
  architectName: string;
  architectEmail: string;
  projectName: string;
  projectLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
  };
  materialType: string;
  materialSpecifications: string;
  quantityNeeded: number;
  unit: string;
  budgetRange: {
    min: number;
    max: number;
    currency: string;
  };
  deliveryTimeline: string;
  requiredCertifications: string[];
  searchRadius: number; // in kilometers
  additionalNotes?: string;
  createdAt: Date;
}
```

### Supplier Data Model

```typescript
interface SupplierData {
  supplierId: number;
  companyId: number;
  companyName: string;
  email: string;
  contactName: string;
  tier: "verified" | "standard";
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lon: number;
  };
  certifications: Certification[];
  products: Product[];
  responseRate: number; // percentage
  averageResponseTime: number; // hours
}

interface Certification {
  certificationId: number;
  name: string;
  certifyingBody: string;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  status: "Valid" | "Expired" | "Suspended";
}
```

### Email Tracking Data Model

```typescript
interface EmailTrackingData {
  trackingId: string;
  rfqId: string;
  supplierId: number;
  emailType:
    | "supplier_notification"
    | "architect_confirmation"
    | "reminder"
    | "manual_review";
  status: "sent" | "opened" | "clicked" | "bounced" | "failed";
  messageId: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  retryCount: number;
  errorMessage?: string;
  metadata: {
    provider: "zoho" | "mailerlite";
    templateVersion: string;
    userAgent?: string;
    ipAddress?: string;
  };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Property 1: RFQ storage with unique identifier
_For any_ valid RFQ data, when the workflow executes, the RFQ should be stored in the database with a unique identifier that doesn't conflict with existing RFQs
**Validates: Requirements 1.2**

Property 2: Required field validation
_For any_ RFQ data with missing required fields (material type, location, budget range, timeline, or certifications), the validation should fail and identify all missing fields
**Validates: Requirements 1.3**

Property 3: Validation failure handling
_For any_ invalid RFQ data, when validation fails, an error should be logged to the error_logs table and an administrator notification should be triggered
**Validates: Requirements 1.4**

Property 4: Workflow progression on valid input
_For any_ valid RFQ data, when validation succeeds, the matching engine should be invoked with the validated RFQ data
**Validates: Requirements 1.5**

Property 5: Material type exact matching
_For any_ RFQ with a specific material type, all returned suppliers should have products in that exact material type category
**Validates: Requirements 2.1**

Property 6: Geographic radius filtering
_For any_ RFQ with a project location and search radius, all returned suppliers should be located within the specified radius (calculated using Haversine formula)
**Validates: Requirements 2.2**

Property 7: Certification prioritization
_For any_ two suppliers where one has all required certifications and the other doesn't, the supplier with all certifications should be ranked higher
**Validates: Requirements 2.3**

Property 8: Tier-based ranking
_For any_ two suppliers with equal certification matches, the verified tier supplier should be ranked higher than the standard tier supplier
**Validates: Requirements 2.4**

Property 9: Top 3 supplier selection
_For any_ RFQ where more than 3 suppliers match the criteria, exactly 3 suppliers should be returned, ordered by match score descending
**Validates: Requirements 2.5**

Property 10: Email sent to all matched suppliers
_For any_ set of matched suppliers, an email should be sent to each supplier's email address using the Zoho Mail API
**Validates: Requirements 3.1**

Property 11: Subject line format
_For any_ supplier notification email, the subject line should match the format "New RFQ from [Architect Company Name] - [Material Type]" with actual values substituted
**Validates: Requirements 3.2**

Property 12: Email body completeness
_For any_ supplier notification email, the body should contain all required fields: architect company name, project location, material specifications, budget range, delivery timeline, and required certifications
**Validates: Requirements 3.3**

Property 13: Response link format
_For any_ supplier notification email, the response link should match the format "https://greenchainz.com/supplier/rfq/[rfq_id]" with the actual RFQ ID
**Validates: Requirements 3.4**

Property 14: Email delivery tracking
_For any_ successfully sent email, a tracking record should be created in the database with status "sent" and a timestamp
**Validates: Requirements 3.6**

Property 15: Retry on failure
_For any_ failed email send, the system should retry up to 3 times before marking as permanently failed
**Validates: Requirements 3.7**

Property 16: Error logging and continuation
_For any_ email that fails after all retries, the failure should be logged to error_logs and processing should continue for remaining suppliers
**Validates: Requirements 3.8**

Property 17: Tracking record creation
_For any_ email sent, a tracking record should be created with status "sent" and a timestamp within 1 second of sending
**Validates: Requirements 4.1**

Property 18: Open status update
_For any_ email open event, the tracking record status should be updated to "opened" with the open timestamp
**Validates: Requirements 4.2**

Property 19: Click status update
_For any_ link click event, the tracking record status should be updated to "clicked" with the click timestamp
**Validates: Requirements 4.3**

Property 20: Bounce status update
_For any_ email bounce event, the tracking record status should be updated to "bounced" with the bounce timestamp
**Validates: Requirements 4.4**

Property 21: Status history preservation
_For any_ tracking record with multiple status changes, all previous statuses and timestamps should be preserved in the history
**Validates: Requirements 4.5**

Property 22: Reminder for non-responsive suppliers
_For any_ supplier who hasn't responded after the follow-up period, a reminder email should be sent
**Validates: Requirements 5.2**

Property 23: Reminder subject line format
_For any_ reminder email, the subject line should match the format "Reminder: RFQ from [Architect Company Name] - [Material Type]"
**Validates: Requirements 5.3**

Property 24: Original RFQ reference in reminder
_For any_ reminder email, the body should reference the original RFQ details
**Validates: Requirements 5.4**

Property 25: Reminder tracking
_For any_ reminder email sent, the tracking record should be updated to log the reminder delivery
**Validates: Requirements 5.5**

Property 26: No reminder for responded suppliers
_For any_ supplier who has already responded to an RFQ, no reminder email should be sent
**Validates: Requirements 5.6**

Property 27: Architect confirmation email
_For any_ RFQ where all supplier emails have been sent, a confirmation email should be sent to the architect
**Validates: Requirements 6.1**

Property 28: Confirmation content completeness
_For any_ architect confirmation email, the body should include the number of suppliers contacted and the expected response timeline
**Validates: Requirements 6.3**

Property 29: Tracking link in confirmation
_For any_ architect confirmation email, the body should include a link to track the RFQ status
**Validates: Requirements 6.4**

Property 30: Confirmation retry logic
_For any_ failed architect confirmation email, the system should retry up to 2 times before logging the final failure
**Validates: Requirements 6.5**

Property 31: Manual review alert content
_For any_ manual review alert email, the body should include the complete RFQ details and the reason for manual review
**Validates: Requirements 7.2**

Property 32: Admin dashboard link in alert
_For any_ manual review alert email, the body should include a link to the admin dashboard for manual supplier assignment
**Validates: Requirements 7.3**

Property 33: RFQ status update on manual review
_For any_ RFQ that triggers manual review, the RFQ status should be updated to "pending_manual_review"
**Validates: Requirements 7.4**

Property 34: Manual review alert retry
_For any_ failed manual review alert, the system should retry until successful, logging each attempt
**Validates: Requirements 7.5**

Property 35: Comprehensive error logging
_For any_ error encountered in any component, an error log entry should be created with timestamp, error type, error message, and context
**Validates: Requirements 8.1**

Property 36: API error code extraction
_For any_ Zoho Mail API error response, the specific error code should be parsed and logged
**Validates: Requirements 8.2**

Property 37: Database error logging
_For any_ failed database query, the query text and error details should be logged
**Validates: Requirements 8.3**

Property 38: Retry exhaustion logging
_For any_ operation where all retries are exhausted, the final failure state should be logged
**Validates: Requirements 8.4**

Property 39: Critical error alerting
_For any_ critical error, an alert should be sent to the system administrator
**Validates: Requirements 8.5**

Property 40: Graceful failure on missing credentials
_For any_ missing API credential, the system should fail gracefully and log a configuration error without crashing
**Validates: Requirements 9.5**

Property 41: Credential redaction in logs
_For any_ error log entry, the log message should not contain API keys, passwords, or other sensitive credentials
**Validates: Requirements 9.6**

Property 42: Concurrent RFQ isolation
_For any_ two RFQs processed concurrently, the processing of one should not affect the data or outcome of the other
**Validates: Requirements 10.3**

Property 43: Timeout handling
_For any_ Edge Function execution that times out, the timeout should be logged and the system should allow retry mechanisms to handle completion
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid or missing RFQ data

   - Action: Return error to client, log to error_logs
   - No retry

2. **Database Errors**: Connection failures, query errors, constraint violations

   - Action: Retry with exponential backoff (3 attempts)
   - Log to error_logs
   - Alert admin on persistent failures

3. **API Errors**: Zoho Mail, MailerLite API failures

   - 4xx errors (except 429): No retry, log error
   - 429 (rate limit): Retry with backoff
   - 5xx errors: Retry with exponential backoff (3 attempts)
   - Network errors: Retry with exponential backoff (3 attempts)

4. **Timeout Errors**: Edge Function execution timeout

   - Action: Log timeout, mark RFQ for retry
   - Alert admin if repeated timeouts

5. **Configuration Errors**: Missing environment variables
   - Action: Fail fast, log error, alert admin
   - No retry

### Retry Strategy

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on validation or 4xx errors (except 429)
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

### Error Notification Thresholds

- **Immediate Alert**: Configuration errors, critical system failures
- **Hourly Digest**: API failures, database errors (if > 10 in 1 hour)
- **Daily Summary**: Validation errors, timeout errors

## Testing Strategy

### Unit Testing

Unit tests will verify individual components in isolation:

1. **Validation Module Tests**:

   - Test with valid RFQ data
   - Test with missing required fields
   - Test with invalid data types
   - Test with edge cases (empty strings, null values)

2. **Matching Engine Tests**:

   - Test material type filtering
   - Test geographic distance calculations
   - Test certification matching
   - Test tier-based ranking
   - Test score calculation algorithm
   - Test with 0, 1, 2, 3, and 10+ matching suppliers

3. **Email Service Tests**:

   - Test template rendering with various RFQ data
   - Test subject line formatting
   - Test response link generation
   - Test API integration (mocked)
   - Test retry logic with simulated failures

4. **Tracking Service Tests**:

   - Test tracking record creation
   - Test status updates
   - Test history preservation
   - Test concurrent updates

5. **Error Handler Tests**:
   - Test error logging with various error types
   - Test retry logic with different error categories
   - Test credential redaction in logs
   - Test alert triggering

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (TypeScript/JavaScript property testing library). Each test will run a minimum of 100 iterations.

**Configuration**:

```typescript
import fc from "fast-check";

// Configure to run 100 iterations per property
const testConfig = { numRuns: 100 };
```

**Test Structure**:
Each property-based test will:

1. Generate random valid inputs using fast-check arbitraries
2. Execute the system under test
3. Assert the property holds
4. Tag the test with the corresponding property number from the design document

**Example Property Test**:

```typescript
// Feature: rfq-email-automation, Property 5: Material type exact matching
test("Property 5: All returned suppliers match material type", () => {
  fc.assert(
    fc.property(
      fc.record({
        materialType: fc.string({ minLength: 1 }),
        projectLocation: fc.record({
          lat: fc.double({ min: -90, max: 90 }),
          lon: fc.double({ min: -180, max: 180 }),
        }),
        radius: fc.integer({ min: 1, max: 1000 }),
        requiredCertifications: fc.array(fc.string()),
      }),
      async (rfqCriteria) => {
        const suppliers = await matchSuppliers(rfqCriteria);

        // Property: All suppliers must have products in the requested material type
        for (const supplier of suppliers) {
          const hasMatchingMaterial = await supplierHasMaterialType(
            supplier.supplierId,
            rfqCriteria.materialType
          );
          expect(hasMatchingMaterial).toBe(true);
        }
      }
    ),
    testConfig
  );
});
```

**Property Test Coverage**:

- Properties 1-43 will each have a corresponding property-based test
- Edge cases (Requirements 2.6, 2.7, 7.1) will be tested with specific input generators
- Example tests (Requirements 6.2, 9.1-9.4) will be tested with unit tests

**Generators (Arbitraries)**:

```typescript
// Custom arbitraries for domain objects
const rfqDataArbitrary = fc.record({
  rfqId: fc.uuid(),
  buyerId: fc.integer({ min: 1 }),
  architectCompanyName: fc.string({ minLength: 1, maxLength: 255 }),
  architectName: fc.string({ minLength: 1, maxLength: 255 }),
  architectEmail: fc.emailAddress(),
  projectLocation: fc.record({
    lat: fc.double({ min: -90, max: 90 }),
    lon: fc.double({ min: -180, max: 180 }),
    address: fc.string(),
    city: fc.string(),
    state: fc.string(),
    country: fc.string(),
  }),
  materialType: fc.constantFrom(
    "Lumber",
    "Steel",
    "Concrete",
    "Glass",
    "Insulation"
  ),
  quantityNeeded: fc.integer({ min: 1, max: 100000 }),
  budgetRange: fc.record({
    min: fc.integer({ min: 1000, max: 50000 }),
    max: fc.integer({ min: 50001, max: 1000000 }),
  }),
  requiredCertifications: fc.array(
    fc.constantFrom("FSC", "LEED", "C2C", "BREEAM"),
    { minLength: 0, maxLength: 4 }
  ),
  searchRadius: fc.integer({ min: 10, max: 500 }),
});

const supplierDataArbitrary = fc.record({
  supplierId: fc.integer({ min: 1 }),
  companyName: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  tier: fc.constantFrom("verified", "standard"),
  location: fc.record({
    lat: fc.double({ min: -90, max: 90 }),
    lon: fc.double({ min: -180, max: 180 }),
  }),
  certifications: fc.array(fc.constantFrom("FSC", "LEED", "C2C", "BREEAM"), {
    minLength: 0,
    maxLength: 4,
  }),
});
```

### Integration Testing

Integration tests will verify the complete workflow:

1. **End-to-End RFQ Processing**:

   - Submit RFQ → Validate → Match → Send Emails → Track
   - Verify database state at each step
   - Verify emails sent to correct recipients
   - Verify tracking records created

2. **Follow-up Workflow**:

   - Create RFQ with sent emails
   - Simulate 48-hour passage
   - Verify reminder emails sent to non-responsive suppliers
   - Verify no reminders sent to responsive suppliers

3. **Manual Review Workflow**:

   - Submit RFQ with no matching suppliers
   - Verify manual review alert sent
   - Verify RFQ status updated

4. **Error Recovery**:
   - Simulate API failures
   - Verify retry logic
   - Verify error logging
   - Verify graceful degradation

### Test Environment

- **Database**: Supabase test project with seeded data
- **Email APIs**: Mock implementations for unit tests, sandbox accounts for integration tests
- **Edge Functions**: Local Deno runtime for unit tests, deployed test function for integration tests

## Performance Considerations

### Scalability

- **Concurrent Processing**: Edge Functions auto-scale to handle multiple RFQs
- **Database Queries**: Indexed queries for supplier matching (< 100ms)
- **Email Sending**: Concurrent API calls to Zoho Mail (3 suppliers in parallel)
- **Tracking Updates**: Batch updates where possible

### Optimization Strategies

1. **Database Indexing**:

   - Composite index on (material_type, location, certifications)
   - Spatial index for geographic queries
   - Index on RFQ status for follow-up queries

2. **Caching**:

   - Cache supplier data for 5 minutes (reduce DB queries)
   - Cache certification data for 1 hour
   - Cache email templates

3. **Rate Limiting**:
   - Respect Zoho Mail API rate limits (100 emails/minute)
   - Implement queue for high-volume scenarios
   - Backoff on rate limit errors

### Monitoring

- **Metrics**:

  - RFQ processing time (p50, p95, p99)
  - Email delivery success rate
  - Supplier match quality (average match score)
  - Follow-up reminder effectiveness (response rate after reminder)
  - Error rates by component

- **Alerts**:
  - Email delivery failure rate > 5%
  - RFQ processing time > 10 seconds
  - Database query time > 500ms
  - Error rate > 1% of requests

## Security Considerations

### Credential Management

- All API keys stored in Supabase environment variables
- No credentials in code or logs
- Rotate credentials quarterly
- Use service role key for database access (not anon key)

### Data Protection

- Encrypt sensitive RFQ data at rest
- Use HTTPS for all API calls
- Sanitize user input to prevent injection attacks
- Implement rate limiting to prevent abuse

### Access Control

- Edge Function requires authentication
- Only authorized users can submit RFQs
- Suppliers can only access their own RFQ notifications
- Admin alerts require admin role

## Deployment

### Environment Variables

Required environment variables for the Edge Function:

```bash
# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Zoho Mail API
ZOHO_MAIL_API_KEY=your_zoho_api_key
ZOHO_MAIL_FROM_EMAIL=rfq@greenchainz.com
ZOHO_MAIL_FROM_NAME=GreenChainz RFQ System

# MailerLite API
MAILERLITE_API_KEY=your_mailerlite_api_key
MAILERLITE_FROM_EMAIL=notifications@greenchainz.com

# Admin Alerts
ADMIN_EMAIL=founder@greenchainz.com

# Configuration
MAX_RETRIES=3
RETRY_BASE_DELAY_MS=2000
FOLLOW_UP_DELAY_HOURS=48
FUNCTION_TIMEOUT_MS=10000
```

### Deployment Steps

1. **Database Setup**:

   ```sql
   -- Run migration to create RFQ_Email_Tracking and RFQ_Error_Logs tables
   psql -h [db-host] -U postgres -d postgres -f migrations/rfq_email_tracking.sql
   ```

2. **Edge Function Deployment**:

   ```bash
   # Deploy the Edge Function
   supabase functions deploy rfq-email-automation

   # Set environment variables
   supabase secrets set ZOHO_MAIL_API_KEY=your_key
   supabase secrets set MAILERLITE_API_KEY=your_key
   # ... set all other secrets
   ```

3. **Database Trigger Setup**:

   ```sql
   -- Create trigger to invoke Edge Function on RFQ insert
   CREATE OR REPLACE FUNCTION trigger_rfq_email_automation()
   RETURNS TRIGGER AS $$
   BEGIN
     PERFORM net.http_post(
       url := 'https://[project-ref].supabase.co/functions/v1/rfq-email-automation',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
         'Content-Type', 'application/json'
       ),
       body := jsonb_build_object('rfqId', NEW.RFQID)
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER rfq_inserted
   AFTER INSERT ON RFQs
   FOR EACH ROW
   EXECUTE FUNCTION trigger_rfq_email_automation();
   ```

4. **Follow-up Scheduler Setup**:

   ```sql
   -- Create cron job for follow-up reminders
   SELECT cron.schedule(
     'rfq-follow-up-reminders',
     '0 * * * *', -- Every hour
     $$
     SELECT net.http_post(
       url := 'https://[project-ref].supabase.co/functions/v1/rfq-follow-up',
       headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
     );
     $$
   );
   ```

5. **Verification**:
   - Test with sample RFQ submission
   - Verify emails sent to test suppliers
   - Verify tracking records created
   - Verify error logging works
   - Monitor function logs for errors

### Rollback Plan

If issues are detected after deployment:

1. Disable database trigger:

   ```sql
   DROP TRIGGER IF EXISTS rfq_inserted ON RFQs;
   ```

2. Disable cron job:

   ```sql
   SELECT cron.unschedule('rfq-follow-up-reminders');
   ```

3. Revert to previous Edge Function version:

   ```bash
   supabase functions deploy rfq-email-automation --version [previous-version]
   ```

4. Investigate issues in error logs and fix before re-deploying
