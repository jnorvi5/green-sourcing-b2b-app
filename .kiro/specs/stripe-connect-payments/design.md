# Design Document

## Overview

The Stripe Connect Payment System enables GreenChainz to facilitate secure transactions between architects and suppliers while collecting platform fees. The system uses Stripe Connect with Express accounts for suppliers, implements destination charges for payment processing, handles disputes and refunds, and ensures compliance with financial regulations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GreenChainz Platform                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Supplier    │  │  Architect   │  │   Admin      │          │
│  │  Dashboard   │  │  Checkout    │  │  Dashboard   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
│                            ▼                                      │
│                  ┌──────────────────┐                           │
│                  │   API Routes     │                           │
│                  │  (Next.js API)   │                           │
│                  └────────┬─────────┘                           │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                  │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Onboarding │  │   Payment   │  │   Webhook   │           │
│  │   Service   │  │   Service   │  │   Handler   │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Stripe API                                  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Connect    │  │   Payment    │  │   Webhooks   │          │
│  │   Express    │  │   Intents    │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Supplier Bank   │  │ Architect Card  │  │  Platform       │
│    Account      │  │  /Bank Account  │  │  Account        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Technology Stack

- **Payment Processing**: Stripe Connect (Express accounts)
- **Backend**: Next.js API Routes + Supabase Edge Functions
- **Frontend**: Next.js + React + Stripe Elements
- **Database**: Supabase PostgreSQL
- **Webhooks**: Stripe webhook endpoints
- **Security**: Stripe signature verification, HTTPS only

## Components and Interfaces

### 1. Onboarding Service

**Purpose**: Manages supplier onboarding to Stripe Connect

**Interface**:

```typescript
interface OnboardingService {
  createConnectAccount(supplierId: string): Promise<ConnectAccountResult>;
  getAccountLink(accountId: string): Promise<AccountLinkResult>;
  checkOnboardingStatus(accountId: string): Promise<OnboardingStatus>;
  refreshAccountLink(accountId: string): Promise<AccountLinkResult>;
}

interface ConnectAccountResult {
  accountId: string;
  onboardingUrl: string;
}

interface AccountLinkResult {
  url: string;
  expiresAt: number;
}

interface OnboardingStatus {
  isComplete: boolean;
  requiresAction: boolean;
  missingRequirements: string[];
  accountStatus: "pending" | "enabled" | "restricted" | "disabled";
}
```

**Implementation**:

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function createConnectAccount(
  supplierId: string,
  email: string,
  businessName: string
): Promise<ConnectAccountResult> {
  // Create Stripe Connect Express account
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: email,
    business_type: "company",
    company: {
      name: businessName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      supplier_id: supplierId,
      platform: "greenchainz",
    },
  });

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_URL}/supplier/onboarding/refresh`,
    return_url: `${process.env.NEXT_PUBLIC_URL}/supplier/onboarding/complete`,
    type: "account_onboarding",
  });

  // Store account ID in database
  await supabase
    .from("suppliers")
    .update({ stripe_connect_account_id: account.id })
    .eq("id", supplierId);

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}
```

### 2. Payment Service

**Purpose**: Processes payments from architects to suppliers

**Interface**:

```typescript
interface PaymentService {
  createPaymentIntent(
    params: PaymentIntentParams
  ): Promise<PaymentIntentResult>;
  confirmPayment(paymentIntentId: string): Promise<PaymentConfirmation>;
  refundPayment(paymentIntentId: string, reason: string): Promise<RefundResult>;
  calculateFees(amount: number, tier: SupplierTier): FeeCalculation;
}

interface PaymentIntentParams {
  rfqResponseId: string;
  architectId: string;
  supplierId: string;
  amount: number; // in cents
  currency: string;
  description: string;
}

interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  applicationFee: number;
  supplierAmount: number;
}

interface FeeCalculation {
  grossAmount: number;
  applicationFeePercent: number;
  applicationFee: number;
  supplierAmount: number;
  stripeFee: number; // Stripe's processing fee
}

type SupplierTier = "free" | "standard" | "verified";
```

**Implementation**:

