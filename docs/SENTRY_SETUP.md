# Sentry Error Tracking Setup Guide

This guide walks through the Sentry integration for GreenChainz error tracking and performance monitoring.

## What Sentry Does

**Error Tracking:**
- Catches all runtime errors (client + server + edge)
- Shows exact line of code that broke
- Tracks which users affected
- Provides stack traces and breadcrumbs

**Performance Monitoring:**
- Tracks page load times
- Measures API response times
- Identifies slow database queries
- Monitors Web Vitals (LCP, FID, CLS)

**Session Replay:**
- Records user sessions when errors occur
- Shows exactly what user did before error
- Replay user actions to reproduce bugs

---

## Prerequisites

- Sentry account (free tier: 5,000 errors/month)
- GitHub Student Pack ($100 credit for Team plan)
- Next.js app with `@sentry/nextjs` installed

---

## Installation

### 1. Install Sentry SDK

```bash
# Run Sentry wizard (auto-configures everything)
npx @sentry/wizard@latest -i nextjs

# This creates:
# - sentry.client.config.ts (browser errors)
# - sentry.server.config.ts (server errors)
# - sentry.edge.config.ts (middleware/edge errors)
# - Updates next.config.js with Sentry plugin
```

---

### 2. Get Sentry DSN

```bash
1. Go to: https://sentry.io/signup/
2. Sign up with GitHub (jnorvi5)
3. Create project:
   - Platform: Next.js
   - Project name: greenchainz
   - Team: GreenChainz (or default)
4. Copy DSN (looks like: https://abc123@o123.ingest.sentry.io/456)
```

---

### 3. Add Environment Variable

```bash
# .env.local (local development)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id

# Vercel Dashboard (production)
# Settings → Environment Variables → Add:
# Key: NEXT_PUBLIC_SENTRY_DSN
# Value: [paste DSN]
# Environments: Production, Preview, Development
```

---

## Configuration Files

### sentry.client.config.ts (Browser Errors)

**Features enabled:**
- Error tracking (100% of errors)
- Performance monitoring (100% of transactions)
- Session replay (10% of sessions, 100% on errors)
- Filters hydration errors (dev only)
- Filters ad blocker errors

**Configuration:**
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // 100% performance tracking
  replaysSessionSampleRate: 0.1, // 10% session recording
  replaysOnErrorSampleRate: 1.0, // 100% record when error
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
})
```

---

### sentry.server.config.ts (Server Errors)

**Tracks:**
- API route errors
- Server component errors
- Database query errors
- External API failures

**Configuration:**
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // 100% performance tracking
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
})
```

---

### sentry.edge.config.ts (Edge/Middleware Errors)

**Tracks:**
- Middleware errors
- Edge runtime errors
- API routes on edge

---

## Root Layout Integration

### app/layout.tsx Updates

**Added:**
```typescript
import * as Sentry from '@sentry/nextjs'

export function generateMetadata(): Metadata {
  return {
    // ... existing metadata
    other: {
      ...Sentry.getTraceData() // Performance tracking headers
    }
  }
}
```

**What this does:**
- Adds `sentry-trace` header to every page
- Links frontend errors to backend errors
- Enables distributed tracing across services

---

## Testing

### 1. Test Client-Side Errors

**Create test page:**
```typescript
// app/test-sentry/page.tsx
'use client'

export default function TestSentryPage() {
  function throwError() {
    throw new Error('Test client-side error for Sentry')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      <button
        onClick={throwError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Trigger Test Error
      </button>
    </div>
  )
}
```

**Test steps:**
```bash
1. npm run dev
2. Visit http://localhost:3000/test-sentry
3. Click "Trigger Test Error"
4. Go to Sentry dashboard → Issues
5. Should see: "Test client-side error for Sentry"
6. Click issue → see stack trace, user info, breadcrumbs
```

---

### 2. Test Server-Side Errors

**Create test API route:**
```typescript
// app/api/test-sentry/route.ts
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    throw new Error('Test server-side error for Sentry')
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

**Test steps:**
```bash
1. Visit http://localhost:3000/api/test-sentry
2. Should see: {"error": "Server error"}
3. Check Sentry dashboard → see server-side error
```

---

## Production Usage

### Capturing Custom Errors

**Manual error capture:**
```typescript
import * as Sentry from '@sentry/nextjs'

// Capture exception
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'rfq-submission' },
    extra: { userId, productId },
  })
}

// Capture message
Sentry.captureMessage('RFQ submitted successfully', {
  level: 'info',
  extra: { rfqId, supplierId },
})
```

---

### User Context

**Set user info after login:**
```typescript
import * as Sentry from '@sentry/nextjs'

// After successful auth
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role, // 'architect' or 'supplier'
})

// On logout
Sentry.setUser(null)
```

---

### Custom Tags

**Add context to errors:**
```typescript
Sentry.setTag('user_type', 'architect')
Sentry.setTag('feature', 'rfq_submission')
Sentry.setTag('payment_tier', 'pro')
```

---

## Sentry Dashboard

### Key Sections

**1. Issues**
- List of all errors
- Frequency, affected users
- Click → see stack trace, breadcrumbs, replay

**2. Performance**
- Page load times
- API response times
- Database query performance
- Web Vitals scores

**3. Releases**
- Track errors by deployment
- Compare error rates between releases
- Auto-tagged with Git commit SHA

**4. Replays** (10% of sessions, 100% on errors)
- Watch user session recordings
- See exactly what user did before error
- DOM snapshots, console logs, network requests

---

## Alerts

### Configure Slack/Email Notifications

```bash
1. Sentry Dashboard → Settings → Integrations
2. Connect Slack workspace
3. Settings → Alerts → Create Alert Rule:
   - Name: "Critical Production Errors"
   - When: "An event is seen"
   - If: "level equals error AND environment equals production"
   - Then: "Send notification to #greenchainz-alerts"
