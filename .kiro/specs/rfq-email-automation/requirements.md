# Requirements Document

## Introduction

This document specifies the requirements for an automated email workflow system that connects architects submitting RFQs (Requests for Quote) with matched suppliers through the GreenChainz platform. The system will automatically identify suitable suppliers based on multiple criteria, send personalized email notifications, track engagement, and manage follow-ups.

## Glossary

- **RFQ System**: The automated workflow system that processes Request for Quote submissions and manages supplier notifications
- **Architect**: A user who submits an RFQ through the GreenChainz platform
- **Supplier**: A verified materials provider who can respond to RFQs
- **Matching Engine**: The component that identifies suitable suppliers based on RFQ criteria
- **Email Service**: The Zoho Mail API integration for sending transactional emails
- **Edge Function**: A Supabase serverless function that executes the workflow
- **Delivery Status**: The tracking state of an email (sent, opened, clicked, bounced)
- **Supplier Tier**: The verification level of a supplier (verified, standard)

## Requirements

### Requirement 1

**User Story:** As an architect, I want my RFQ to be automatically sent to relevant suppliers, so that I can quickly receive quotes without manual outreach.

#### Acceptance Criteria

1. WHEN an architect submits an RFQ THEN the RFQ System SHALL trigger the automated workflow within 60 seconds
2. WHEN the workflow executes THEN the RFQ System SHALL store the RFQ data in the Supabase database with a unique identifier
3. WHEN the RFQ is stored THEN the RFQ System SHALL validate that all required fields are present (material type, location, budget range, timeline, certifications)
4. WHEN validation fails THEN the RFQ System SHALL log the error and notify the system administrator
5. WHEN validation succeeds THEN the RFQ System SHALL proceed to supplier matching

### Requirement 2

**User Story:** As a system, I want to match RFQs with the most suitable suppliers, so that architects receive relevant responses and suppliers receive qualified leads.

#### Acceptance Criteria

1. WHEN the Matching Engine processes an RFQ THEN the Matching Engine SHALL query suppliers matching the material type exactly
2. WHEN filtering by geography THEN the Matching Engine SHALL calculate distance between the project location and supplier location and include only suppliers within the specified radius
3. WHEN evaluating certifications THEN the Matching Engine SHALL prioritize suppliers holding all required certifications (FSC, LEED, C2C)
4. WHEN ranking suppliers THEN the Matching Engine SHALL rank verified tier suppliers higher than standard tier suppliers
5. WHEN multiple suppliers match THEN the Matching Engine SHALL select the top 3 suppliers based on the combined ranking criteria
6. WHEN fewer than 3 suppliers match THEN the Matching Engine SHALL return all matching suppliers
7. WHEN zero suppliers match THEN the Matching Engine SHALL trigger the manual review process

### Requirement 3

**User Story:** As a supplier, I want to receive detailed RFQ notifications via email, so that I can evaluate opportunities and respond quickly.

#### Acceptance Criteria

1. WHEN the Matching Engine identifies suppliers THEN the Email Service SHALL send an email to each matched supplier using the Zoho Mail API
2. WHEN composing the email THEN the Email Service SHALL include the subject line "New RFQ from [Architect Company Name] - [Material Type]"
3. WHEN composing the email body THEN the Email Service SHALL include architect company name, project location, material specifications, budget range, delivery timeline, and required certifications
4. WHEN composing the email body THEN the Email Service SHALL include a unique response link in the format "https://greenchainz.com/supplier/rfq/[rfq_id]"
5. WHEN sending emails THEN the Email Service SHALL send to all matched suppliers concurrently
6. WHEN an email send succeeds THEN the Email Service SHALL record the delivery status as "sent" in the Supabase database with timestamp
7. WHEN an email send fails THEN the Email Service SHALL retry up to 3 times with exponential backoff (2s, 4s, 8s)
8. WHEN all retries fail THEN the Email Service SHALL log the failure to the error_logs table and continue processing remaining suppliers

### Requirement 4

**User Story:** As a platform administrator, I want to track email engagement metrics, so that I can measure supplier responsiveness and optimize the matching algorithm.

#### Acceptance Criteria

1. WHEN an email is sent THEN the RFQ System SHALL create a tracking record with status "sent" and timestamp
2. WHEN a supplier opens an email THEN the RFQ System SHALL update the tracking record status to "opened" with timestamp
3. WHEN a supplier clicks the response link THEN the RFQ System SHALL update the tracking record status to "clicked" with timestamp
4. WHEN an email bounces THEN the RFQ System SHALL update the tracking record status to "bounced" with timestamp
5. WHEN tracking status changes THEN the RFQ System SHALL preserve the history of all previous statuses

