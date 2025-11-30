# GreenChainz Outreach Agent Service

Automated AI-powered outreach system for supplier acquisition, buyer engagement, and partnership development.

## Architecture

```text
outreach/
├── index.js           # Main service export
├── agentRunner.js     # Cron scheduler + agent orchestration
├── leadService.js     # Lead/contact management
├── emailGenerator.js  # AI-powered email generation (Azure AI Foundry)
├── emailSender.js     # SMTP/API email delivery
├── campaignManager.js # Campaign tracking and sequences
└── analytics.js       # Outreach metrics and reporting
```

## Features

1. **Lead Management**
   - Import leads from various sources
   - Score and segment leads automatically
   - Track contact history and engagement

2. **AI Email Generation**
   - Personalized emails using Azure AI Foundry
   - Multiple templates (cold outreach, follow-up, re-engagement)
   - A/B testing support

3. **Campaign Automation**
   - Multi-touch sequences (Day 0, Day 3, Day 7, etc.)
   - Smart scheduling based on timezone and engagement
   - Automatic pause on reply/bounce

4. **Analytics & Reporting**
   - Open rates, reply rates, bounce rates
   - Campaign performance comparison
   - Lead conversion tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/outreach/contacts` | List all contacts/leads |
| POST | `/api/v1/outreach/contacts` | Add new contact |
| GET | `/api/v1/outreach/events` | List outreach events |
| POST | `/api/v1/outreach/agent/run` | Trigger agent manually |
| GET | `/api/v1/outreach/campaigns` | List campaigns |
| POST | `/api/v1/outreach/campaigns` | Create new campaign |
| GET | `/api/v1/outreach/analytics` | Get outreach metrics |

## Environment Variables

```env
# Azure AI Foundry
AZURE_AI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_AI_KEY=your-api-key
AZURE_AI_DEPLOYMENT=gpt-4

# Email Delivery
OUTREACH_SMTP_HOST=smtp.sendgrid.net
OUTREACH_SMTP_PORT=587
OUTREACH_SMTP_USER=apikey
OUTREACH_SMTP_PASS=your-sendgrid-api-key
OUTREACH_FROM_EMAIL=outreach@greenchainz.com
OUTREACH_FROM_NAME=GreenChainz Team

# Agent Settings
OUTREACH_CRON_SCHEDULE=0 9 * * 1-5  # 9 AM weekdays
OUTREACH_BATCH_SIZE=50
OUTREACH_DAILY_LIMIT=200
```

## Database Tables

The service uses these tables (auto-created on first run):

- `Outreach_Contacts` - Lead/contact records
- `Outreach_Events` - Email sends, opens, clicks, replies
- `Outreach_Campaigns` - Campaign definitions
- `Outreach_Sequences` - Multi-touch sequence steps
- `Outreach_Agent_Runs` - Agent execution logs

## Usage

```javascript
// Import the service
const outreachService = require('./services/outreach');

// Run the agent manually
await outreachService.runAgent();

// Add a new lead
await outreachService.addContact({
  email: 'supplier@example.com',
  firstName: 'John',
  lastName: 'Doe',
  company: 'Eco Materials Inc',
  type: 'supplier',
  source: 'website_signup'
});

// Get analytics
const stats = await outreachService.getAnalytics('last_30_days');
```