```typescript
export function calculateFees(
  amount: number,
  tier: SupplierTier
): FeeCalculation {
  // Application fee percentages by tier
  const feePercentages = {
    free: 0.035, // 3.5%
    standard: 0.025, // 2.5%
    verified: 0.02, // 2.0%
  };

  const applicationFeePercent = feePercentages[tier];
  const applicationFee = Math.round(amount * applicationFeePercent);
  const supplierAmount = amount - applicationFee;

  // Stripe's processing fee (2.9% + $0.30 for cards)
  const stripeFee = Math.round(amount * 0.029 + 30);

  return {
    grossAmount: amount,
    applicationFeePercent,
    applicationFee,
    supplierAmount,
    stripeFee,
  };
}

export async function createPaymentIntent(
  params: PaymentIntentParams
): Promise<PaymentIntentResult> {
  // Get supplier details
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("stripe_connect_account_id, tier")
    .eq("id", params.supplierId)
    .single();

  if (!supplier?.stripe_connect_account_id) {
    throw new Error("Supplier has not completed payment onboarding");
  }

  // Calculate fees
  const fees = calculateFees(params.amount, supplier.tier);

  // Create Payment Intent with destination charge
  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency,
    application_fee_amount: fees.applicationFee,
    transfer_data: {
      destination: supplier.stripe_connect_account_id,
    },
    metadata: {
      rfq_response_id: params.rfqResponseId,
      architect_id: params.architectId,
      supplier_id: params.supplierId,
    },
    description: params.description,
    payment_method_types: ["card", "us_bank_account"],
  });

  // Log transaction in database
  await supabase.from("transactions").insert({
    payment_intent_id: paymentIntent.id,
    rfq_response_id: params.rfqResponseId,
    architect_id: params.architectId,
    supplier_id: params.supplierId,
    amount: params.amount,
    application_fee: fees.applicationFee,
    supplier_amount: fees.supplierAmount,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    amount: params.amount,
    applicationFee: fees.applicationFee,
    supplierAmount: fees.supplierAmount,
  };
}
```

### 3. Webhook Handler

**Purpose**: Processes Stripe webhook events for payment lifecycle

**Interface**:

```typescript
interface WebhookHandler {
  handleWebhook(event: Stripe.Event): Promise<void>;
  verifySignature(payload: string, signature: string): Stripe.Event;
}

type WebhookEvent =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "charge.dispute.created"
  | "charge.dispute.closed"
  | "payout.paid"
  | "payout.failed"
  | "account.updated";
```

**Implementation**:

```typescript
export async function handleWebhook(
  payload: string,
  signature: string
): Promise<void> {
  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // Route to appropriate handler
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;

    case "charge.dispute.created":
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
      break;

    case "charge.dispute.closed":
      await handleDisputeClosed(event.data.object as Stripe.Dispute);
      break;

    case "payout.paid":
      await handlePayoutPaid(event.data.object as Stripe.Payout);
      break;

    case "payout.failed":
      await handlePayoutFailed(event.data.object as Stripe.Payout);
      break;

    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { rfq_response_id, architect_id, supplier_id } = paymentIntent.metadata;

  // Update transaction status
  await supabase
    .from("transactions")
    .update({
      status: "succeeded",
      paid_at: new Date().toISOString(),
    })
    .eq("payment_intent_id", paymentIntent.id);

  // Update RFQ response status
  await supabase
    .from("rfq_responses")
    .update({ status: "accepted" })
    .eq("id", rfq_response_id);

  // Update RFQ status
  await supabase
    .from("rfqs")
    .update({ status: "closed" })
    .eq("id", rfq_response_id);

  // Send confirmation emails
  await sendPaymentConfirmationEmail(architect_id, supplier_id, paymentIntent);
}
```

### 4. Payout Service

**Purpose**: Manages supplier payouts and reporting

**Interface**:

```typescript
interface PayoutService {
  getPayoutSchedule(accountId: string): Promise<PayoutSchedule>;
  listPayouts(
    supplierId: string,
    params: PayoutListParams
  ): Promise<PayoutList>;
  generateMonthlySummary(
    supplierId: string,
    month: string
  ): Promise<PayoutSummary>;
  exportTransactions(supplierId: string, params: ExportParams): Promise<string>;
}

interface PayoutSchedule {
  interval: "daily" | "weekly" | "monthly" | "manual";
  delayDays: number;
  nextPayoutDate: string;
}

interface PayoutSummary {
  month: string;
  totalTransactions: number;
  grossAmount: number;
  applicationFees: number;
  netAmount: number;
  payouts: PayoutDetail[];
}
```

**Implementation**:

