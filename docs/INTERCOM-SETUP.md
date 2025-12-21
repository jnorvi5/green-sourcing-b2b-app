# Intercom Setup Guide for GreenChainz

## QUICK START (5 Minutes)

### 1. Get Your Intercom App ID

1. Go to [https://app.intercom.com/](https://app.intercom.com/)
2. Sign up or log in to your Intercom account
3. Navigate to **Settings** → **Installation** → **Web**
4. Copy your **App ID** (looks like: `abc123de`)

### 2. Add to Vercel Environment Variables

1. Go to [https://vercel.com/greenchainz-vercel/green-sourcing-b2b-app/settings/environment-variables](https://vercel.com/greenchainz-vercel/green-sourcing-b2b-app/settings/environment-variables)
2. Click **Add New**
3. Name: `NEXT_PUBLIC_INTERCOM_APP_ID`
4. Value: `your-app-id-from-step-1`
5. Environment: Select **Production**, **Preview**, and **Development**
6. Click **Save**

### 3. Redeploy

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Click the **...** menu → **Redeploy**
4. Wait for deployment to complete (2-3 minutes)

### 4. Verify It's Working

1. Visit [https://greenchainz.com](https://greenchainz.com)
2. Look for the Intercom chat widget in the bottom-right corner
3. Click it to test functionality

---

## What This Integration Does

✅ **Customer Support Chat** - Live chat widget on your site
✅ **Lead Capture** - Automatically collects visitor info
✅ **User Tracking** - Tracks user behavior and engagement
✅ **Automated Messages** - Send targeted messages based on user actions
✅ **Mobile Support** - Works on all devices

---

## Current Implementation

### Files Modified

- `app/layout.tsx` - Root layout with IntercomProvider
- `components/IntercomProvider.tsx` - Client-side Intercom initialization
- `lib/intercom.ts` - Intercom SDK integration
- `.env.example` - Environment variable documentation

### Key Features Implemented

1. **Automatic Initialization** - Loads on every page
2. **User Identification** - Tracks authenticated users
3. **Custom User Properties** - Sends user type (buyer/supplier/admin)
4. **Company Association** - Links users to companies
5. **Secure Configuration** - Uses environment variables

---

## Advanced Configuration (Optional)

### Customize Intercom Settings

Edit `lib/intercom.ts` to customize:

```typescript
(window as any).intercomSettings = {
  app_id: appId,
  api_base: 'https://api-iam.intercom.io',
  // Add custom settings:
  alignment: 'right', // or 'left'
  horizontal_padding: 20,
  vertical_padding: 20,
  hide_default_launcher: false,
  custom_launcher_selector: '#your-button-id'
};
```

### Track Custom Events

Add event tracking for specific actions:

```typescript
import { trackIntercomEvent } from '@/lib/intercom';

// Example: Track when user views a product
trackIntercomEvent('viewed_product', {
  product_id: '123',
  product_name: 'Sustainable Insulation',
  category: 'Insulation'
});
```

### Identify Users on Login

Edit your authentication flow to identify users:

```typescript
import { updateIntercomUser } from '@/lib/intercom';

// After successful login
updateIntercomUser({
  email: user.email,
  name: user.name,
  userId: user.id,
  userType: user.role, // 'buyer' | 'supplier' | 'admin'
  company: user.company_name
});
```

---

## Troubleshooting

### Intercom Widget Not Showing

1. **Check Environment Variable**
   ```bash
   # In Vercel dashboard, verify:
   NEXT_PUBLIC_INTERCOM_APP_ID=your-app-id
   ```

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for Intercom initialization logs
   - Check for errors related to Intercom

3. **Verify App ID Format**
   - Should be alphanumeric (e.g., `abc123de`)
   - No quotes or spaces

4. **Clear Cache and Hard Reload**
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Widget Shows But Can't Send Messages

1. **Check Intercom Dashboard Status**
   - Go to [https://app.intercom.com/](https://app.intercom.com/)
   - Verify your workspace is active

2. **Check Inbox Settings**
   - Settings → Channels → Messenger
   - Ensure Messenger is enabled

3. **Verify Domain Whitelisting**
   - Settings → Installation → Web
   - Add `greenchainz.com` to allowed domains

---

## Next Steps

### Customize Your Messenger

1. Go to **Settings** → **Messenger** in Intercom
2. Customize colors to match GreenChainz branding:
   - Primary color: `#10b981` (green)
   - Text color: `#ffffff` (white)
3. Add your logo
4. Set up welcome message

### Set Up Automated Workflows

1. **Welcome New Visitors**
   - Settings → Outbound → Messages
   - Create "Welcome" message for first-time visitors

2. **Qualify Leads**
   - Create bot to ask if they're a buyer or supplier
   - Route to appropriate team

3. **Follow Up on Abandoned Actions**
   - Track when users start signup but don't complete
   - Send automated follow-up

### Integrate with Your CRM

- Intercom → Settings → App Store
- Connect Salesforce, HubSpot, or other CRM
- Sync customer data automatically

---

## Support

Need help?
- **Intercom Docs**: [https://www.intercom.com/help](https://www.intercom.com/help)
- **GreenChainz Support**: founder@greenchainz.com

---

## Pricing

**Current Plan**: Free (14-day trial)

**After Trial**:
- Starter: $74/month (2 seats)
- Pro: Custom pricing

**What You Get**:
- Unlimited contacts
- Live chat
- Automated workflows
- Mobile apps
- Basic reporting

---

## Security & Privacy

✅ **GDPR Compliant** - Intercom is fully GDPR compliant
✅ **Data Encryption** - All data encrypted in transit and at rest
✅ **User Consent** - We track user consent via Cookie Consent banner
✅ **Data Retention** - Configure in Intercom settings

---

**Last Updated**: December 11, 2025
**Status**: ✅ READY FOR PRODUCTION
