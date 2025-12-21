# GreenChainz Quick Deployment Guide

## 🚀 Fast Setup (5 Minutes)

### 1. Configure Environment

```bash
# Copy environment template
cp .env.updated .env

# Edit .env with your credentials:
# - Supabase URL and keys
# - Intercom App ID
# - Email service (Resend recommended)
```

### 2. Install & Build

**Windows (PowerShell):**

```powershell
.\scripts\quick-deploy.ps1
```

**Linux/Mac:**

```bash
chmod +x scripts/quick-deploy.sh
./scripts/quick-deploy.sh
```

### 3. Start Services

**Option A: All at once (recommended for development)**

```bash
# Terminal 1 - Backend API
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Next.js (Admin & API Routes)
npm start
```

**Option B: Production mode**

```bash
# Build everything
npm run build
cd frontend && npm run build && cd ..

# Start production servers
cd backend && npm start &
npm start
```

## 📊 Access Points

- **Admin Dashboard**: http://localhost:3001/admin/dashboard
- **Marketplace**: http://localhost:5173
- **API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api-docs

## 🔧 Admin Dashboard Features

### Automation Tools (One-Click)

1. **Sync EPD Data** - Pull latest environmental product declarations
2. **Match Suppliers** - Auto-match RFQs with qualified suppliers
3. **Send Notifications** - Process pending email/in-app notifications
4. **Update Certifications** - Verify supplier certifications
5. **Generate Reports** - Create analytics and performance reports

### Quick Actions

```bash
# Run automation via API
curl -X POST http://localhost:3001/api/admin/automation/sync-epds

# Or use the dashboard UI at /admin/dashboard
```

## 🗄️ Database Setup

### Supabase (Primary)

1. Create project at https://supabase.com
2. Run migrations:

```bash
cd supabase
supabase db push
```

3. Enable Row Level Security (RLS) policies
4. Product data stored in JSONB columns for flexibility

## 🔌 Integrations

### Intercom (Customer Support)

1. Sign up at https://app.intercom.com
2. Get App ID from Settings → Installation
3. Add to `.env`: `NEXT_PUBLIC_INTERCOM_APP_ID=your_app_id`
4. Widget auto-loads on all pages

### Email (Resend - Recommended)

1. Sign up at https://resend.com
2. Verify domain or use onboarding domain
3. Create API key
4. Add to `.env`: `RESEND_API_KEY=re_your_key`

## 🚢 Deploy to Production

### Vercel (Frontend + Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Backend Options

**Option 1: Railway**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd backend
railway up
```

**Option 2: Render**

- Connect GitHub repo
- Set build command: `cd backend && npm install`
- Set start command: `cd backend && npm start`

**Option 3: AWS Lambda**

- Use existing Lambda functions in `/lambda` directory
- Deploy via Terraform: `cd terraform && terraform apply`

## 🔐 Security Checklist

- [ ] Change all default secrets in `.env`
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS for production domains
- [ ] Set up rate limiting (already configured)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring (Sentry configured)

## 📈 Monitoring

### Built-in Tools

- **Logs**: `backend/logs/` directory
- **Sentry**: Error tracking (configure in `.env`)
- **Vercel Analytics**: Speed insights
- **Supabase Dashboard**: Database metrics

### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database connection
curl http://localhost:3001/api/health/db
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Database Connection Failed

1. Check `.env` credentials
2. Verify Supabase project is active
3. Test connection: `npm run test:db`

### Build Errors

```bash
# Clear caches
rm -rf node_modules .next frontend/dist frontend/node_modules backend/node_modules
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

## 📚 Next Steps

1. Configure data provider API keys (EC3, EPD International)
2. Set up OAuth providers (Google, GitHub, LinkedIn)
3. Import initial product data
4. Configure Stripe for payments
5. Set up automated backups

## 🤝 Support

- Documentation: `/docs` directory
- Issues: GitHub Issues
- Intercom: Chat widget (bottom right)
- Email: support@greenchainz.com
