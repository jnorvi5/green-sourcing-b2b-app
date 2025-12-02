# Requirements Document

## Introduction

This document specifies the requirements for an automated Environmental Product Declaration (EPD) data pipeline that aggregates, normalizes, and enriches EPD data from multiple sources. The system will provide a unified API for querying EPD data and automatically link EPDs to products in the GreenChainz marketplace.

## Glossary

- **EPD System**: The automated data pipeline that fetches, processes, and stores Environmental Product Declarations
- **EPD (Environmental Product Declaration)**: A standardized document that quantifies the environmental impact of a product across its lifecycle
- **Data Source**: An external API or system that provides EPD data (EPD International, EC3, EPD Hub)
- **Sync Job**: A scheduled task that fetches new or updated EPDs from data sources
- **De-duplication Engine**: The component that identifies and merges duplicate EPD records
- **Enrichment Service**: The component that matches EPDs to existing products and adds contextual data
- **Validation Engine**: The component that verifies EPD data quality and flags issues
- **EPD Number**: A unique identifier for an EPD (e.g., EPD-XXX-YYYYMMDD)
- **GWP (Global Warming Potential)**: A measure of carbon footprint, typically measured in kg CO2e
- **PCR (Product Category Rules)**: Standards that define how EPDs are created for specific product categories
- **ILCD+EPD Format**: An XML-based data format for EPD data
- **Functional Unit**: The reference unit for comparing environmental impacts (e.g., 1 kg, 1 m², 1 piece)

## Requirements

### Requirement 1

**User Story:** As a data pipeline administrator, I want EPDs to be automatically fetched from multiple sources daily, so that the GreenChainz database stays current without manual intervention.

#### Acceptance Criteria

1. WHEN the daily sync job executes THEN the EPD System SHALL fetch new and updated EPDs from EPD International API
2. WHEN the EC3 API access is granted THEN the EPD System SHALL fetch EPDs from Building Transparency EC3 API
3. WHEN the EPD Hub API is configured THEN the EPD System SHALL fetch EPDs from EPD Hub API
4. WHEN fetching from any data source THEN the EPD System SHALL log the number of EPDs retrieved and the timestamp
5. WHEN a data source is unavailable THEN the EPD System SHALL log the failure and continue processing other sources

### Requirement 2

**User Story:** As a data engineer, I want EPD data to be parsed and normalized from various formats, so that all EPDs have a consistent structure in the database.

#### Acceptance Criteria

1. WHEN receiving ILCD+EPD XML format THEN the EPD System SHALL parse the XML and extract all required fields
2. WHEN extracting EPD data THEN the EPD System SHALL capture EPD number, product name, manufacturer, carbon footprint (GWP A1-A3 and GWP total), declared unit, functional unit, validity dates, PCR reference, and geographic scope
3. WHEN parsing fails for a field THEN the EPD System SHALL log the parsing error and store null for that field
4. WHEN all required fields are extracted THEN the EPD System SHALL normalize the data to the database schema format
5. WHEN normalization completes THEN the EPD System SHALL validate that EPD number and product name are present

### Requirement 3

**User Story:** As a database administrator, I want duplicate EPDs to be automatically detected and merged, so that the database contains only unique EPD records.

#### Acceptance Criteria

1. WHEN processing an EPD THEN the De-duplication Engine SHALL check if the EPD number already exists in the database
2. WHEN an EPD number matches an existing record THEN the De-duplication Engine SHALL compare the modification dates
3. WHEN the new EPD is more recent THEN the De-duplication Engine SHALL update the existing record with new data
4. WHEN the existing EPD is more recent THEN the De-duplication Engine SHALL skip the update and log the duplicate
5. WHEN an EPD number is new THEN the De-duplication Engine SHALL insert the EPD as a new record

### Requirement 4

**User Story:** As a product manager, I want EPDs to be automatically linked to existing products, so that product listings show verified environmental data without manual matching.

#### Acceptance Criteria

1. WHEN an EPD is processed THEN the Enrichment Service SHALL attempt to match the EPD to existing products by manufacturer name
2. WHEN manufacturer names match THEN the Enrichment Service SHALL compare product names using fuzzy matching
3. WHEN product name similarity exceeds 80% THEN the Enrichment Service SHALL link the EPD to the product by setting the product's epd_id field
4. WHEN no match is found THEN the Enrichment Service SHALL flag the EPD for manual review
5. WHEN multiple products match THEN the Enrichment Service SHALL select the product with the highest similarity score

### Requirement 5

