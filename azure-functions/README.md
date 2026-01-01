# GreenChainz Azure Functions

Serverless scheduled jobs for automated KPI tracking and system maintenance.

## Functions

| Function | Schedule | Description |
|----------|----------|-------------|
| `DailyKPISnapshot` | 2 AM UTC daily | Comprehensive daily metrics capture |
| `HourlyKPISnapshot` | Every hour | Quick metrics for real-time dashboards |
| `WeeklyRollup` | Sunday 3 AM UTC | Aggregate daily → weekly summaries |
| `MonthlyRollup` | 1st of month 4 AM UTC | Aggregate weekly → monthly summaries |
| `AlertEvaluation` | Every 15 minutes | Check alerts and trigger notifications |
| `CacheRefresh` | Every 6 hours | Update external data caches |
| `WeeklyCleanup` | Sunday 5 AM UTC | Remove old data to save storage |
| `HealthCheck` | Every 5 minutes | Monitor system health |

## Setup

### Prerequisites
- [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local)
- Node.js 18+
- Azure subscription (for deployment)

### Local Development

1. Install dependencies:
```bash
cd azure-functions
npm install
```

2. Copy `local.settings.example.json` to `local.settings.json` and update values:
```bash
cp local.settings.example.json local.settings.json
```

3. Start the functions locally:
```bash
npm start
```

### Manual Trigger

You can manually trigger any job via HTTP POST:

```bash
curl -X POST http://localhost:7071/api/ManualJobTrigger \
  -H "Content-Type: application/json" \
  -d '{"jobName": "dailyKPISnapshot"}'
```

## Deployment to Azure

### Using Azure CLI

1. Create a Function App:
```bash
az functionapp create \
  --resource-group greenchainz-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name greenchainz-functions \
  --storage-account greenchainzstorage
```

2. Configure app settings:
```bash
az functionapp config appsettings set \
  --name greenchainz-functions \
  --resource-group greenchainz-rg \
  --settings \
    "NEXT_API_BASE_URL=https://your-app.azurewebsites.net" \
    "JOBS_API_KEY=your-secure-key"
```

3. Deploy:
```bash
func azure functionapp publish greenchainz-functions
```

### Using VS Code

1. Install Azure Functions extension
2. Sign in to Azure
3. Right-click the function app → "Deploy to Function App"

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Azure Functions                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DailySnapshot │  │HourlySnapshot│  │AlertEvaluate │      │
│  │   Timer      │  │    Timer     │  │    Timer     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └────────────┬────┴──────────────────┘              │
│                      ▼                                       │
│              ┌──────────────┐                                │
│              │  HTTP POST   │                                │
│              │ /api/jobs    │                                │
│              └──────┬───────┘                                │
└─────────────────────┼────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   /api/jobs                           │   │
│  │  - Validates API key                                  │   │
│  │  - Executes job via lib/scheduledJobs.ts             │   │
│  │  - Returns result                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              lib/scheduledJobs.ts                     │   │
│  │  - runDailyKPISnapshot()                             │   │
│  │  - runWeeklyRollup()                                 │   │
│  │  - runAlertEvaluation()                              │   │
│  │  - etc...                                            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │greenchainz │ │  buyers    │ │ suppliers  │ │ analytics │ │
│  │   (main)   │ │            │ │            │ │           │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## KPIs Tracked

### Platform
- GMV (Gross Merchandise Value)
- Total Orders
- Buyers / Suppliers count
- DAU / MAU
- Conversion rates

### Sustainability
- Total Carbon Saved
- Average Carbon Score
- Sustainable Order %
- Certified Supplier %

### Operations
- API Response Time
- Error Rate
- Platform Uptime

## Alerts

Configure alerts in the KPI dashboard to get notified when metrics go:
- **Above** a threshold
- **Below** a threshold
- **Change above** X%
- **Change below** X%

Notification channels:
- Email
- Slack (coming soon)
- Webhook

## Cost Estimation

Azure Functions Consumption Plan (typical usage):
- Free tier: 1M executions/month
- Beyond free tier: ~$0.20 per million executions
- Estimated monthly cost: **$0-5** for typical usage

## Troubleshooting

### Functions not triggering
- Check Azure Portal → Function App → Functions → Monitor
- Verify CRON expressions
- Check Application Insights logs

### Connection errors
- Verify Supabase connection strings in app settings
- Check API endpoint availability
- Ensure VNet configuration if using private endpoints
