# Implementation Plan

- [ ] 1. Set up database schema and migrations

  - Create RFQ_Email_Tracking table with all required fields
  - Create RFQ_Error_Logs table for error tracking
  - Add indexes for performance optimization
  - Create database trigger for RFQ insertion
  - _Requirements: 1.2, 3.6, 4.1, 8.1_

- [ ] 1.1 Write property test for database schema

  - **Property 1: RFQ storage with unique identifier**
  - **Validates: Requirements 1.2**

- [ ] 2. Implement validation module

  - Create RFQ data validation function
  - Validate required fields (material type, location, budget, timeline, certifications)
  - Implement data type checking and sanitization
  - Return structured validation results
  - _Requirements: 1.3, 1.4_

- [ ] 2.1 Write property test for validation

  - **Property 2: Required field validation**
  - **Validates: Requirements 1.3**

- [ ] 2.2 Write property test for validation error handling

  - **Property 3: Validation failure handling**
  - **Validates: Requirements 1.4**

- [ ] 2.3 Write property test for workflow progression

  - **Property 4: Workflow progression on valid input**
  - **Validates: Requirements 1.5**

- [ ] 3. Implement supplier matching engine

  - Create matching criteria interface and types
  - Implement material type filtering query
  - Implement geographic distance calculation (Haversine formula)
  - Implement certification matching logic
  - Implement tier-based ranking algorithm
  - Implement match score calculation
  - Return top 3 suppliers by score
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ]* 3.1 Write property test for material type matching

  - **Property 5: Material type exact matching**
  - **Validates: Requirements 2.1**

- [ ]* 3.2 Write property test for geographic filtering

  - **Property 6: Geographic radius filtering**
  - **Validates: Requirements 2.2**

- [ ]* 3.3 Write property test for certification prioritization

  - **Property 7: Certification prioritization**
  - **Validates: Requirements 2.3**

- [ ]* 3.4 Write property test for tier ranking

  - **Property 8: Tier-based ranking**
  - **Validates: Requirements 2.4**

- [ ]* 3.5 Write property test for top 3 selection

  - **Property 9: Top 3 supplier selection**
  - **Validates: Requirements 2.5**

- [ ]* 3.6 Write unit tests for edge cases

  - Test with 0, 1, 2 matching suppliers
  - Test manual review trigger with zero matches
  - _Requirements: 2.6, 2.7_

- [ ] 4. Implement email service with Zoho Mail integration

  - Create Zoho Mail API client with authentication
  - Implement supplier notification email template
  - Implement subject line formatting
  - Implement email body with all required fields
  - Implement response link generation
  - Implement concurrent email sending
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 Write property test for email sending

  - **Property 10: Email sent to all matched suppliers**
  - **Validates: Requirements 3.1**

- [ ]* 4.2 Write property test for subject line format

  - **Property 11: Subject line format**
  - **Validates: Requirements 3.2**

- [ ]* 4.3 Write property test for email body completeness

  - **Property 12: Email body completeness**
  - **Validates: Requirements 3.3**

- [ ]* 4.4 Write property test for response link format

  - **Property 13: Response link format**
  - **Validates: Requirements 3.4**

- [ ] 5. Implement email retry logic and error handling

  - Implement exponential backoff retry function
  - Implement retry logic for failed email sends (3 attempts)
  - Implement error logging for failed emails
  - Implement continuation logic for remaining suppliers
  - _Requirements: 3.7, 3.8_

- [ ]* 5.1 Write property test for retry logic

  - **Property 15: Retry on failure**
  - **Validates: Requirements 3.7**

- [ ]* 5.2 Write property test for error logging and continuation

  - **Property 16: Error logging and continuation**
  - **Validates: Requirements 3.8**

- [ ] 6. Implement email tracking service

  - Create tracking record on email send
  - Implement status update functions (opened, clicked, bounced)
  - Implement status history preservation
  - Create tracking pixel endpoint for open tracking
  - Create redirect endpoint for click tracking
  - _Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 6.1 Write property test for tracking record creation

  - **Property 14: Email delivery tracking**
  - **Property 17: Tracking record creation**
  - **Validates: Requirements 3.6, 4.1**

- [ ]* 6.2 Write property test for status updates

  - **Property 18: Open status update**
  - **Property 19: Click status update**
  - **Property 20: Bounce status update**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ]* 6.3 Write property test for status history

  - **Property 21: Status history preservation**
  - **Validates: Requirements 4.5**

- [ ] 7. Implement MailerLite integration for architect confirmations

  - Create MailerLite API client with authentication
  - Implement architect confirmation email template
  - Implement confirmation content with supplier count and timeline
  - Implement tracking link generation
  - Implement retry logic (2 attempts)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.1 Write unit test for MailerLite API usage

  - Verify MailerLite API is used for architect confirmations
  - _Requirements: 6.2_

