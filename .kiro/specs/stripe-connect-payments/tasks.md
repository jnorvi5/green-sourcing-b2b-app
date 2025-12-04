# Implementation Plan

- [ ] 1. Set up Stripe Connect configuration and database schema

  - Create Stripe Connect account and enable Express accounts
  - Add stripe_connect_account_id column to suppliers table
  - Create transactions table with all required fields
  - Create payouts table for payout tracking
  - Add indexes for performance
  - Set up Stripe API keys in environment variables
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement supplier onboarding service

  - Create Stripe Connect Express account creation function
  - Implement account link generation for onboarding
  - Create onboarding status check function
  - Implement account link refresh for incomplete onboarding
  - Store Connected Account ID in database
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.1 Write property test for account ID storage

  - **Property 1: Connected Account ID storage**
  - **Validates: Requirements 1.2, 1.3**

- [ ] 2.2 Write property test for incomplete onboarding

  - **Property 2: Incomplete onboarding handling**
  - **Validates: Requirements 1.4**

- [ ] 2.3 Write property test for verification failure

  - **Property 3: Verification failure handling**
  - **Validates: Requirements 1.5**

- [ ] 3. Implement fee calculation service

  - Create fee calculation function with tier-based percentages
  - Implement free tier (3.5%) calculation
  - Implement standard tier (2.5%) calculation
  - Implement verified tier (2%) calculation
  - Add Stripe processing fee calculation
  - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.4_

- [ ] 3.1 Write property test for fee calculation

  - **Property 5: Application fee calculation by tier**
  - **Validates: Requirements 2.2, 3.2, 3.3, 3.4**

- [ ] 3.2 Write property test for application fee transfer

  - **Property 9: Application fee transfer**
  - **Validates: Requirements 3.1, 3.5**

- [ ] 4. Implement payment processing service

  - Create Payment Intent creation function
  - Implement destination charge configuration
  - Add application fee to Payment Intent
  - Implement metadata attachment (RFQ, architect, supplier IDs)
  - Return client secret for frontend
  - Support both card and ACH payments
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [ ] 4.1 Write property test for Payment Intent creation

  - **Property 4: Payment Intent creation**
  - **Validates: Requirements 2.1**

- [ ] 4.2 Write property test for destination setting

  - **Property 6: Payment Intent destination**
  - **Validates: Requirements 2.3**

- [ ] 4.3 Write property test for client secret return

  - **Property 7: Client secret return**
  - **Validates: Requirements 2.4**

- [ ] 4.4 Write property test for transaction logging

  - **Property 8: Transaction logging on payment**
  - **Validates: Requirements 2.5**

- [ ] 5. Implement webhook handler

  - Create webhook endpoint with signature verification
  - Implement payment_intent.succeeded handler
  - Implement payment_intent.payment_failed handler
  - Implement charge.dispute.created handler
  - Implement charge.dispute.closed handler
  - Implement payout.paid handler
  - Implement payout.failed handler
  - Implement account.updated handler
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 10.3, 10.4_

- [ ] 5.1 Write property test for webhook signature verification

  - **Property 36: Webhook signature verification**
  - **Validates: Requirements 10.3**

- [ ] 5.2 Write property test for webhook failure handling

  - **Property 37: Webhook failure handling**
  - **Validates: Requirements 10.4**

- [ ] 5.3 Write property test for payout webhook handling

  - **Property 10: Payout webhook handling**
  - **Validates: Requirements 4.2, 4.3**

- [ ] 5.4 Write property test for payout status updates

  - **Property 11: Payout status updates**
  - **Property 12: Payout failure handling**
  - **Validates: Requirements 4.4, 4.5**

- [ ] 6. Implement dispute handling service

  - Create dispute notification function
  - Implement transaction status update to "disputed"
  - Implement supplier email notification for disputes
  - Implement payout reversal for lost disputes
  - Implement application fee refund for lost disputes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6.1 Write property test for dispute handling

  - **Property 18: Dispute webhook handling**
  - **Property 19: Dispute notification**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 6.2 Write property test for dispute resolution

  - **Property 20: Dispute resolution - architect wins**
  - **Validates: Requirements 6.4, 6.5**

- [ ] 7. Implement supplier dashboard API

  - Create transaction list endpoint with pagination
  - Implement date range filtering
  - Add transaction detail display (gross, fee, net)
  - Create payout list endpoint
  - Implement payout detail display
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7.1 Write property test for transaction display

  - **Property 13: Transaction display completeness**
  - **Property 14: Transaction detail completeness**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 7.2 Write property test for payout display

  - **Property 15: Payout detail completeness**
  - **Validates: Requirements 5.3**

- [ ] 7.3 Write property test for date filtering

  - **Property 16: Date range filtering**
  - **Validates: Requirements 5.4**

- [ ] 8. Implement transaction export service

  - Create CSV export function
  - Include all transaction fields in export
  - Implement date range filtering for exports
  - Add download endpoint
  - _Requirements: 5.5_

- [ ] 8.1 Write property test for CSV export

  - **Property 17: CSV export generation**
  - **Validates: Requirements 5.5**