```typescript
export async function generateMonthlySummary(
  supplierId: string,
  month: string // Format: 'YYYY-MM'
): Promise<PayoutSummary> {
  const startDate = `${month}-01`;
  const endDate = new Date(month + "-01");
  endDate.setMonth(endDate.getMonth() + 1);

  // Get all transactions for the month
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("supplier_id", supplierId)
    .gte("created_at", startDate)
    .lt("created_at", endDate.toISOString())
    .eq("status", "succeeded");

  // Calculate totals
  const grossAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const applicationFees = transactions.reduce(
    (sum, t) => sum + t.application_fee,
    0
  );
  const netAmount = grossAmount - applicationFees;

  // Get payouts for the month
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("stripe_connect_account_id")
    .eq("id", supplierId)
    .single();

  const payouts = await stripe.payouts.list(
    {
      created: {
        gte: Math.floor(new Date(startDate).getTime() / 1000),
        lt: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    },
    {
      stripeAccount: supplier.stripe_connect_account_id,
    }
  );

  return {
    month,
    totalTransactions: transactions.length,
    grossAmount,
    applicationFees,
    netAmount,
    payouts: payouts.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
      status: p.status,
    })),
  };
}
```

### 5. Dispute Handler

**Purpose**: Manages chargebacks and disputes

**Interface**:

```typescript
interface DisputeHandler {
  handleDisputeCreated(dispute: Stripe.Dispute): Promise<void>;
  handleDisputeClosed(dispute: Stripe.Dispute): Promise<void>;
  notifySupplier(supplierId: string, dispute: Stripe.Dispute): Promise<void>;
  refundApplicationFee(paymentIntentId: string): Promise<void>;
}
```

**Implementation**:

```typescript
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const paymentIntentId = dispute.payment_intent as string;

  // Update transaction status
  await supabase
    .from("transactions")
    .update({
      status: "disputed",
      dispute_id: dispute.id,
      dispute_reason: dispute.reason,
      disputed_at: new Date().toISOString(),
    })
    .eq("payment_intent_id", paymentIntentId);

  // Get supplier info
  const { data: transaction } = await supabase
    .from("transactions")
    .select("supplier_id, amount, application_fee")
    .eq("payment_intent_id", paymentIntentId)
    .single();

  // Notify supplier
  await sendDisputeNotificationEmail(
    transaction.supplier_id,
    dispute,
    transaction.amount
  );
}

async function handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
  const paymentIntentId = dispute.payment_intent as string;

  if (dispute.status === "lost") {
    // Architect won the dispute
    await supabase
      .from("transactions")
      .update({
        status: "refunded",
        dispute_status: "lost",
        refunded_at: new Date().toISOString(),
      })
      .eq("payment_intent_id", paymentIntentId);

    // Refund application fee
    await refundApplicationFee(paymentIntentId);
  } else if (dispute.status === "won") {
    // Supplier won the dispute
    await supabase
      .from("transactions")
      .update({
        status: "succeeded",
        dispute_status: "won",
      })
      .eq("payment_intent_id", paymentIntentId);
  }
}

async function refundApplicationFee(paymentIntentId: string): Promise<void> {
  const { data: transaction } = await supabase
    .from("transactions")
    .select("application_fee")
    .eq("payment_intent_id", paymentIntentId)
    .single();

  // Create application fee refund
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const charge = paymentIntent.latest_charge as string;

  await stripe.applicationFees.createRefund(
    paymentIntent.application_fee as string,
    {
      amount: transaction.application_fee,
    }
  );

  console.log(
    `Refunded application fee: $${transaction.application_fee / 100}`
  );
}
```

## Data Models

### Transaction Model

```typescript
interface Transaction {
  id: string; // UUID
  payment_intent_id: string;
  rfq_response_id: string;
  architect_id: string;
  supplier_id: string;

  // Amounts (in cents)
  amount: number;
  application_fee: number;
  supplier_amount: number;

  // Status
  status: "pending" | "succeeded" | "failed" | "disputed" | "refunded";

  // Dispute info
  dispute_id?: string;
  dispute_reason?: string;
  dispute_status?: "won" | "lost" | "pending";

  // Timestamps
  created_at: string;
  paid_at?: string;
  disputed_at?: string;
  refunded_at?: string;
}
```

### Database Schema Addition

