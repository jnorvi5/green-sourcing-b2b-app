# GreenChainz Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
# From project root
vercel --prod
```

## 🔧 Environment Variables Setup

After deploying, configure these in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/greenchainz

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# Intercom
NEXT_PUBLIC_INTERCOM_APP_ID=your-intercom-app-id

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@greenchainz.com

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-assets

# Backend Service URL (if separate)
BACKEND_URL=https://your-backend.railway.app
```

### Optional Variables

```bash
# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Data Providers
EC3_API_KEY=your-ec3-api-key
EPD_INTERNATIONAL_API_KEY=your-epd-api-key

# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=your-sentry-dsn

# Redis (if using)
REDIS_URL=redis://your-redis-url
```

## 📦 What Gets Deployed

Vercel deploys:

- ✅ Next.js app (API routes + pages)
- ✅ Simple homepage (`/`) - Platform status and navigation
- ✅ Admin dashboard (`/admin/dashboard`)
- ✅ API endpoints (`/api/*`)
- ✅ Static assets
- ✅ Serverless functions

Not deployed (deploy separately):

- ❌ Backend Express server → Deploy to Railway/Render
- ❌ Frontend Vite app → Deploy to Vercel/Netlify separately or use Next.js version
- ❌ Marketing landing pages → Deploy `/cloudflare-landing/` to Cloudflare Pages

## 🏗️ Architecture Options

### Option 1: All-in-One (Recommended for MVP)

Deploy everything through Next.js on Vercel:

- Admin dashboard: `/admin/dashboard`
- API routes: `/api/*`
- Frontend: Migrate to Next.js pages or use as static export

**Pros:** Simple, single deployment, automatic scaling
**Cons:** Need to migrate Vite frontend to Next.js

### Option 2: Hybrid (Current Setup)

- **Vercel**: Next.js (admin dashboard + API routes)
- **Railway/Render**: Express backend
- **Vercel/Netlify**: Vite frontend (separate deployment)

**Pros:** Keep existing architecture
**Cons:** Multiple deployments, need to manage CORS

### Option 3: Microservices

- **Vercel**: Next.js frontend + admin
- **Railway**: Express API
- **AWS Lambda**: Background jobs (EPD sync, matching)
- **Supabase**: Database + Auth
- **MongoDB Atlas**: Product data

**Pros:** Scalable, separation of concerns
**Cons:** More complex, higher cost

## 🚂 Deploy Backend to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Get backend URL
railway domain

# Add to Vercel env vars as BACKEND_URL
```

## 🎯 Deploy Frontend Separately (Optional)

If keeping Vite frontend separate:

```bash
cd frontend

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
npm run build
netlify deploy --prod --dir=dist
```

## 🔗 Connect Services

### Update Frontend to Use Vercel API

In `frontend/src/config.ts`:

```typescript
export const API_URL =
  process.env.VITE_API_URL || "https://your-app.vercel.app/api";
```

### Update Backend CORS

In `backend/index.js`:

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: [
      "https://your-app.vercel.app",
      "https://your-frontend.vercel.app",
      "http://localhost:5173",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);
```

## 🔐 Vercel Secrets Management

### Add secrets via CLI:

```bash
# Add individual secrets
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production

# Pull secrets for local development
vercel env pull .env.local
```

### Add secrets via Dashboard:

1. Go to project settings
2. Navigate to Environment Variables
3. Add each variable
4. Select environments (Production, Preview, Development)
5. Save

## 📊 Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] OAuth redirect URIs updated
- [ ] CORS configured for production domains
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring enabled (Vercel Analytics)
- [ ] Error tracking configured (Sentry)
- [ ] Admin dashboard accessible
- [ ] API endpoints responding
- [ ] Intercom widget loading
- [ ] Email sending working
- [ ] File uploads to S3 working

## 🌐 Custom Domain Setup

1. Go to Vercel Dashboard → Domains
2. Add your domain: `greenchainz.com`
3. Add DNS records:

   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. Wait for DNS propagation (5-60 minutes)
5. SSL certificate auto-generated

## 🔍 Monitoring & Logs

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### Vercel Dashboard

- Analytics: Traffic, performance, Web Vitals
- Deployments: History, rollback capability
- Functions: Execution logs, errors
- Speed Insights: Performance metrics

## 🐛 Troubleshooting

### Build Fails

```bash
# Check build logs
vercel logs --build

# Test build locally
npm run build
```

### Environment Variables Not Working

- Ensure variables are set for correct environment (Production/Preview/Development)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### API Routes 404

- Check `vercel.json` configuration
- Ensure files are in `app/api/` directory
- Verify route exports are correct

### Backend Connection Failed

- Check `BACKEND_URL` environment variable
- Verify backend is deployed and running
- Test backend health endpoint
- Check CORS configuration

## 🚀 Continuous Deployment

Vercel auto-deploys on:

- Push to `main` branch → Production
- Push to other branches → Preview deployments
- Pull requests → Preview deployments

### Configure in Vercel Dashboard:

1. Settings → Git
2. Connect GitHub repository
3. Set production branch: `main`
4. Enable automatic deployments

## 📈 Scaling

Vercel automatically scales based on traffic:

- Serverless functions scale to zero
- Edge network caching
- Automatic DDoS protection
- Global CDN

### Upgrade Plan if Needed:

- **Hobby**: Free, good for MVP
- **Pro**: $20/month, custom domains, analytics
- **Enterprise**: Custom pricing, SLA, support

## 🎉 You're Live!

Your GreenChainz platform is now running on Vercel:

- **Production URL**: https://your-app.vercel.app
- **Admin Dashboard**: https://your-app.vercel.app/admin/dashboard
- **API**: https://your-app.vercel.app/api

Next steps:

1. Configure custom domain
2. Set up monitoring alerts
3. Run initial data sync
4. Test all automation features
5. Invite team members
