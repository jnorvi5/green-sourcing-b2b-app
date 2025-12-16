# Stripe Payment System - Setup & Usage Guide

This document describes the complete Stripe payment integration for GreenChainz B2B marketplace, including subscription billing and success fee invoicing.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [Webhook Events](#webhook-events)
7. [Database Schema](#database-schema)
8. [Testing](#testing)

## Overview

The Stripe payment system supports two revenue streams:

1. **Subscription Billing**: Monthly recurring revenue from supplier subscriptions (Free, Standard, Verified tiers)
2. **Success Fee Invoicing**: One-time invoices when suppliers win RFQs (default 3% of deal value)

## Architecture

### Core Components

```
lib/stripe/
├── config.ts           # Stripe initialization, price IDs, webhook secret
├── checkout.ts         # Checkout sessions, customer portal, subscription management
├── webhooks.ts         # Webhook event handlers
└── invoices.ts         # Success fee invoice generation

app/api/stripe/
├── webhook/            # POST endpoint for Stripe webhooks
├── customer-portal/    # POST endpoint for customer portal sessions
├── billing-history/    # GET endpoint for billing history
├── subscription/       # GET/POST/DELETE subscription management
└── create-checkout/    # POST endpoint for checkout sessions

app/supplier/
├── subscription/       # Subscription management UI
└── pricing/            # Pricing page with upgrade buttons

lib/rfq/
└── successFeeService.ts # RFQ win detection and invoice creation
```

## Setup Instructions

### 1. Stripe Dashboard Configuration

1. **Create Stripe Account**: Sign up at https://stripe.com
2. **Get API Keys**:
   - Dashboard → Developers → API keys
   - Copy Secret key and Publishable key
3. **Create Products & Prices**:
   ```
   Products:
   - Standard Subscription: $99/month
   - Verified Subscription: $299/month
   ```
4. **Create Webhook Endpoint**:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `invoice.finalized`
     - `invoice.payment_succeeded`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
     - `customer.subscription.trial_will_end`
     - `payment_method.attached`
   - Copy webhook signing secret

### 2. Environment Variables

Add to `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from your Dashboard)
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_ARCHITECT_PRO=price_...
STRIPE_PRICE_SUPPLIER=price_...

# Base URL for callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 3. Database Migration

Run the invoice system migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply the migration file manually
psql -h your-db-host -U postgres -d greenchainz -f supabase/migrations/20251215_invoice_system.sql
```

This creates the `invoices` table with:
- Success fee tracking
- Stripe invoice integration
- RLS policies for security

### 4. Test Webhook Locally

Use Stripe CLI for local testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Copy the webhook signing secret to .env.local
```

## Features

### 1. Subscription Management

**Supplier Dashboard** (`/supplier/subscription`):
- Current plan display with tier badge
- Usage statistics (products, RFQs)
- Next billing date
- Manage Billing button → Stripe Customer Portal
- Cancel/Reactivate subscription
- Billing history table with invoice downloads

**Customer Portal** (via Stripe):
- Update payment methods
- View invoices
- Download receipts
- Update billing email
- Manage subscription (cancel, upgrade)

### 2. Success Fee Invoicing

When a supplier wins an RFQ:

```typescript
import { processRFQWin } from '@/lib/rfq/successFeeService';

await processRFQWin({
  rfqRequestId: 'uuid',
  supplierId: 'uuid',
  acceptedQuoteAmount: 50000, // $500.00 in cents
  feePercentage: 3, // Optional, defaults to 3%
});
```

This will:
1. Calculate fee (3% of $500 = $15)
2. Create Stripe invoice
3. Store in database
4. Send invoice email to supplier
5. Set due date to Net 30

### 3. Webhook Processing

All Stripe events are processed automatically:

- **checkout.session.completed**: Creates subscription record
- **invoice.paid**: Logs payment, updates subscription
- **invoice.payment_failed**: Downgrades after 3 failures
- **invoice.finalized**: Updates invoice with PDF URL
- **invoice.payment_succeeded**: Marks success fee as paid
- **customer.subscription.deleted**: Downgrades to free tier
- **customer.subscription.updated**: Syncs subscription status
- **payment_method.attached**: Logs payment method addition
- **customer.subscription.trial_will_end**: Sends reminder email

## API Endpoints

### POST /api/stripe/customer-portal

Generate customer portal session.

**Request:**
```json
{
  "return_url": "https://your-domain.com/supplier/subscription"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/xxx"
}
```

**Usage:**
```typescript
const response = await fetch('/api/stripe/customer-portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ return_url: window.location.href }),
});
const { url } = await response.json();
window.location.href = url;
```

### GET /api/stripe/billing-history

Fetch all invoices and payments for authenticated supplier.

**Response:**
```json
{
  "invoices": [
    {
      "id": "in_xxx",
      "stripe_invoice_id": "in_xxx",
      "amount_cents": 9900,
      "currency": "usd",
      "status": "paid",
      "description": "Standard subscription payment",
      "invoice_pdf": "https://...",
      "hosted_invoice_url": "https://...",
      "created_at": "2025-12-15T10:00:00Z",
      "paid_at": "2025-12-15T10:00:00Z"
    }
  ],
  "payments": [...],
  "success_fee_invoices": [...]
}
```

### GET /api/stripe/subscription

Get current subscription status and usage.

**Response:**
```json
{
  "has_subscription": true,
  "tier": "standard",
  "status": "active",
  "current_period_end": "2026-01-15T10:00:00Z",
  "cancel_at_period_end": false,
  "limits": {
    "products": 10,
    "rfqs": "unlimited",
    "visibility": "standard",
    "analytics": "basic",
    "epd_verifications": 0,
    "verified_badge": false,
    "ranking_boost": 1
  },
  "usage": {
    "products_used": 5,
    "rfqs_used_this_month": 12
  }
}
```

### POST /api/stripe/subscription

Cancel subscription at period end.

**Response:**
```json
{
  "success": true,
  "message": "Subscription will be canceled at the end of the billing period",
  "cancel_at_period_end": true,
  "period_end": "2026-01-15T10:00:00Z"
}
```

### DELETE /api/stripe/subscription

Reactivate canceled subscription.

**Response:**
```json
{
  "success": true,
  "message": "Subscription reactivated successfully"
}
```

## Webhook Events

### Event: checkout.session.completed

**Handler:** `handleCheckoutCompleted()`

Updates supplier with subscription info:
- `tier`, `stripe_customer_id`, `stripe_subscription_id`
- Creates subscription record
- Sets product/RFQ limits

### Event: invoice.paid

**Handler:** `handleInvoicePaid()`

Logs payment in `payments` table with:
- Amount, currency, status
- Subscription reference
- Tier information

### Event: invoice.payment_failed

**Handler:** `handlePaymentFailed()`

After 3 failed attempts:
- Downgrades supplier to `free` tier
- Updates status to `past_due`
- Sends dunning email (TODO)

### Event: invoice.finalized

**Handler:** `handleInvoiceFinalized()`

Updates invoice with:
- PDF URL
- Hosted invoice URL
- Status: `open`

### Event: invoice.payment_succeeded

**Handler:** `handleInvoicePaymentSucceeded()`

Marks success fee invoice as paid:
- Updates status: `paid`
- Sets `paid_at` timestamp

### Event: customer.subscription.deleted

**Handler:** `handleSubscriptionDeleted()`

Downgrades supplier to free tier:
- Sets `tier` to `free`
- Updates status to `canceled`
- Records `canceled_at` timestamp

### Event: customer.subscription.updated

**Handler:** `handleSubscriptionUpdated()`

Syncs subscription changes:
- Status, period dates
- `cancel_at_period_end` flag

## Database Schema

### Table: invoices

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  stripe_invoice_id TEXT UNIQUE,
  rfq_request_id UUID REFERENCES rfq_requests(id),
  amount_cents INTEGER NOT NULL,
  fee_percentage DECIMAL(5,2) DEFAULT 3.00,
  deal_amount_cents INTEGER NOT NULL,
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  invoice_hosted_url TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

- Suppliers can view their own invoices
- Admins can view all invoices
- System can manage all invoices

## Testing

### Test Subscription Flow

1. **Sign up as supplier** at `/auth/signup`
2. **Navigate to pricing** at `/supplier/pricing`
3. **Click "Upgrade to Standard"**
4. **Use Stripe test card**: `4242 4242 4242 4242`
5. **Complete checkout**
6. **Verify**:
   - Redirected to success page
   - Webhook received and processed
   - Subscription created in database
   - Tier updated to `standard`

### Test Customer Portal

1. **Go to** `/supplier/subscription`
2. **Click "Manage Billing"**
3. **Verify redirect** to Stripe Customer Portal
4. **Test actions**:
   - View invoices
   - Update payment method
   - Download receipts

### Test Success Fee Invoice

```typescript
// In your RFQ win handler
import { processRFQWin } from '@/lib/rfq/successFeeService';

// When RFQ is marked as "won"
await processRFQWin({
  rfqRequestId: 'uuid-of-rfq',
  supplierId: 'uuid-of-supplier',
  acceptedQuoteAmount: 100000, // $1000 in cents
  feePercentage: 3,
});

// Check:
// 1. Invoice created in Stripe Dashboard
// 2. Record in `invoices` table
// 3. Supplier receives invoice email
```

### Test Webhooks Locally

```bash
# Terminal 1: Run Next.js dev server
npm run dev

# Terminal 2: Forward Stripe webhooks
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

## Support & Troubleshooting

### Common Issues

**Issue**: Webhook signature verification fails
- **Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard or CLI

**Issue**: Customer portal redirect fails
- **Solution**: Check that supplier has `stripe_customer_id` and `stripe_subscription_id`

**Issue**: Success fee invoice not created
- **Solution**: Verify supplier has Stripe customer ID, check webhook logs

### Debug Logging

Enable detailed Stripe logs:

```typescript
// lib/stripe/config.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
  maxNetworkRetries: 3,
  telemetry: false, // Disable telemetry in development
});
```

Check webhook logs:
- Stripe Dashboard → Developers → Webhooks → Click endpoint → View logs
- Application logs: `console.log` statements in webhook handlers

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure webhook signing secret for production
- [ ] Test all webhook events in production
- [ ] Set up Stripe Dashboard alerts
- [ ] Configure dunning management
- [ ] Set up invoice email templates
- [ ] Test customer portal in production
- [ ] Verify success fee calculations
- [ ] Set up monitoring for failed payments
- [ ] Configure backup payment failure notifications

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Invoice Guide](https://stripe.com/docs/invoicing)