```sql
-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id TEXT UNIQUE NOT NULL,
  rfq_response_id UUID NOT NULL REFERENCES rfq_responses(id) ON DELETE CASCADE,
  architect_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

  -- Amounts (in cents)
  amount INTEGER NOT NULL CHECK (amount > 0),
  application_fee INTEGER NOT NULL CHECK (application_fee >= 0),
  supplier_amount INTEGER NOT NULL CHECK (supplier_amount > 0),
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'disputed', 'refunded')),

  -- Dispute info
  dispute_id TEXT,
  dispute_reason TEXT,
  dispute_status TEXT CHECK (dispute_status IN ('won', 'lost', 'pending')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_payout_id TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

  -- Amount (in cents)
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),

  -- Bank account (last 4 digits)
  bank_account_last4 TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arrival_date DATE,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Failure info
  failure_code TEXT,
  failure_message TEXT
);

-- Indexes
CREATE INDEX idx_transactions_payment_intent ON transactions(payment_intent_id);
CREATE INDEX idx_transactions_rfq_response ON transactions(rfq_response_id);
CREATE INDEX idx_transactions_architect ON transactions(architect_id, created_at DESC);
CREATE INDEX idx_transactions_supplier ON transactions(supplier_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX idx_payouts_stripe_id ON payouts(stripe_payout_id);
CREATE INDEX idx_payouts_supplier ON payouts(supplier_id, created_at DESC);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_arrival_date ON payouts(arrival_date DESC);

-- Update suppliers table to add stripe_connect_account_id if not exists
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_suppliers_stripe_account ON suppliers(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Property 1: Connected Account ID storage
_For any_ successful supplier onboarding, the system should store the Stripe Connected Account ID in the database
**Validates: Requirements 1.2, 1.3**

Property 2: Incomplete onboarding handling
_For any_ supplier with incomplete onboarding, the system should display the current status and provide a way to resume
**Validates: Requirements 1.4**

Property 3: Verification failure handling
_For any_ supplier whose verification fails, the system should display the failure reason and allow retry
**Validates: Requirements 1.5**

Property 4: Payment Intent creation
_For any_ accepted quote, the system should create a Stripe Payment Intent with the correct amount
**Validates: Requirements 2.1**

Property 5: Application fee calculation by tier
_For any_ payment, the application fee should be calculated as 3.5% for free tier, 2.5% for standard tier, or 2% for verified tier
**Validates: Requirements 2.2, 3.2, 3.3, 3.4**

Property 6: Payment Intent destination
_For any_ Payment Intent created, the destination should be set to the supplier's Connected Account ID
**Validates: Requirements 2.3**

Property 7: Client secret return
_For any_ Payment Intent created, the system should return a client secret to the frontend
**Validates: Requirements 2.4**

Property 8: Transaction logging on payment
_For any_ completed payment, the system should update the RFQ status to "closed" and create a transaction log entry
**Validates: Requirements 2.5**

Property 9: Application fee transfer
_For any_ successful payment, the application fee should be transferred to the Platform Account
**Validates: Requirements 3.1, 3.5**

Property 10: Payout webhook handling
_For any_ payout webhook received, the system should log the payout in the database
**Validates: Requirements 4.2, 4.3**

Property 11: Payout status updates
_For any_ payout that completes, the system should update its status to "paid"
**Validates: Requirements 4.4**

Property 12: Payout failure handling
_For any_ payout that fails, the system should update its status to "failed" and notify the supplier
**Validates: Requirements 4.5**

Property 13: Transaction display completeness
_For any_ supplier dashboard view, all transactions should be displayed with amounts, dates, and statuses
**Validates: Requirements 5.1**

Property 14: Transaction detail completeness
_For any_ transaction displayed, it should show gross amount, application fee, and net amount
**Validates: Requirements 5.2**

Property 15: Payout detail completeness
_For any_ payout displayed, it should show payout date, amount, and bank account last 4 digits
**Validates: Requirements 5.3**

Property 16: Date range filtering
_For any_ date range specified, only transactions within that range should be returned
**Validates: Requirements 5.4**

Property 17: CSV export generation
_For any_ export request, the system should generate a CSV file with all transaction details
**Validates: Requirements 5.5**

Property 18: Dispute webhook handling
_For any_ dispute webhook received, the system should update the transaction status to "disputed"
**Validates: Requirements 6.1, 6.2**

Property 19: Dispute notification
_For any_ dispute received, the system should send an email notification to the supplier
**Validates: Requirements 6.3**

Property 20: Dispute resolution - architect wins
_For any_ dispute resolved in favor of the architect, the system should reverse the supplier's payout and refund the application fee
**Validates: Requirements 6.4, 6.5**

Property 21: Monthly summary generation
_For any_ supplier with transactions in the previous month, the system should generate a payout summary on the first day of the month
**Validates: Requirements 7.1**

Property 22: Summary completeness
_For any_ payout summary generated, it should include total transactions, total fees, and net payouts
**Validates: Requirements 7.2**

Property 23: Summary email delivery
_For any_ payout summary generated, it should be sent via email to the supplier
**Validates: Requirements 7.3**

Property 24: No summary for zero transactions
_For any_ supplier with no transactions in a month, no summary email should be sent
**Validates: Requirements 7.4**

Property 25: On-demand summary generation
_For any_ month requested by a supplier, the system should generate a payout summary for that month
**Validates: Requirements 7.5**

Property 26: 1099-K threshold flagging
_For any_ supplier earning more than $600 in a calendar year, the system should flag them for 1099-K generation
**Validates: Requirements 8.1**

Property 27: 1099-K generation trigger
_For any_ eligible supplier in January, the system should trigger Stripe to generate their 1099-K form
**Validates: Requirements 8.2**

Property 28: 1099-K availability notification
_For any_ 1099-K generated, the system should notify the supplier that their form is available
**Validates: Requirements 8.3**

Property 29: 1099-K download link
_For any_ supplier requesting their 1099-K, the system should provide a link to download it from Stripe
**Validates: Requirements 8.4**

Property 30: Platform fee export
_For any_ export request, the system should generate a report of all application fees for tax filing
**Validates: Requirements 8.5**

Property 31: KYC verification enforcement
_For any_ supplier who fails KYC verification, the system should prevent them from receiving payments
**Validates: Requirements 9.3**

Property 32: No sensitive data storage
_For any_ payment processed, the system should never store raw credit card numbers or CVV codes
**Validates: Requirements 9.4**

Property 33: Audit logging completeness
_For any_ transaction, all required data for audit and compliance should be recorded
**Validates: Requirements 9.5**

Property 34: API error logging
_For any_ Stripe API call that fails, the system should log the error with full context
**Validates: Requirements 10.1**

Property 35: User-friendly error messages
_For any_ payment failure, the system should return a user-friendly error message to the frontend
**Validates: Requirements 10.2**

Property 36: Webhook signature verification
_For any_ webhook received, the system should verify the Stripe signature before processing
**Validates: Requirements 10.3**

Property 37: Webhook failure handling
_For any_ webhook processing failure, the system should log the failure and allow Stripe to retry
**Validates: Requirements 10.4**

Property 38: Critical error alerting
_For any_ critical payment error, the system should send alerts to platform administrators
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

1. **Onboarding Errors**: Account creation failures, verification issues

   - Action: Display error to supplier, allow retry
   - Log error for admin review

2. **Payment Errors**: Card declined, insufficient funds, authentication required

   - Action: Return user-friendly message to architect
   - Log error with full context
   - Allow retry

3. **Webhook Errors**: Signature verification failure, processing errors

   - Action: Return 400/500 status to Stripe
   - Log error for investigation
   - Stripe will retry automatically

4. **Payout Errors**: Bank account issues, insufficient balance

   - Action: Update payout status to "failed"
   - Notify supplier with failure reason
   - Log error

5. **Dispute Errors**: Dispute processing failures
   - Action: Log error and alert admin
   - Manual review required

### Retry Strategy

- **API Calls**: Retry 3 times with exponential backoff (1s, 2s, 4s)
- **Webhooks**: Let Stripe handle retries (automatic)
- **Email Notifications**: Retry 2 times, then log failure

## Security Considerations

### PCI Compliance

- Never store card numbers, CVV, or full card data
- Use Stripe Elements for card input (PCI-compliant)
- All payment data handled by Stripe
- HTTPS only for all endpoints

### Webhook Security

- Verify Stripe signature on all webhooks
- Use webhook secret from environment variables
- Reject webhooks with invalid signatures
- Log all webhook attempts

### Data Protection

- Encrypt sensitive data at rest (tokens, account IDs)
- Use environment variables for API keys
- Implement rate limiting on payment endpoints
- Audit log all financial transactions

## Testing Strategy

### Unit Testing

1. **Fee Calculation**:

   - Test all three tier percentages
   - Test edge cases (zero amount, very large amounts)
   - Test rounding behavior

2. **Onboarding Flow**:

   - Test account creation
   - Test account link generation
   - Test status checking

3. **Payment Processing**:

   - Test Payment Intent creation
   - Test metadata attachment
   - Test error handling

4. **Webhook Handling**:
   - Test signature verification
   - Test each webhook type
   - Test error scenarios

### Integration Testing

1. **End-to-End Payment Flow**:

   - Onboard supplier → Accept quote → Process payment → Verify payout
   - Use Stripe test mode
   - Verify database state at each step

2. **Dispute Flow**:

   - Create payment → Simulate dispute → Verify refund
   - Test both won and lost disputes

3. **Monthly Summary**:
   - Create transactions → Generate summary → Verify email
   - Test with various transaction counts

### Property-Based Testing

Use **fast-check** library (100 iterations per property):

```typescript
import fc from "fast-check";