```

---

## Free Tier Limits

**Sentry Free Plan:**
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 replays/month
- 7-day data retention
- 1 project

**GitHub Student Pack ($100 credit):**
- Extends to Team plan for ~4 months
- 50,000 errors/month
- 100,000 transactions/month
- 500 replays/month
- 90-day retention

**Your expected usage (Q1 2026):**
- 50 suppliers × 20 errors/month = 1,000 errors
- 200 architects × 10 errors/month = 2,000 errors
- **Total: ~3,000 errors/month** (well under free tier)

---

## Best Practices

### 1. Filter Non-Critical Errors

**In `sentry.client.config.ts`:**
```typescript
beforeSend(event, hint) {
  // Ignore hydration errors in dev
  if (error?.message?.includes('Hydration')) {
    return null
  }
  
  // Ignore ad blocker network errors
  if (error?.message?.includes('Failed to fetch')) {
    return null
  }
  
  return event
}
```

---

### 2. Add Context to Errors

**Always include:**
- User ID/email
- Feature being used
- Input values (sanitized)
- Environment info

```typescript
Sentry.captureException(error, {
  tags: {
    feature: 'rfq_submission',
    user_type: 'architect',
  },
  extra: {
    rfqData: sanitizedRfqData,
    supplierId,
    materialType,
  },
})
```

---

### 3. Monitor Key Metrics

**Weekly review:**
- New error types
- Error frequency trends
- Affected user count
- Performance regressions

**Set alerts for:**
- Error rate spikes (>10 errors/hour)
- Page load time >3 seconds
- API response time >1 second

---

## Common Issues

### Issue: "Missing DSN" Error

**Cause:** `NEXT_PUBLIC_SENTRY_DSN` not set

**Fix:**
```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Restart dev server
npm run dev
```

---

### Issue: No Errors Appearing in Sentry

**Cause:** Errors filtered out or DSN incorrect

**Debug:**
```typescript
// Temporarily enable debug mode
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: true, // Shows Sentry logs in console
})
```

**Check console for:**
- "Sentry SDK initialized"
- "Event sent to Sentry"
- "Event dropped: [reason]"

---

### Issue: Too Many Errors (Hitting Limits)

**Cause:** Noisy errors not filtered

**Fix:** Add to `beforeSend` filter:
```typescript
beforeSend(event, hint) {
  const error = hint.originalException as Error
  
  // List of errors to ignore
  const ignoredErrors = [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'ChunkLoadError',
  ]
  
  if (ignoredErrors.some(msg => error?.message?.includes(msg))) {
    return null
  }
  
  return event
}
```

---

## Source Maps (For Production)

**Why needed:** See original TypeScript code in stack traces (not minified JS)

**Auto-configured by Sentry wizard:**
```javascript
// next.config.js (already added)
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'greenchainz',
    project: 'greenchainz',
  },
  {
    hideSourceMaps: true,
    disableLogger: true,
  }
)
```

**What this does:**
- Uploads source maps to Sentry on deploy
- Removes source maps from production bundle
- Stack traces show original TypeScript code

---

## Next Steps

### After Merging This PR:

**1. Deploy to production** (5 min)
```bash
# Merge PR → auto-deploys to Vercel
# Add NEXT_PUBLIC_SENTRY_DSN to Vercel env vars
```

**2. Test in production** (10 min)
```bash
# Visit https://greenchainz.com/test-sentry
# Trigger error
# Verify appears in Sentry dashboard
```

**3. Configure alerts** (15 min)
```bash
# Sentry → Settings → Alerts
# Create rules for critical errors
# Connect Slack/email notifications
```

**4. Add user context** (20 min)
```bash
# After auth, set Sentry user:
Sentry.setUser({ id, email, role })
# On logout: Sentry.setUser(null)
```

**5. Monitor for 1 week**
```bash
# Review Sentry dashboard daily
# Fix any critical errors immediately
# Filter out noise (hydration errors, etc.)
```

---

## ROI: Why Sentry Matters

### Real Example: Password Bug

**Without Sentry:**
```
→ User enters 7-char password
→ Silent failure
→ User confused, leaves site
→ You have no idea this happened
→ Lose potential customer
```

**With Sentry:**
```
→ User enters 7-char password
→ Validation fails
→ Sentry logs: "Password validation failed, length: 7"
→ Alert: "23 users hit this error in last hour"
→ You fix within 1 hour
→ Save 23 customers
```

**Value:**
- Catch issues before users report them
- Fix bugs 10x faster with stack traces
- Prioritize fixes by user impact
- Monitor production health 24/7

---

## Summary

**What's enabled:**
✅ Client-side error tracking
✅ Server-side error tracking
✅ Edge runtime error tracking
✅ Performance monitoring
✅ Session replay (on errors)
✅ Distributed tracing
✅ Source maps for production

**Setup time:** 20 minutes

**Cost:** FREE (5,000 errors/month), $100 student credit extends to Team plan

**Benefit:** Catch production bugs in real-time, fix 10x faster

**Deploy:** Merge PR → Add DSN to Vercel → Live