- [ ]* 7.2 Write property test for confirmation email

  - **Property 27: Architect confirmation email**
  - **Property 28: Confirmation content completeness**
  - **Property 29: Tracking link in confirmation**
  - **Validates: Requirements 6.1, 6.3, 6.4**

- [ ]* 7.3 Write property test for confirmation retry

  - **Property 30: Confirmation retry logic**
  - **Validates: Requirements 6.5**

- [ ] 8. Implement manual review alert system

  - Implement zero-match detection logic
  - Create manual review alert email template
  - Implement alert content with RFQ details and reason
  - Implement admin dashboard link generation
  - Implement RFQ status update to "pending_manual_review"
  - Implement persistent retry logic for alert delivery
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write property test for manual review alert

  - **Property 31: Manual review alert content**
  - **Property 32: Admin dashboard link in alert**
  - **Property 33: RFQ status update on manual review**
  - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ]* 8.2 Write property test for alert retry

  - **Property 34: Manual review alert retry**
  - **Validates: Requirements 7.5**

- [ ] 9. Implement comprehensive error handling and logging

  - Create error logging function with all required fields
  - Implement API error parsing (Zoho Mail error codes)
  - Implement database error logging
  - Implement retry exhaustion logging
  - Implement critical error alerting
  - Implement credential redaction in logs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.6_

- [ ]* 9.1 Write property test for error logging

  - **Property 35: Comprehensive error logging**
  - **Validates: Requirements 8.1**

- [ ]* 9.2 Write property test for API error parsing

  - **Property 36: API error code extraction**
  - **Validates: Requirements 8.2**

- [ ]* 9.3 Write property test for database error logging

  - **Property 37: Database error logging**
  - **Validates: Requirements 8.3**

- [ ]* 9.4 Write property test for retry exhaustion

  - **Property 38: Retry exhaustion logging**
  - **Validates: Requirements 8.4**

- [ ]* 9.5 Write property test for critical error alerting

  - **Property 39: Critical error alerting**
  - **Validates: Requirements 8.5**

- [ ]* 9.6 Write property test for credential redaction

  - **Property 41: Credential redaction in logs**
  - **Validates: Requirements 9.6**

- [ ] 10. Implement environment variable configuration

  - Load all API credentials from environment variables
  - Implement configuration validation on startup
  - Implement graceful failure for missing credentials
  - Create configuration error logging
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 10.1 Write unit tests for configuration

  - Test credential loading from environment variables
  - Test Zoho Mail API key usage
  - Test MailerLite API key usage
  - Test Supabase service role key usage
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 10.2 Write property test for missing credentials

  - **Property 40: Graceful failure on missing credentials**
  - **Validates: Requirements 9.5**

- [ ] 11. Create main Edge Function orchestrator

  - Implement main workflow orchestration
  - Wire validation → matching → notification → tracking
  - Implement timeout handling
  - Implement concurrent RFQ isolation
  - Create function entry point with HTTP handler
  - _Requirements: 1.1, 10.1, 10.2, 10.3, 10.5_

- [ ]* 11.1 Write property test for concurrent isolation

  - **Property 42: Concurrent RFQ isolation**
  - **Validates: Requirements 10.3**

- [ ]* 11.2 Write property test for timeout handling

  - **Property 43: Timeout handling**
  - **Validates: Requirements 10.5**

- [ ] 12. Implement follow-up reminder system

  - Create follow-up check query (48+ hours, no response)
  - Implement reminder email template
  - Implement reminder subject line formatting
  - Implement original RFQ reference in reminder body
  - Implement reminder tracking logging
  - Implement no-reminder logic for responded suppliers
  - Create Edge Function for follow-up scheduler
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 12.1 Write property test for reminder sending

  - **Property 22: Reminder for non-responsive suppliers**
  - **Validates: Requirements 5.2**

- [ ]* 12.2 Write property test for reminder format

  - **Property 23: Reminder subject line format**
  - **Property 24: Original RFQ reference in reminder**
  - **Validates: Requirements 5.3, 5.4**

- [ ]* 12.3 Write property test for reminder tracking

  - **Property 25: Reminder tracking**
  - **Validates: Requirements 5.5**

- [ ]* 12.4 Write property test for no reminder on response

  - **Property 26: No reminder for responded suppliers**
  - **Validates: Requirements 5.6**

- [ ] 13. Set up database trigger and cron job

  - Create database trigger for RFQ insertion
  - Set up pg_cron job for follow-up reminders (hourly)
  - Configure trigger to invoke Edge Function
  - Test trigger and cron job execution
  - _Requirements: 1.1, 5.1_

- [ ] 14. Create deployment scripts and documentation

  - Write database migration scripts
  - Create Edge Function deployment script
  - Document environment variable setup
  - Create deployment verification checklist
  - Document rollback procedures
  - _Requirements: All_

- [ ]* 14.1 Write integration tests for end-to-end workflow

  - Test complete RFQ processing flow
  - Test follow-up reminder workflow
  - Test manual review workflow
  - Test error recovery scenarios
  - _Requirements: All_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

