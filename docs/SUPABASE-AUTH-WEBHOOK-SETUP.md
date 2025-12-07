# Supabase Auth Webhook Setup Guide

This guide explains how to configure Supabase to send webhook events to your Next.js application when new users sign up.

## Overview

The webhook handler at `/api/webhooks/supabase-user-created` processes new user sign-ups and sends role-specific welcome emails:

- **Suppliers**: Welcome email + 2 scheduled follow-ups (Day 2 & Day 7)
- **Architects/Buyers**: Welcome email with platform introduction

## Prerequisites

1. **Resend API Key**: Get your API key from [resend.com](https://resend.com)
2. **Supabase Project**: Active Supabase project with Auth enabled
3. **Next.js Application**: Deployed and accessible via HTTPS

## Environment Variables

Add these to your `.env.local` or environment configuration:

```bash
# Required
RESEND_API_KEY=re_your_resend_api_key
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Optional (defaults shown)
RESEND_FROM_EMAIL=noreply@greenchainz.com
RESEND_FROM_NAME=GreenChainz
```

## Setting Up the Webhook in Supabase

### Option 1: Using Supabase Dashboard (Recommended)

1. **Navigate to Database Webhooks**
   - Go to your Supabase project dashboard
   - Navigate to **Database** → **Webhooks**

2. **Create New Webhook**
   - Click **Create a new webhook**
   - Name: `user-signup-webhook`

3. **Configure Webhook Settings**
   ```
   Table: auth.users
   Events: INSERT
   Type: HTTP Request
   Method: POST
   URL: https://your-domain.com/api/webhooks/supabase-user-created
   HTTP Headers: (leave empty or add authorization if needed)
   ```

4. **Test the Webhook**
   - Use the "Send test request" button
   - Check your application logs for the webhook processing

### Option 2: Using SQL (Advanced)

Execute this SQL in your Supabase SQL Editor:

```sql
-- Create webhook for new user sign-ups
CREATE OR REPLACE FUNCTION notify_user_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-domain.com/api/webhooks/supabase-user-created',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'schema', 'auth',
      'record', row_to_json(NEW),
      'old_record', null
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION notify_user_created();
```

**Note**: This requires the `pg_net` extension to be enabled in Supabase.

### Option 3: Using Supabase Edge Function

For more control, you can create a Supabase Edge Function that's triggered on auth events:

```typescript
// supabase/functions/on-user-created/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const { record } = await req.json();
  
  // Forward to Next.js webhook
  const response = await fetch('https://your-domain.com/api/webhooks/supabase-user-created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'INSERT',
      table: 'users',
      schema: 'auth',
      record: record,
    }),
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

Then configure the Auth Hook in Supabase Dashboard:
- Navigate to **Authentication** → **Hooks**
- Add a new hook for **Insert** events
- Point to your Edge Function URL

## User Metadata Requirements

The webhook expects users to have a `role` field in their metadata. This is typically set during sign-up:

```typescript
// Example: Sign up with role metadata
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      role: 'supplier', // or 'architect', 'buyer', 'admin'
      full_name: 'John Doe',
    },
  },
});
```

### Supported Roles

- `supplier`: Sends supplier onboarding sequence with follow-ups
- `architect`: Sends architect/buyer welcome email
- `buyer`: Same as architect
- `admin`: No email sent (admin accounts)

If no role is specified, it defaults to `buyer`.

## Testing the Webhook

### 1. Health Check

First, verify the webhook endpoint is accessible:

```bash
curl https://your-domain.com/api/webhooks/supabase-user-created

