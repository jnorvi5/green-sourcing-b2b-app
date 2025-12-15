# 🚀 GreenChainz Quick Start

## Deploy to Vercel in 3 Steps

### 1. One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/greenchainz)

Or manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 2. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

**Required (Minimum to Start):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/greenchainz
JWT_SECRET=your-random-secret-min-32-chars
SESSION_SECRET=your-random-secret-min-32-chars
```

**Recommended:**

```bash
NEXT_PUBLIC_INTERCOM_APP_ID=your-intercom-app-id
RESEND_API_KEY=re_your_resend_api_key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-assets
```

### 3. Access Your Platform

- **Admin Dashboard**: `https://your-app.vercel.app/admin/dashboard`
- **API Health**: `https://your-app.vercel.app/api/health`
- **Homepage**: `https://your-app.vercel.app`

## 🎯 What You Get

✅ **Simple Homepage** - Platform status and navigation hub
✅ **Admin Dashboard** - Manage everything from one place
✅ **Automation Tools** - One-click data sync, matching, notifications
✅ **API Routes** - RESTful API for all operations
✅ **Intercom Support** - Customer chat widget
✅ **Authentication** - Supabase Auth with OAuth
✅ **Database** - Supabase (PostgreSQL) + MongoDB
✅ **File Storage** - AWS S3 integration
✅ **Email** - Resend for transactional emails
✅ **Monitoring** - Built-in health checks

**Note:** The root homepage (`/`) is a minimal status page. Full marketing landing pages are in `/cloudflare-landing/` for separate deployment.

## 🔧 Local Development

```bash
# Clone repo
git clone https://github.com/yourusername/greenchainz
cd greenchainz

# Install dependencies
npm install

# Copy environment file
cp .env.updated .env
# Edit .env with your credentials

# Start development server
npm run dev

# Open admin dashboard
open http://localhost:3001/admin/dashboard
```

## 📊 Admin Dashboard Features

### One-Click Automations

1. **Sync EPD Data** - Pull latest environmental product declarations
2. **Match Suppliers** - Auto-match RFQs with qualified suppliers
3. **Send Notifications** - Process pending notifications
4. **Update Certifications** - Verify supplier certifications
5. **Generate Reports** - Create analytics reports

### Management Tabs

- **Overview** - System health and metrics
- **Automation** - Run automated tasks
- **Users** - Manage user accounts
- **Suppliers** - Approve and manage suppliers
- **RFQs** - View and manage quote requests

## 🗄️ Database Setup

### Supabase (5 minutes)

1. Create project at [supabase.com](https://supabase.com)
2. Copy URL and keys to Vercel env vars
3. Run migrations:
   ```bash
   cd supabase
   npx supabase db push
   ```

### MongoDB Atlas (5 minutes)

1. Create cluster at [mongodb.com](https://cloud.mongodb.com)
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (for serverless)
4. Copy connection string to Vercel env vars

## 🔌 Optional Integrations

### Intercom (Customer Support)

1. Sign up at [intercom.com](https://app.intercom.com)
2. Get App ID from Settings → Installation
3. Add to Vercel: `NEXT_PUBLIC_INTERCOM_APP_ID`

### Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Add to Vercel: `RESEND_API_KEY`

### AWS S3 (File Storage)

1. Create S3 bucket
2. Create IAM user with S3 permissions
3. Add credentials to Vercel env vars

## 🚂 Deploy Backend Separately (Optional)

If you need the Express backend for additional services:

```bash
# Deploy to Railway
cd backend
railway init
railway up

# Get URL and add to Vercel
# BACKEND_URL=https://your-backend.railway.app
```

## ✅ Post-Deployment Checklist

- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Admin dashboard accessible
- [ ] API health check passing
- [ ] Database connections working
- [ ] Intercom widget loading
- [ ] Email sending configured
- [ ] File uploads working
- [ ] OAuth providers configured (optional)
- [ ] Custom domain configured (optional)

## 🆘 Troubleshooting

### Deployment Failed

```bash
# Check build logs
vercel logs --build

# Test build locally
npm run build
```

### Can't Access Admin Dashboard

1. Check deployment URL is correct
2. Verify environment variables are set
3. Check browser console for errors
4. Test API health: `/api/health`

### Database Connection Error

1. Verify Supabase URL and keys
2. Check MongoDB connection string
3. Ensure IP whitelist includes `0.0.0.0/0`
4. Test connections in health check

### Automation Not Working

1. Check backend is deployed (if using separate backend)
2. Verify `BACKEND_URL` environment variable
3. Check API logs in Vercel dashboard
4. Test individual endpoints

## 📚 Next Steps

1. ✅ Platform deployed and running
2. 🔐 Configure OAuth providers (Google, GitHub, LinkedIn)
3. 📊 Import initial product data
4. 🔑 Set up data provider API keys (EC3, EPD International)
5. 💳 Configure Stripe for payments (optional)
6. 🌐 Add custom domain
7. 📧 Set up email templates
8. 👥 Invite team members
9. 🎨 Customize branding
10. 🚀 Launch!

## 🤝 Support

- **Documentation**: See `/docs` directory
- **Issues**: GitHub Issues
- **Chat**: Intercom widget (bottom right)
- **Email**: support@greenchainz.com

---

**You're ready to go! 🎉**

Your GreenChainz platform is live on Vercel with full admin automation capabilities.
