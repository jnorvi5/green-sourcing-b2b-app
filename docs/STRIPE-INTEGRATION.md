# Stripe Subscription Billing Integration

## Overview

Complete Stripe subscription billing system for GreenChainz with three tiers:

- **FREE** ($0/month) - 1 product, 3 RFQs/month
- **STANDARD** ($99/month) - 10 products, unlimited RFQs, basic analytics
- **VERIFIED** ($299/month) - Unlimited products, premium visibility, verified badge

## Setup

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification (required for live mode)

### 2. Get API Keys

1. Go to Dashboard → Developers → API keys
2. Copy your **Secret key** (starts with `sk_test_` for test mode)
3. Copy your **Publishable key** (starts with `pk_test_`)

### 3. Create Products and Prices

#### Option A: Via Stripe Dashboard (Recommended)

1. Go to Dashboard → Products
2. Click "Add product"
3. Create two products:

**Standard Subscription**:

- Name: "Standard Plan"
- Description: "10 products, unlimited RFQs"
- Pricing: $99.00 USD / month (recurring)
- Copy the **Price ID** (starts with `price_`)

**Verified Subscription**:

- Name: "Verified Plan"
- Description: "Unlimited products, premium visibility"
- Pricing: $299.00 USD / month (recurring)
- Copy the **Price ID**

#### Option B: Via Stripe CLI

```bash
# Create Standard product
stripe products create \
  --name="Standard Plan" \
  --description="10 products, unlimited RFQs"

# Create Standard price
stripe prices create \
  --product=prod_xxx \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=month

# Create Verified product
stripe products create \
  --name="Verified Plan" \
  --description="Unlimited products, premium visibility"

# Create Verified price
stripe prices create \
  --product=prod_yyy \
  --unit-amount=29900 \
  --currency=usd \
  --recurring[interval]=month
```

### 4. Set Up Webhook

1. Go to Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://greenchainz.com/api/stripe/webhook` (production)
   - For local testing: Use Stripe CLI (see below)
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the **Signing secret** (starts with `whsec_`)

### 5. Add Environment Variables

Add to your `.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_STANDARD=price_standard_id
STRIPE_PRICE_VERIFIED=price_verified_id
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 6. Run Database Migration

```bash
npx supabase db push
```

This creates:

- Subscription fields in `suppliers` table
- `subscriptions` table
- `payments` table
- Triggers for automatic limit updates
- Analytics views (MRR, churn)

## Testing Locally

### Using Stripe CLI

1. Install Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to local server:

   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

4. Copy the webhook signing secret from CLI output
5. Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)

### Test Flow

1. Start dev server: `npm run dev`
2. Navigate to `/supplier/pricing`
3. Click "Upgrade to Verified"
4. Complete checkout with test card
5. Verify webhook received in Stripe CLI
6. Check database: `SELECT * FROM suppliers WHERE tier = 'verified'`
7. Go to `/supplier/subscription` to view dashboard

## Features

### Subscription Management

- **Upgrade**: `/supplier/pricing` - Choose tier and checkout
- **Dashboard**: `/supplier/subscription` - View usage and manage subscription
- **Cancel**: Cancel at period end (retain access until billing cycle ends)
- **Reactivate**: Undo cancellation before period ends

### Automatic Limit Enforcement

Triggers automatically update `product_limit` and `rfq_limit` when tier changes:

```sql
-- Free tier
product_limit = 1
rfq_limit = 3

-- Standard tier
product_limit = 10
rfq_limit = 999999 (unlimited)

-- Verified tier
product_limit = 999999 (unlimited)
rfq_limit = 999999 (unlimited)
```

### Webhook Events

| Event                           | Action                                         |
| ------------------------------- | ---------------------------------------------- |
| `checkout.session.completed`    | Create subscription, upgrade tier              |
| `invoice.paid`                  | Log payment, extend subscription period        |
| `invoice.payment_failed`        | Send dunning email, downgrade after 3 failures |
| `customer.subscription.deleted` | Downgrade to free tier                         |
| `customer.subscription.updated` | Update subscription status                     |

### Revenue Analytics

Built-in views for tracking revenue:

```sql
-- Monthly Recurring Revenue
SELECT * FROM mrr_by_tier;

-- Churn rate (last 30 days)
SELECT * FROM churn_last_30_days;
```

## API Reference

### Create Checkout Session

```typescript
POST /api/stripe/create-checkout

Request:
{
  "tier": "verified",
  "success_url": "https://greenchainz.com/supplier/success",
  "cancel_url": "https://greenchainz.com/supplier/pricing"
}

Response:
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_..."
}
```

### Get Subscription Status

```typescript
GET /api/stripe/subscription

Response:
{
  "has_subscription": true,
  "tier": "verified",
  "status": "active",
  "current_period_end": "2025-01-02T15:00:00Z",
  "limits": {
    "products": "unlimited",
    "rfqs": "unlimited",
    "visibility": "premium",
    "verified_badge": true
  },
  "usage": {
    "products_used": 5,
    "rfqs_used_this_month": 12
  }
}
```

### Cancel Subscription

```typescript
POST /api/stripe/cancel-subscription

Response:
{
  "success": true,
  "message": "Subscription will be canceled at the end of the billing period",
  "cancel_at_period_end": true,
  "period_end": "2025-01-02T15:00:00Z"
}
```

## Security

### Webhook Signature Verification

**CRITICAL**: Always verify webhook signatures to prevent spoofing:

```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

Never skip this step in production!

### API Key Security

- ✅ Store keys in environment variables
- ✅ Never commit keys to git
- ✅ Use test keys for development
- ✅ Rotate keys if compromised
- ❌ Never expose secret key in frontend

## Troubleshooting

### "No such price"

**Solution**: Verify `STRIPE_PRICE_STANDARD` and `STRIPE_PRICE_VERIFIED` match your Stripe Dashboard price IDs.

### Webhook not receiving events

**Solution**:

1. Check webhook endpoint URL is correct
2. Verify webhook signing secret matches
3. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3001/api/stripe/webhook`

### Payment failed after 3 attempts

**Solution**: Supplier automatically downgraded to free tier. They must update payment method and re-subscribe.

## Files Created

### Database

- `supabase/migrations/20251202_stripe_subscriptions.sql`

### Types

- `types/stripe.ts`

### Services

- `lib/stripe/config.ts`
- `lib/stripe/checkout.ts`
- `lib/stripe/webhooks.ts`

### API Routes

- `app/api/stripe/create-checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/stripe/subscription/route.ts`

### Pages

- `app/supplier/pricing/page.tsx`
- `app/supplier/subscription/page.tsx`
- `app/supplier/success/page.tsx`

**Total**: 12 files created
