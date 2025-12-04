# Implementation Plan

- [ ] 1. Set up database schema and storage

  - Create epd_data table with all required fields
  - Create epd_sync_log table for tracking sync jobs
  - Add indexes for performance optimization
  - Set up Supabase Storage bucket for PDF uploads (or configure AWS S3)
  - Create database functions for similarity matching
  - _Requirements: 2.4, 3.1, 7.1_

- [ ] 1.1 Write property test for database schema

  - **Property 15: Insert new EPDs**
  - **Validates: Requirements 3.5**

- [ ] 2. Implement XML/JSON parser module

  - Create ILCD+EPD XML parser
  - Create JSON parser for API responses
  - Implement field extraction for all required fields
  - Implement error handling for malformed data
  - Implement normalization to database schema
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.1 Write property test for XML parsing

  - **Property 6: XML parsing completeness**
  - **Validates: Requirements 2.1**

- [ ] 2.2 Write property test for field extraction

  - **Property 7: Required field extraction**
  - **Validates: Requirements 2.2**

- [ ] 2.3 Write property test for parsing error handling

  - **Property 8: Parsing error handling**
  - **Validates: Requirements 2.3**

- [ ] 2.4 Write property test for data normalization

  - **Property 9: Data normalization**
  - **Property 10: Post-normalization validation**
  - **Validates: Requirements 2.4, 2.5**

- [ ] 3. Implement de-duplication engine

  - Create duplicate detection by EPD number
  - Implement modification date comparison logic
  - Implement update logic for newer EPDs
  - Implement skip logic for older EPDs
  - Implement insertion logic for new EPDs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.1 Write property test for duplicate detection

  - **Property 11: Duplicate detection**
  - **Validates: Requirements 3.1**

- [ ] 3.2 Write property test for date comparison

  - **Property 12: Modification date comparison**
  - **Validates: Requirements 3.2**

- [ ] 3.3 Write property test for update logic

  - **Property 13: Update on newer data**
  - **Validates: Requirements 3.3**

- [ ] 3.4 Write property test for skip logic

  - **Property 14: Skip on older data**
  - **Validates: Requirements 3.4**

- [ ] 4. Implement validation engine

  - Create expiry date validation rule
  - Create EPD number format validation rule
  - Create zero GWP detection rule
  - Implement validation status marking
  - Implement validation error logging
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.1 Write property test for expiry validation

  - **Property 21: Expiry date validation**
  - **Validates: Requirements 5.1**

- [ ] 4.2 Write property test for format validation

  - **Property 22: EPD number format validation**
  - **Validates: Requirements 5.2**

- [ ] 4.3 Write property test for GWP validation

  - **Property 23: Zero GWP flagging**
  - **Validates: Requirements 5.3**

- [ ] 4.4 Write property test for validation marking

  - **Property 24: Validation failure marking**
  - **Property 25: Validation success marking**
  - **Validates: Requirements 5.4, 5.5**

- [ ] 5. Implement enrichment service

  - Create manufacturer name matching (exact and fuzzy)
  - Implement Levenshtein distance calculation for product names
  - Implement similarity score calculation
  - Implement product linking logic (>80% similarity)
  - Implement manual review flagging
  - Implement highest score selection for multiple matches
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.1 Write property test for manufacturer matching

  - **Property 16: Manufacturer matching attempt**
  - **Validates: Requirements 4.1**

- [ ] 5.2 Write property test for fuzzy matching

  - **Property 17: Fuzzy product name matching**
  - **Validates: Requirements 4.2**

- [ ] 5.3 Write property test for linking logic

  - **Property 18: Linking on high similarity**
  - **Validates: Requirements 4.3**

- [ ] 5.4 Write property test for manual review flagging

  - **Property 19: Manual review flagging**
  - **Validates: Requirements 4.4**

- [ ] 5.5 Write property test for score selection

  - **Property 20: Highest score selection**
  - **Validates: Requirements 4.5**

- [ ] 6. Implement EPD International API integration

  - Create API client with authentication
  - Implement EPD fetching from EPD International
  - Implement response transformation
  - Implement error handling and fallback
  - Implement rate limiting
  - _Requirements: 1.1, 1.4, 1.5, 9.1_

- [ ] 6.1 Write property test for EPD International fetching

  - **Property 1: EPD fetching from EPD International**
  - **Validates: Requirements 1.1**

- [ ] 6.2 Write property test for fetch logging

  - **Property 4: Fetch operation logging**
  - **Validates: Requirements 1.4**

- [ ] 6.3 Write property test for error handling

  - **Property 5: Graceful source failure handling**
  - **Validates: Requirements 1.5**

- [ ] 7. Implement EC3 API integration

  - Create EC3 API client with authentication
  - Implement EPD fetching from EC3
  - Implement response transformation
  - Implement conditional execution (when configured)
  - _Requirements: 1.2, 1.4, 1.5_

- [ ] 7.1 Write property test for EC3 fetching

  - **Property 2: EPD fetching from EC3 when configured**
  - **Validates: Requirements 1.2**

- [ ] 8. Implement EPD Hub API integration

  - Create EPD Hub API client with authentication
  - Implement EPD fetching from EPD Hub
  - Implement response transformation
  - Implement conditional execution (when configured)
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 8.1 Write property test for EPD Hub fetching

  - **Property 3: EPD fetching from EPD Hub when configured**
  - **Validates: Requirements 1.3**

