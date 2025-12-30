# Azure Cron Jobs Configuration

This document explains how to set up scheduled tasks (cron jobs) on Azure for the GreenChainz platform.

## Overview

The application has several cron jobs that were previously managed by Vercel Cron. On Azure, these need to be configured using one of the following approaches:

1. **Azure Logic Apps** (Recommended) - Visual workflow designer with built-in scheduling
2. **Azure Functions Timer Triggers** - Code-based approach
3. **Azure App Service WebJobs** - Traditional scheduled tasks

## Existing Cron Jobs

### 1. MailerLite Sync
- **Endpoint**: `POST /api/cron/sync-mailerlite`
- **Schedule**: Daily at 3:00 AM UTC (`0 3 * * *`)
- **Purpose**: Syncs Supabase users to MailerLite groups for email marketing
- **Max Duration**: 5 minutes

### 2. Quarterly Report Generation
- **Endpoint**: `POST /api/cron/generate-quarterly-reports`
- **Schedule**: Quarterly on Jan 1, Apr 1, Jul 1, Oct 1 at midnight UTC (`0 0 1 1,4,7,10 *`)
- **Purpose**: Generates quarterly market intelligence reports
- **Max Duration**: 5 minutes

## Option 1: Azure Logic Apps (Recommended)

Logic Apps provide a visual, no-code approach to scheduling HTTP requests.

### Setup Steps

1. **Create Logic App**
   ```bash
   az logic workflow create \
     --resource-group greenchainz-prod \
     --location eastus \
     --name greenchainz-cron-mailerlite \
     --definition @logic-app-mailerlite.json
   ```

2. **Configure Recurrence Trigger**
   - Trigger: Recurrence
   - Interval: 1 day
   - Time: 03:00 UTC

3. **Add HTTP Action**
   - Method: GET
   - URI: `https://greenchainz-platform.azurewebsites.net/api/cron/sync-mailerlite`
   - Headers:
     ```json
     {
       "Authorization": "Bearer YOUR_CRON_SECRET"
     }
     ```

4. **Add Error Handling**
   - Configure retry policy
   - Add email notification on failure

### Logic App Definition Example

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "actions": {
      "HTTP": {
        "type": "Http",
        "inputs": {
          "method": "GET",
          "uri": "https://greenchainz-platform.azurewebsites.net/api/cron/sync-mailerlite",
          "headers": {
            "Authorization": "Bearer @{parameters('cronSecret')}"
          }
        },
        "runAfter": {}
      }
    },
    "triggers": {
      "Recurrence": {
        "type": "Recurrence",
        "recurrence": {
          "frequency": "Day",
          "interval": 1,
          "schedule": {
            "hours": ["3"],
            "minutes": [0]
          },
          "timeZone": "UTC"
        }
      }
    }
  },
  "parameters": {
    "cronSecret": {
      "type": "securestring"
    }
  }
}
```

## Option 2: Azure Functions Timer Triggers

Create Azure Functions that call your API endpoints on a schedule.

### Setup Steps

1. **Create Timer Function**
   ```bash
   cd azure-functions
   func new --name MailerLiteSync --template "Timer trigger"
   ```

2. **Function Code** (`azure-functions/src/functions/mailerliteSync.ts`):
   ```typescript
   import { app, InvocationContext, Timer } from '@azure/functions';

   export async function mailerliteSync(myTimer: Timer, context: InvocationContext): Promise<void> {
     const cronSecret = process.env.CRON_SECRET;
     const appUrl = process.env.APP_URL || 'https://greenchainz-platform.azurewebsites.net';
     
     try {
       const response = await fetch(`${appUrl}/api/cron/sync-mailerlite`, {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${cronSecret}`,
         },
       });

       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }

       const data = await response.json();
       context.log('MailerLite sync completed:', data);
     } catch (error) {
       context.error('MailerLite sync failed:', error);
       throw error;
     }
   }

   app.timer('mailerliteSync', {
     schedule: '0 3 * * *', // Daily at 3:00 AM UTC
     handler: mailerliteSync,
   });
   ```

3. **Deploy Function**
   ```bash
   cd azure-functions
   npm run build
   func azure functionapp publish greenchainz-functions
   ```

## Option 3: Azure App Service WebJobs

WebJobs run in the same App Service as your Next.js application.

### Setup Steps

1. **Create WebJob Script** (`webjobs/mailerlite-sync/run.sh`):
   ```bash
   #!/bin/bash
   curl -X GET \
     -H "Authorization: Bearer $CRON_SECRET" \
     "$APP_URL/api/cron/sync-mailerlite"
   ```

2. **Package WebJob**
   ```bash
   cd webjobs/mailerlite-sync
   zip -r mailerlite-sync.zip .
   ```

3. **Deploy via Azure Portal**
   - Navigate to App Service → WebJobs
   - Click "Add"
   - Upload `mailerlite-sync.zip`
   - Set schedule: `0 3 * * *`

## Configuration

### Environment Variables

Set these in Azure App Service Configuration:

```bash
CRON_SECRET=your-random-secure-secret-here
APP_URL=https://greenchainz-platform.azurewebsites.net
```

### Monitoring

1. **Logic Apps**: Built-in run history and monitoring
2. **Azure Functions**: Application Insights integration
3. **WebJobs**: WebJob logs in App Service

## Testing

Test cron jobs manually:

```bash
# Set your cron secret
CRON_SECRET="your-secret"

# Test MailerLite sync
curl -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://greenchainz-platform.azurewebsites.net/api/cron/sync-mailerlite

# Test quarterly reports
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://greenchainz-platform.azurewebsites.net/api/cron/generate-quarterly-reports
```

## Comparison

| Feature | Logic Apps | Functions | WebJobs |
|---------|-----------|-----------|---------|
| Setup Complexity | Low (Visual) | Medium (Code) | Medium (Script) |
| Monitoring | Excellent | Excellent | Good |
| Error Handling | Built-in | Custom | Custom |
| Retry Logic | Built-in | Custom | Manual |
| Cost | Pay-per-run | Pay-per-run | Included with App Service |
| Recommended For | Simple schedules | Complex logic | Basic tasks |

## Recommendation

**Use Azure Logic Apps** for the GreenChainz cron jobs because:
- Visual configuration (no code changes needed)
- Built-in retry and error handling
- Easy monitoring and alerting
- Cost-effective for low-frequency jobs
- No deployment needed when updating schedules

## Migration Checklist

- [ ] Create Logic App for MailerLite sync (daily at 3 AM UTC)
- [ ] Create Logic App for quarterly reports (Jan 1, Apr 1, Jul 1, Oct 1)
- [ ] Configure CRON_SECRET in Logic App parameters
- [ ] Test both cron jobs manually
- [ ] Set up email alerts for failures
- [ ] Monitor first week of scheduled runs
- [ ] Document actual run times in Application Insights

## Additional Resources

- [Azure Logic Apps Documentation](https://docs.microsoft.com/en-us/azure/logic-apps/)
- [Azure Functions Timer Triggers](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer)
- [Azure WebJobs Documentation](https://docs.microsoft.com/en-us/azure/app-service/webjobs-create)