// Property 5: Fee calculation
test("Property 5: Application fee matches tier percentage", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 100, max: 10000000 }), // amount in cents
      fc.constantFrom("free", "standard", "verified"),
      (amount, tier) => {
        const fees = calculateFees(amount, tier);

        const expectedPercent = {
          free: 0.035,
          standard: 0.025,
          verified: 0.02,
        }[tier];

        const expectedFee = Math.round(amount * expectedPercent);
        expect(fees.applicationFee).toBe(expectedFee);
        expect(fees.supplierAmount).toBe(amount - expectedFee);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Deployment

### Environment Variables

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform Configuration
NEXT_PUBLIC_URL=https://greenchainz.com
PLATFORM_FEE_FREE=0.035
PLATFORM_FEE_STANDARD=0.025
PLATFORM_FEE_VERIFIED=0.02

# Database
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Monitoring
ADMIN_EMAIL=admin@greenchainz.com
SENTRY_DSN=...
```

### Deployment Steps

1. **Set up Stripe Account**:

   - Create Stripe account
   - Enable Stripe Connect
   - Configure webhook endpoints
   - Get API keys

2. **Deploy Database Schema**:

   ```sql
   -- Run transactions and payouts table creation
   psql -h [db-host] -f database-schemas/stripe_connect_schema.sql
   ```

3. **Deploy API Routes**:

   ```bash
   # Deploy Next.js application
   vercel deploy --prod
   ```

4. **Configure Webhooks**:

   - Add webhook endpoint: `https://greenchainz.com/api/webhooks/stripe`
   - Select events: `payment_intent.*`, `charge.dispute.*`, `payout.*`, `account.updated`
   - Copy webhook secret to environment variables

5. **Test in Stripe Test Mode**:

   - Use test API keys
   - Test onboarding flow
   - Test payment flow
   - Test webhooks

6. **Go Live**:
   - Switch to live API keys
   - Monitor first transactions
   - Verify payouts work correctly

### Monitoring

- **Stripe Dashboard**: Monitor payments, disputes, payouts
- **Application Logs**: Track API errors, webhook failures
- **Database Queries**: Monitor transaction volumes, failed payments
- **Alerts**: Set up alerts for critical errors, high dispute rates

## Compliance Checklist

- ✅ PCI-DSS: Using Stripe's compliant infrastructure
- ✅ KYC/AML: Stripe handles identity verification
- ✅ 1099-K: Automatic generation for eligible suppliers
- ✅ Data Privacy: No sensitive card data stored
- ✅ Audit Trail: All transactions logged
- ✅ Dispute Handling: Automated via Stripe
- ✅ Payout Schedule: Stripe's standard 2-day rolling

## Support and Troubleshooting

### Common Issues

1. **Supplier can't complete onboarding**:

   - Check account status in Stripe Dashboard
   - Verify email is correct
   - Check for verification issues

2. **Payment fails**:

   - Check Stripe logs for error details
   - Verify supplier has completed onboarding
   - Check for insufficient funds or card issues

3. **Webhook not received**:

   - Verify webhook endpoint is accessible
   - Check webhook signature verification
   - Review Stripe webhook logs

4. **Payout delayed**:
   - Check Stripe payout schedule
   - Verify bank account is valid
   - Check for holds or disputes

### Resources

- **Stripe Docs**: https://stripe.com/docs/connect
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Support**: support@greenchainz.com
