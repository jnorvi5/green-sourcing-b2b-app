# Requirements Document

## Introduction

This document specifies the requirements for a Stripe Connect payment processing system that enables GreenChainz to facilitate transactions between architects and suppliers while collecting platform fees. The system handles supplier onboarding, payment processing, dispute management, and compliance with financial regulations.

## Glossary

- **Payment System**: The Stripe Connect integration that processes transactions between architects and suppliers
- **Platform Account**: GreenChainz's main Stripe account that receives application fees
- **Connected Account**: A supplier's Stripe Express account linked to the platform
- **Application Fee**: The percentage fee GreenChainz charges on each transaction (2-3.5% based on tier)
- **Payment Intent**: A Stripe object representing a payment from architect to supplier
- **Destination Charge**: A payment where funds go directly to the connected account with a fee to the platform
- **Payout**: Transfer of funds from Stripe to a supplier's bank account
- **Chargeback**: A dispute where an architect requests a refund from their bank
- **KYC (Know Your Customer)**: Identity verification process required by financial regulations
- **1099-K**: IRS tax form for payment card and third-party network transactions
- **PCI-DSS**: Payment Card Industry Data Security Standard

## Requirements

### Requirement 1

**User Story:** As a supplier, I want to connect my bank account to receive payments, so that I can get paid when architects accept my quotes.

#### Acceptance Criteria

1. WHEN a supplier clicks "Enable Payments" THEN the Payment System SHALL redirect them to Stripe Connect Express onboarding
2. WHEN the supplier completes onboarding THEN the Payment System SHALL receive a Connected Account ID from Stripe
3. WHEN the Connected Account ID is received THEN the Payment System SHALL store it in the suppliers.stripe_connect_account_id field
4. WHEN onboarding is incomplete THEN the Payment System SHALL display the onboarding status and allow the supplier to resume
5. WHEN onboarding fails verification THEN the Payment System SHALL display the reason and allow the supplier to retry

### Requirement 2

**User Story:** As an architect, I want to pay for accepted quotes securely, so that I can complete transactions with confidence.

#### Acceptance Criteria

1. WHEN an architect accepts a quote THEN the Payment System SHALL create a Stripe Payment Intent with the quote amount
2. WHEN creating the Payment Intent THEN the Payment System SHALL calculate the application fee based on the supplier's tier (2%, 2.5%, or 3.5%)
3. WHEN creating the Payment Intent THEN the Payment System SHALL set the destination to the supplier's Connected Account
4. WHEN the Payment Intent is created THEN the Payment System SHALL return a client secret for the frontend to complete payment
5. WHEN payment is completed THEN the Payment System SHALL update the RFQ status to "closed" and log the transaction

### Requirement 3

**User Story:** As the platform, I want to collect application fees on transactions, so that GreenChainz generates revenue from successful deals.

#### Acceptance Criteria

1. WHEN a payment is processed THEN the Payment System SHALL calculate the application fee as a percentage of the transaction amount
2. WHEN the supplier tier is "free" THEN the Payment System SHALL charge a 3.5% application fee
3. WHEN the supplier tier is "standard" THEN the Payment System SHALL charge a 2.5% application fee
4. WHEN the supplier tier is "verified" THEN the Payment System SHALL charge a 2% application fee
5. WHEN the payment succeeds THEN the Payment System SHALL transfer the application fee to the Platform Account immediately

### Requirement 4

**User Story:** As a supplier, I want to receive payouts to my bank account, so that I can access my earnings from closed deals.

#### Acceptance Criteria

1. WHEN a payment is successful THEN the Payment System SHALL hold funds for 2 days per Stripe's default schedule
2. WHEN the hold period expires THEN the Payment System SHALL initiate a payout to the supplier's bank account
3. WHEN a payout is initiated THEN the Payment System SHALL log the payout in the database with status "pending"
4. WHEN a payout completes THEN the Payment System SHALL update the payout status to "paid"
5. WHEN a payout fails THEN the Payment System SHALL update the status to "failed" and notify the supplier

### Requirement 5