- [ ] 9. Implement monthly payout summary service

  - Create monthly summary generation function
  - Calculate total transactions, fees, and net payouts
  - Implement email template for summaries
  - Create scheduled job for first day of month
  - Add conditional logic to skip zero-transaction suppliers
  - Implement on-demand summary generation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Write property test for summary generation

  - **Property 21: Monthly summary generation**
  - **Property 22: Summary completeness**
  - **Validates: Requirements 7.1, 7.2**

- [ ] 9.2 Write property test for summary email

  - **Property 23: Summary email delivery**
  - **Property 24: No summary for zero transactions**
  - **Validates: Requirements 7.3, 7.4**

- [ ] 9.3 Write property test for on-demand summaries

  - **Property 25: On-demand summary generation**
  - **Validates: Requirements 7.5**

- [ ] 10. Implement tax reporting service

  - Create function to flag suppliers earning >$600/year
  - Implement 1099-K generation trigger for January
  - Create supplier notification for 1099-K availability
  - Implement 1099-K download link generation
  - Create platform fee export for GreenChainz tax filing
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10.1 Write property test for 1099-K flagging

  - **Property 26: 1099-K threshold flagging**
  - **Validates: Requirements 8.1**

- [ ] 10.2 Write property test for 1099-K generation

  - **Property 27: 1099-K generation trigger**
  - **Property 28: 1099-K availability notification**
  - **Validates: Requirements 8.2, 8.3**

- [ ] 10.3 Write property test for 1099-K download

  - **Property 29: 1099-K download link**
  - **Validates: Requirements 8.4**

- [ ] 10.4 Write property test for platform fee export

  - **Property 30: Platform fee export**
  - **Validates: Requirements 8.5**

- [ ] 11. Implement compliance and security measures

  - Verify no card data storage in code
  - Implement KYC verification check before payments
  - Add audit logging for all transactions
  - Implement webhook signature verification
  - Add rate limiting to payment endpoints
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11.1 Write unit tests for compliance

  - Test PCI compliance (no card data storage)
  - Test KYC requirement enforcement
  - _Requirements: 9.1, 9.2_

- [ ] 11.2 Write property test for KYC enforcement

  - **Property 31: KYC verification enforcement**
  - **Validates: Requirements 9.3**

- [ ] 11.3 Write property test for data security

  - **Property 32: No sensitive data storage**
  - **Validates: Requirements 9.4**

- [ ] 11.4 Write property test for audit logging

  - **Property 33: Audit logging completeness**
  - **Validates: Requirements 9.5**

- [ ] 12. Implement error handling and logging

  - Create comprehensive error logging function
  - Implement user-friendly error message mapping
  - Add Stripe API error logging with context
  - Implement critical error alerting
  - Create admin notification service
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 12.1 Write property test for error logging

  - **Property 34: API error logging**
  - **Validates: Requirements 10.1**

- [ ] 12.2 Write property test for error messages

  - **Property 35: User-friendly error messages**
  - **Validates: Requirements 10.2**

- [ ] 12.3 Write property test for critical alerts

  - **Property 38: Critical error alerting**
  - **Validates: Requirements 10.5**

- [ ] 13. Create frontend components

  - Build supplier onboarding page with Stripe redirect
  - Create payment checkout page with Stripe Elements
  - Build supplier dashboard with transaction list
  - Create payout history view
  - Implement transaction export button
  - Add monthly summary download
  - _Requirements: 1.1, 2.1, 5.1, 5.5_

- [ ] 14. Create API routes

  - POST /api/stripe/onboarding/create - Create Connect account
  - GET /api/stripe/onboarding/status - Check onboarding status
  - POST /api/stripe/payment/create - Create Payment Intent
  - POST /api/webhooks/stripe - Handle Stripe webhooks
  - GET /api/stripe/transactions - List transactions
  - GET /api/stripe/payouts - List payouts
  - GET /api/stripe/export - Export transactions
  - GET /api/stripe/summary/:month - Get monthly summary
  - _Requirements: All_

- [ ] 15. Set up Stripe webhook configuration

  - Configure webhook endpoint in Stripe Dashboard
  - Add webhook secret to environment variables
  - Select required webhook events
  - Test webhook delivery
  - _Requirements: 4.2, 6.1, 10.3_

- [ ] 16. Create scheduled jobs

  - Set up monthly summary generation (1st of month)
  - Set up 1099-K generation trigger (January)
  - Configure job scheduling (cron or Supabase pg_cron)
  - _Requirements: 7.1, 8.2_

- [ ] 17. Create deployment documentation

  - Document Stripe account setup steps
  - Document webhook configuration
  - Document environment variable setup
  - Create testing guide with Stripe test mode
  - Document go-live checklist
  - _Requirements: All_

- [ ] 17.1 Write integration tests for payment flow

  - Test complete onboarding flow
  - Test end-to-end payment processing
  - Test dispute handling
  - Test payout tracking
  - Test monthly summary generation
  - _Requirements: All_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