### Requirement 5

**User Story:** As a supplier engagement manager, I want non-responsive suppliers to receive reminder emails, so that we maximize response rates and architect satisfaction.

#### Acceptance Criteria

1. WHEN 48 hours elapse after initial email send THEN the RFQ System SHALL check if the supplier has responded
2. WHEN the supplier has not responded THEN the RFQ System SHALL send a reminder email via the Email Service
3. WHEN composing the reminder THEN the Email Service SHALL include the subject line "Reminder: RFQ from [Architect Company Name] - [Material Type]"
4. WHEN composing the reminder body THEN the Email Service SHALL reference the original RFQ and emphasize urgency
5. WHEN the reminder is sent THEN the RFQ System SHALL log the reminder delivery in the tracking record
6. WHEN a supplier has already responded THEN the RFQ System SHALL not send a reminder email

### Requirement 6

**User Story:** As an architect, I want confirmation that my RFQ was sent to suppliers, so that I have confidence the process is working and know what to expect.

#### Acceptance Criteria

1. WHEN all supplier emails are sent THEN the RFQ System SHALL send a confirmation email to the architect
2. WHEN composing the confirmation THEN the Email Service SHALL use MailerLite API (separate from supplier emails)
3. WHEN composing the confirmation body THEN the Email Service SHALL include the number of suppliers contacted and expected response timeline
4. WHEN composing the confirmation body THEN the Email Service SHALL include a link to track RFQ status
5. WHEN the confirmation send fails THEN the RFQ System SHALL retry up to 2 times and log any final failure

### Requirement 7

**User Story:** As a platform administrator, I want manual review triggered for edge cases, so that no architect request goes unaddressed even when automated matching fails.

#### Acceptance Criteria

1. WHEN zero suppliers match the RFQ criteria THEN the RFQ System SHALL send an alert email to founder@greenchainz.com
2. WHEN composing the alert THEN the Email Service SHALL include the complete RFQ details and reason for manual review
3. WHEN composing the alert THEN the Email Service SHALL include a link to the admin dashboard for manual supplier assignment
4. WHEN the alert is sent THEN the RFQ System SHALL mark the RFQ status as "pending_manual_review"
5. WHEN the alert send fails THEN the RFQ System SHALL log to error_logs table and retry every 5 minutes until successful

### Requirement 8

**User Story:** As a system administrator, I want comprehensive error logging and handling, so that I can diagnose issues and ensure system reliability.

#### Acceptance Criteria

1. WHEN any component encounters an error THEN the RFQ System SHALL log the error to the error_logs table with timestamp, error type, error message, and context
2. WHEN the Zoho Mail API returns an error THEN the Email Service SHALL parse the error response and log the specific error code
3. WHEN database queries fail THEN the RFQ System SHALL log the query and error details
4. WHEN retries are exhausted THEN the RFQ System SHALL log the final failure state
5. WHEN critical errors occur THEN the RFQ System SHALL send an alert to the system administrator

### Requirement 9

**User Story:** As a developer, I want secure credential management, so that API keys and sensitive data are protected.

#### Acceptance Criteria

1. WHEN the Edge Function initializes THEN the RFQ System SHALL load all API credentials from environment variables
2. WHEN accessing Zoho Mail API THEN the Email Service SHALL use the ZOHO_MAIL_API_KEY environment variable
3. WHEN accessing MailerLite API THEN the Email Service SHALL use the MAILERLITE_API_KEY environment variable
4. WHEN accessing Supabase THEN the RFQ System SHALL use the SUPABASE_SERVICE_ROLE_KEY environment variable
5. WHEN credentials are missing THEN the RFQ System SHALL fail gracefully and log the configuration error
6. WHEN logging errors THEN the RFQ System SHALL never include credentials or sensitive data in log messages

### Requirement 10

**User Story:** As a platform operator, I want the system to be serverless and scalable, so that it handles varying load without manual intervention.

#### Acceptance Criteria

1. WHEN implementing the workflow THEN the RFQ System SHALL use Supabase Edge Functions for serverless execution
2. WHEN the Edge Function is invoked THEN the RFQ System SHALL complete execution within 10 seconds or timeout gracefully
3. WHEN multiple RFQs are submitted concurrently THEN the RFQ System SHALL process each independently without interference
4. WHEN the system experiences high load THEN the Edge Function SHALL scale automatically to handle the volume
5. WHEN the Edge Function times out THEN the RFQ System SHALL log the timeout and allow retry mechanisms to handle completion