**User Story:** As a data quality manager, I want EPD data to be validated for accuracy and completeness, so that only high-quality data is available to users.

#### Acceptance Criteria

1. WHEN validating an EPD THEN the Validation Engine SHALL check that the expiry date is in the future
2. WHEN validating an EPD THEN the Validation Engine SHALL verify the EPD number matches the expected format (EPD-XXX-YYYYMMDD or similar)
3. WHEN validating carbon footprint data THEN the Validation Engine SHALL flag EPDs where GWP equals zero as suspicious
4. WHEN validation fails THEN the Validation Engine SHALL mark the EPD with a validation status and log the specific validation errors
5. WHEN validation succeeds THEN the Validation Engine SHALL mark the EPD as validated and available for use

### Requirement 6

**User Story:** As a frontend developer, I want a REST API to query EPD data with filters, so that I can display relevant EPDs to users based on their search criteria.

#### Acceptance Criteria

1. WHEN the API receives a GET request to /api/epd/search THEN the EPD System SHALL return a filtered list of EPDs based on query parameters
2. WHEN filtering by material_type THEN the EPD System SHALL return only EPDs matching the specified material type
3. WHEN filtering by max_carbon THEN the EPD System SHALL return only EPDs where GWP total is less than or equal to the specified value
4. WHEN filtering by manufacturer THEN the EPD System SHALL return only EPDs from the specified manufacturer
5. WHEN no filters are provided THEN the EPD System SHALL return all valid (non-expired) EPDs with pagination

### Requirement 7

**User Story:** As a supplier, I want to upload my own EPD PDFs, so that my products can display verified environmental data even if not in public databases.

#### Acceptance Criteria

1. WHEN a supplier uploads an EPD PDF THEN the EPD System SHALL store the PDF in cloud storage (AWS S3 or Supabase Storage)
2. WHEN the PDF is stored THEN the EPD System SHALL create an EPD record with status "pending_extraction"
3. WHEN manual extraction is completed THEN the EPD System SHALL update the EPD record with extracted data
4. WHEN the EPD is linked to a product THEN the EPD System SHALL mark the EPD as "verified" or "supplier_provided"
5. WHEN displaying EPDs THEN the EPD System SHALL indicate the source (API-sourced vs supplier-uploaded)

### Requirement 8

**User Story:** As a system administrator, I want monitoring and alerting for the data pipeline, so that I can quickly identify and resolve issues.

#### Acceptance Criteria

1. WHEN a sync job completes THEN the EPD System SHALL log the success/failure status, number of EPDs processed, and execution time
2. WHEN more than 10% of EPDs fail validation THEN the EPD System SHALL send an alert to the administrator
3. WHEN a data source API fails THEN the EPD System SHALL log the error and send an alert if failures exceed 3 consecutive attempts
4. WHEN the weekly report is generated THEN the EPD System SHALL include counts of new EPDs added, expired EPDs, and duplicates removed
5. WHEN critical errors occur THEN the EPD System SHALL send immediate alerts via email or monitoring service

### Requirement 9

**User Story:** As a data engineer, I want the pipeline to handle rate limits and API quotas gracefully, so that we don't exceed provider limits or incur unexpected costs.

#### Acceptance Criteria

1. WHEN making API requests THEN the EPD System SHALL respect rate limits specified by each data source
2. WHEN approaching rate limits THEN the EPD System SHALL implement exponential backoff and retry logic
3. WHEN API quota is exhausted THEN the EPD System SHALL log the quota exhaustion and pause requests until quota resets
4. WHEN resuming after quota reset THEN the EPD System SHALL continue processing from where it stopped
5. WHEN tracking API usage THEN the EPD System SHALL log the number of API calls made to each source per day

### Requirement 10

**User Story:** As a platform operator, I want the pipeline to be serverless and cost-effective, so that it scales automatically and minimizes operational overhead.

#### Acceptance Criteria

1. WHEN implementing the sync job THEN the EPD System SHALL use Supabase Edge Functions or AWS Lambda for serverless execution
2. WHEN the sync job runs THEN the EPD System SHALL complete within the serverless function timeout (10 minutes for Edge Functions, 15 minutes for Lambda)
3. WHEN processing large datasets THEN the EPD System SHALL implement batch processing to stay within memory limits
4. WHEN scheduling sync jobs THEN the EPD System SHALL use Supabase pg_cron or AWS EventBridge for automated execution
5. WHEN the system is idle THEN the EPD System SHALL incur minimal costs (serverless pay-per-use model)