**User Story:** As a supplier, I want to view my transaction history and payouts, so that I can track my earnings and reconcile payments.

#### Acceptance Criteria

1. WHEN a supplier views their dashboard THEN the Payment System SHALL display all transactions with amounts, dates, and statuses
2. WHEN displaying transactions THEN the Payment System SHALL show the gross amount, application fee, and net amount
3. WHEN displaying payouts THEN the Payment System SHALL show payout dates, amounts, and bank account (last 4 digits)
4. WHEN a supplier requests a date range THEN the Payment System SHALL filter transactions by the specified period
5. WHEN a supplier exports data THEN the Payment System SHALL generate a CSV file with transaction details

### Requirement 6

**User Story:** As an architect, I want to dispute a charge if there's an issue, so that I can get a refund for problematic transactions.

#### Acceptance Criteria

1. WHEN an architect initiates a dispute through their bank THEN the Payment System SHALL receive a webhook notification from Stripe
2. WHEN a dispute is received THEN the Payment System SHALL update the transaction status to "disputed"
3. WHEN a dispute is received THEN the Payment System SHALL notify the supplier via email
4. WHEN a dispute is resolved in favor of the architect THEN the Payment System SHALL reverse the supplier's payout
5. WHEN a dispute is resolved in favor of the architect THEN the Payment System SHALL refund the application fee to the Platform Account

### Requirement 7

**User Story:** As a supplier, I want to receive monthly payout summaries, so that I can track my earnings and prepare for tax filing.

#### Acceptance Criteria

1. WHEN the first day of the month arrives THEN the Payment System SHALL generate a payout summary for each supplier
2. WHEN generating the summary THEN the Payment System SHALL include total transactions, total fees, and net payouts for the previous month
3. WHEN the summary is generated THEN the Payment System SHALL send it via email to the supplier
4. WHEN a supplier has no transactions THEN the Payment System SHALL not send a summary email
5. WHEN a supplier requests a summary THEN the Payment System SHALL generate it on-demand for any specified month

### Requirement 8

**User Story:** As a supplier, I want automatic tax reporting, so that I can comply with IRS requirements without manual work.

#### Acceptance Criteria

1. WHEN a supplier earns more than $600 in a calendar year THEN the Payment System SHALL flag them for 1099-K generation
2. WHEN January arrives THEN the Payment System SHALL trigger Stripe to generate 1099-K forms for eligible suppliers
3. WHEN a 1099-K is generated THEN the Payment System SHALL notify the supplier that their form is available in Stripe
4. WHEN a supplier requests their 1099-K THEN the Payment System SHALL provide a link to download it from Stripe
5. WHEN exporting platform data THEN the Payment System SHALL generate a report of all application fees for GreenChainz tax filing

### Requirement 9

**User Story:** As the platform, I want to ensure compliance with financial regulations, so that GreenChainz operates legally and avoids penalties.

#### Acceptance Criteria

1. WHEN processing payments THEN the Payment System SHALL use Stripe's PCI-DSS compliant infrastructure
2. WHEN onboarding suppliers THEN the Payment System SHALL require Stripe's KYC verification process
3. WHEN a supplier fails KYC verification THEN the Payment System SHALL prevent them from receiving payments
4. WHEN storing payment data THEN the Payment System SHALL never store raw credit card numbers or CVV codes
5. WHEN logging transactions THEN the Payment System SHALL record all required data for audit and compliance purposes

### Requirement 10

**User Story:** As a developer, I want comprehensive error handling and logging, so that payment issues can be quickly diagnosed and resolved.

#### Acceptance Criteria

1. WHEN any Stripe API call fails THEN the Payment System SHALL log the error with full context
2. WHEN a payment fails THEN the Payment System SHALL return a user-friendly error message to the frontend
3. WHEN a webhook is received THEN the Payment System SHALL verify the signature before processing
4. WHEN webhook processing fails THEN the Payment System SHALL log the failure and allow Stripe to retry
5. WHEN critical payment errors occur THEN the Payment System SHALL send alerts to the platform administrators