- [ ] 9. Implement sync orchestration service

  - Create main sync job orchestrator
  - Implement sequential source processing
  - Implement batch processing for large datasets
  - Wire together: fetch → parse → deduplicate → enrich → validate → store
  - Implement sync logging to epd_sync_log table
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.3_

- [ ] 9.1 Write property test for batch processing

  - **Property 46: Batch processing for large datasets**
  - **Validates: Requirements 10.3**

- [ ] 10. Implement rate limiting and quota management

  - Implement rate limit tracking per source
  - Implement exponential backoff on rate limit approach
  - Implement quota exhaustion detection
  - Implement pause and resume logic
  - Implement API usage logging
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 10.1 Write property test for rate limiting

  - **Property 41: Rate limit compliance**
  - **Validates: Requirements 9.1**

- [ ] 10.2 Write property test for backoff logic

  - **Property 42: Exponential backoff on rate limit approach**
  - **Validates: Requirements 9.2**

- [ ] 10.3 Write property test for quota handling

  - **Property 43: Quota exhaustion handling**
  - **Property 44: Resume after quota reset**
  - **Validates: Requirements 9.3, 9.4**

- [ ] 10.4 Write property test for usage tracking

  - **Property 45: API usage tracking**
  - **Validates: Requirements 9.5**

- [ ] 11. Implement PDF upload handler

  - Create file upload endpoint
  - Implement PDF storage to cloud storage
  - Create EPD record with "pending_extraction" status
  - Implement extraction completion handler
  - Implement status marking (verified/supplier_provided)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11.1 Write property test for PDF storage

  - **Property 31: PDF storage on upload**
  - **Validates: Requirements 7.1**

- [ ] 11.2 Write property test for record creation

  - **Property 32: Pending extraction record creation**
  - **Validates: Requirements 7.2**

- [ ] 11.3 Write property test for extraction update

  - **Property 33: Extraction completion update**
  - **Validates: Requirements 7.3**

- [ ] 11.4 Write property test for status marking

  - **Property 34: Source status marking**
  - **Property 35: Source indication in display**
  - **Validates: Requirements 7.4, 7.5**

- [ ] 12. Implement search API endpoint

  - Create GET /api/epd/search endpoint
  - Implement material_type filter
  - Implement max_carbon filter
  - Implement manufacturer filter
  - Implement default behavior (all valid EPDs)
  - Implement pagination
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12.1 Write property test for search filtering

  - **Property 26: API search filtering**
  - **Validates: Requirements 6.1**

- [ ] 12.2 Write property test for material type filter

  - **Property 27: Material type filtering**
  - **Validates: Requirements 6.2**

- [ ] 12.3 Write property test for carbon filter

  - **Property 28: Carbon footprint filtering**
  - **Validates: Requirements 6.3**

- [ ] 12.4 Write property test for manufacturer filter

  - **Property 29: Manufacturer filtering**
  - **Validates: Requirements 6.4**

- [ ] 12.5 Write property test for default search

  - **Property 30: Default search behavior**
  - **Validates: Requirements 6.5**

- [ ] 13. Implement monitoring and alerting

  - Implement sync job completion logging
  - Implement high failure rate detection (>10%)
  - Implement consecutive failure detection (>3)
  - Implement weekly report generation
  - Implement critical error alerting
  - Create alert notification service (email/webhook)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13.1 Write property test for sync logging

  - **Property 36: Sync job completion logging**
  - **Validates: Requirements 8.1**

- [ ] 13.2 Write property test for failure rate alerting

  - **Property 37: High failure rate alerting**
  - **Validates: Requirements 8.2**

- [ ] 13.3 Write property test for consecutive failure alerting

  - **Property 38: Consecutive failure alerting**
  - **Validates: Requirements 8.3**

- [ ] 13.4 Write property test for weekly report

  - **Property 39: Weekly report completeness**
  - **Validates: Requirements 8.4**

- [ ] 13.5 Write property test for critical error alerting

  - **Property 40: Critical error alerting**
  - **Validates: Requirements 8.5**

- [ ] 14. Create Supabase Edge Functions

  - Create epd-sync-daily Edge Function
  - Create epd-search-api Edge Function
  - Create epd-upload-handler Edge Function
  - Implement environment variable configuration
  - Implement error handling and logging
  - _Requirements: 10.1, 10.2_

- [ ] 15. Set up scheduling and automation

  - Create pg_cron job for daily sync (2 AM UTC)
  - Configure cron job to invoke epd-sync-daily function
  - Test cron job execution
  - Set up weekly report generation
  - _Requirements: 10.4_

- [ ] 16. Create deployment scripts and documentation

  - Write database migration scripts
  - Create Edge Function deployment script
  - Document environment variable setup
  - Create deployment verification checklist
  - Document API endpoints and usage
  - _Requirements: All_

- [ ] 16.1 Write integration tests for end-to-end pipeline

  - Test complete sync pipeline (fetch → parse → deduplicate → enrich → validate → store)
  - Test API search with various filters
  - Test PDF upload flow
  - Test error recovery scenarios
  - _Requirements: All_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