# Expected response:
{
  "status": "ok",
  "webhook": "supabase-user-created",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test with Sample Payload

Create a test payload file `test-webhook.json`:

```json
{
  "type": "INSERT",
  "table": "users",
  "schema": "auth",
  "record": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "raw_user_meta_data": {
      "role": "supplier",
      "full_name": "Test Supplier"
    }
  }
}
```

Send the test request:

```bash
curl -X POST https://your-domain.com/api/webhooks/supabase-user-created \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

### 3. Check Application Logs

Monitor your application logs for webhook processing:

```bash
# Example expected logs:
📥 Received Supabase webhook: { type: 'INSERT', table: 'users', userId: '...' }
Processing new user signup: { userId: '...', email: '...', name: '...', role: '...' }
📧 Sending supplier welcome sequence to: test@example.com
✅ Supplier welcome email sent: msg_abc123
✅ Supplier follow-up (Day 2) scheduled: msg_def456
✅ Supplier follow-up (Day 7) scheduled: msg_ghi789
✅ Webhook processed successfully in 150ms
```

## Email Templates

The webhook uses these email templates from `lib/email/templates.ts`:

### Supplier Emails

1. **Welcome Email** (Immediate)
   - Subject: "Welcome to GreenChainz - Complete Your Profile"
   - Content: Onboarding steps, verification process
   - CTA: Link to supplier dashboard

2. **Day 2 Follow-up** (Scheduled)
   - Subject: "Don't forget to upload your certifications"
   - Content: Importance of certifications, verification benefits
   - CTA: Upload certifications

3. **Day 7 Follow-up** (Scheduled)
   - Subject: "Tips for getting your first RFQ match"
   - Content: Best practices, profile optimization tips
   - CTA: Optimize profile

### Architect/Buyer Emails

1. **Welcome Email** (Immediate)
   - Subject: "Welcome to GreenChainz - Find Verified Sustainable Suppliers"
   - Content: Platform overview, how to create RFQs
   - CTA: Create first RFQ

## Webhook Security

### Verify Webhook Source (Recommended)

To prevent unauthorized webhook calls, add authentication:

1. **Add Webhook Secret to Environment**:
   ```bash
   WEBHOOK_SECRET=your-secret-key
   ```

2. **Update Webhook Route** to verify the secret:
   ```typescript
   // In route.ts
   const authHeader = request.headers.get('authorization');
   const expectedAuth = `Bearer ${process.env.WEBHOOK_SECRET}`;
   
   if (authHeader !== expectedAuth) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. **Configure Header in Supabase**:
   - In webhook settings, add HTTP header:
   - Key: `Authorization`
   - Value: `Bearer your-secret-key`

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**:
   ```bash
   # Verify API key is set
   echo $RESEND_API_KEY
   ```

2. **Check Resend Dashboard**:
   - Go to [resend.com/logs](https://resend.com/logs)
   - Look for failed email attempts
   - Check domain verification status

3. **Review Application Logs**:
   ```bash
   # Look for error messages
   grep "Failed to send" application.log
   ```

### Webhook Not Triggered

1. **Verify Webhook Configuration**:
   - Check webhook is enabled in Supabase
   - Verify URL is correct and accessible
   - Test webhook manually in Supabase dashboard

2. **Check Network Access**:
   - Ensure your application is publicly accessible
   - Verify no firewall blocking Supabase IPs
   - Test with curl from external location

3. **Review Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Check for webhook delivery errors
   - Look for HTTP error codes

### Follow-up Emails Not Scheduled

1. **Check Resend Account Limits**:
   - Free tier may have scheduling limitations
   - Verify you're on a plan that supports scheduling

2. **Verify scheduledAt Format**:
   - Must be ISO 8601 format
   - Must be future date
   - Check timezone handling

## Monitoring and Analytics

### Track Email Delivery

1. **Resend Dashboard**:
   - Monitor delivery rates
   - Check bounce/complaint rates
   - View click/open rates

2. **Application Metrics**:
   - Track webhook processing time
   - Monitor success/failure rates
   - Alert on elevated error rates

### Custom Event Tracking

Add event tracking for email sends:

```typescript
// Example with analytics service
analytics.track('email_sent', {
  email_type: 'supplier_welcome',
  user_id: userId,
  success: true,
});
```

## Production Checklist

- [ ] Resend API key configured
- [ ] Domain verified in Resend
- [ ] Webhook URL is HTTPS
- [ ] Webhook secret configured (recommended)
- [ ] Test webhook with sample payloads
- [ ] Monitor logs for 24 hours after deployment
- [ ] Verify email deliverability
- [ ] Set up alerts for webhook failures
- [ ] Document any custom modifications

## Related Documentation

- [Resend API Documentation](https://resend.com/docs)
- [Supabase Webhooks Guide](https://supabase.com/docs/guides/database/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

## Support

For issues with:
- **Webhook handler**: Check application logs and test suite
- **Email delivery**: Contact Resend support
- **Supabase webhooks**: Contact Supabase support

## Changelog

- **2024-12-07**: Initial webhook implementation
  - Added supplier and architect welcome emails
  - Implemented scheduled follow-ups for suppliers
  - Added comprehensive error handling and logging
