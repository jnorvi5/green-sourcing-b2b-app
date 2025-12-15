# Success Fee Integration Guide

This guide shows how to integrate the success fee invoicing system when an RFQ is marked as "won" or "accepted".

## Overview

When a supplier wins an RFQ, the system should automatically:
1. Calculate the success fee (default 3% of deal value)
2. Create a Stripe invoice
3. Store the invoice in the database
4. Send the invoice to the supplier via email
5. Track the payment status

## Integration Points

### 1. When Supplier Accepts RFQ

If your workflow has suppliers accepting RFQ offers:

```typescript
// app/actions/rfq.ts or wherever you handle RFQ acceptance
'use server';

import { createClient } from '@/lib/supabase/server';
import { processRFQWin } from '@/lib/rfq/successFeeService';
import { z } from 'zod';

const acceptRfqSchema = z.object({
  rfqRequestId: z.string().uuid(),
  quoteAmount: z.number().positive(), // Amount in cents
});

export async function acceptRFQ(input: z.infer<typeof acceptRfqSchema>) {
  const validated = acceptRfqSchema.parse(input);
  const supabase = await createClient();

  // Get authenticated supplier
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Get supplier ID
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Update RFQ status to "answered" or "won"
  const { error: updateError } = await supabase
    .from('rfq_requests')
    .update({
      status: 'answered',
    })
    .eq('id', validated.rfqRequestId)
    .eq('supplier_id', supplier.id);

  if (updateError) throw updateError;

  // Generate success fee invoice
  try {
    const result = await processRFQWin({
      rfqRequestId: validated.rfqRequestId,
      supplierId: supplier.id,
      acceptedQuoteAmount: validated.quoteAmount,
      feePercentage: 3, // Optional, defaults to 3%
    });

    console.log(`Success fee invoice created: ${result.invoiceId}`);
  } catch (error) {
    console.error('Failed to create success fee invoice:', error);
    // Don't fail the RFQ acceptance if invoicing fails
    // You can retry later or handle via admin dashboard
  }

  return { success: true };
}
```

### 2. When Buyer Marks RFQ as Won

If your workflow has buyers marking which supplier won:

```typescript
// app/actions/rfq.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { processRFQWin } from '@/lib/rfq/successFeeService';
import { z } from 'zod';

const markRfqWonSchema = z.object({
  rfqRequestId: z.string().uuid(),
  winningSupplierId: z.string().uuid(),
  finalQuoteAmount: z.number().positive(), // Amount in cents
});

export async function markRFQAsWon(input: z.infer<typeof markRfqWonSchema>) {
  const validated = markRfqWonSchema.parse(input);
  const supabase = await createClient();

  // Verify buyer is authenticated and owns this RFQ
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: rfq } = await supabase
    .from('rfq_requests')
    .select('buyer_id')
    .eq('id', validated.rfqRequestId)
    .single();

  if (!rfq || rfq.buyer_id !== user.id) {
    throw new Error('Unauthorized: Not your RFQ');
  }

  // Update RFQ with winner
  const { error: updateError } = await supabase
    .from('rfq_requests')
    .update({
      status: 'answered', // or create a 'won' status
      supplier_id: validated.winningSupplierId,
    })
    .eq('id', validated.rfqRequestId);

  if (updateError) throw updateError;

  // Generate success fee invoice for winning supplier
  try {
    const result = await processRFQWin({
      rfqRequestId: validated.rfqRequestId,
      supplierId: validated.winningSupplierId,
      acceptedQuoteAmount: validated.finalQuoteAmount,
    });

    console.log(`Success fee invoice created: ${result.invoiceId}`);
  } catch (error) {
    console.error('Failed to create success fee invoice:', error);
    // Consider storing this in a retry queue
  }

  return { success: true };
}
```

### 3. Via Admin Dashboard

Create an admin action to manually trigger success fee invoices:

```typescript
// app/actions/admin/invoices.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { processRFQWin } from '@/lib/rfq/successFeeService';
import { z } from 'zod';

const createManualInvoiceSchema = z.object({
  rfqRequestId: z.string().uuid(),
  supplierId: z.string().uuid(),
  dealAmount: z.number().positive(),
  feePercentage: z.number().min(0).max(100).default(3),
});

export async function createManualSuccessFeeInvoice(
  input: z.infer<typeof createManualInvoiceSchema>
) {
  const validated = createManualInvoiceSchema.parse(input);
  const supabase = await createClient();

  // Verify admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }

  // Create invoice
  const result = await processRFQWin({
    rfqRequestId: validated.rfqRequestId,
    supplierId: validated.supplierId,
    acceptedQuoteAmount: validated.dealAmount,
    feePercentage: validated.feePercentage,
  });

  return {
    success: true,
    invoiceId: result.invoiceId,
    amount: result.amount,
  };
}
```

## Handling Invoice Payment

The webhook handlers automatically update invoice status:

```typescript
// This is already implemented in lib/stripe/webhooks.ts

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Automatically marks invoice as paid in database
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);
}
```

## Checking Invoice Status

Query invoice status programmatically:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getSupplierInvoiceStatus(supplierId: string) {
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Calculate totals
  const summary = invoices.reduce(
    (acc, inv) => {
      acc.total_invoiced += inv.amount_cents;
      if (inv.status === 'paid') {
        acc.total_paid += inv.amount_cents;
      } else if (inv.status === 'open') {
        acc.total_outstanding += inv.amount_cents;
      }
      return acc;
    },
    { total_invoiced: 0, total_paid: 0, total_outstanding: 0 }
  );

  return { invoices, summary };
}
```

## Error Handling

The success fee service throws errors that should be caught:

```typescript
try {
  await processRFQWin({
    rfqRequestId: 'uuid',
    supplierId: 'uuid',
    acceptedQuoteAmount: 50000,
  });
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Supplier not found')) {
      // Handle missing supplier
    } else if (error.message.includes('does not have a Stripe customer ID')) {
      // Handle supplier without Stripe account
      // You might want to prompt them to set up billing first
    } else if (error.message.includes('RFQ request not found')) {
      // Handle missing RFQ
    } else {
      // Generic error handling
      console.error('Failed to create success fee invoice:', error);
    }
  }
}
```

## Testing

### Test with Stripe Test Mode

```typescript
// Use test card numbers
const TEST_CARD = '4242424242424242';

// Create test supplier with Stripe customer
const testSupplier = await createTestSupplier({
  email: 'test@example.com',
  name: 'Test Supplier',
});

// Simulate RFQ win
await processRFQWin({
  rfqRequestId: testRfqId,
  supplierId: testSupplier.id,
  acceptedQuoteAmount: 100000, // $1000
  feePercentage: 3,
});

// Check invoice in Stripe Dashboard
// Should see $30 invoice sent to test@example.com
```

## Best Practices

1. **Always validate input** with Zod before calling `processRFQWin()`
2. **Handle errors gracefully** - don't fail the main operation if invoicing fails
3. **Log all invoice creations** for audit trail
4. **Check for duplicate invoices** - the service checks but add extra validation
5. **Monitor webhook events** - ensure `invoice.payment_succeeded` is processed
6. **Set up alerts** for failed invoice creations
7. **Test in Stripe test mode** before production deployment

## Monitoring

Track invoice metrics:

```sql
-- Total success fees by status
SELECT status, COUNT(*), SUM(amount_cents) as total_cents
FROM invoices
GROUP BY status;

-- Unpaid invoices older than 30 days
SELECT *
FROM invoices
WHERE status = 'open'
AND due_date < NOW() - INTERVAL '30 days';

-- Average success fee amount
SELECT AVG(amount_cents) as avg_fee_cents
FROM invoices
WHERE status = 'paid';
```

## Support

For issues or questions:
- Check `docs/STRIPE_SETUP.md` for general Stripe configuration
- Review webhook logs in Stripe Dashboard
- Check application logs for error messages
- Verify supplier has `stripe_customer_id` set
