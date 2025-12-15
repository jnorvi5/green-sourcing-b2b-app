# 🚀 Start GreenChainz from Vercel

## One-Command Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

That's it! Your platform is live.

## 🎯 What You Get Instantly

✅ **Admin Dashboard** - https://your-app.vercel.app/admin/dashboard
✅ **API Endpoints** - https://your-app.vercel.app/api/*
✅ **Health Check** - https://your-app.vercel.app/api/health
✅ **Homepage** - https://your-app.vercel.app
✅ **Auto-scaling** - Handles traffic spikes automatically
✅ **Global CDN** - Fast worldwide
✅ **SSL/HTTPS** - Automatic certificates
✅ **CI/CD** - Auto-deploy on git push

## ⚡ Quick Setup (5 Minutes)

### 1. Deploy

```bash
vercel --prod
```

### 2. Add Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables:

**Minimum Required:**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/greenchainz
JWT_SECRET=your-random-secret-32-chars-min
SESSION_SECRET=your-random-secret-32-chars-min
```

**Recommended:**

```
NEXT_PUBLIC_INTERCOM_APP_ID=your-intercom-app-id
RESEND_API_KEY=re_your_resend_api_key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-assets
```

### 3. Redeploy

```bash
vercel --prod
```

## 🎉 You're Live!

Access your platform:

- **Admin**: https://your-app.vercel.app/admin/dashboard
- **API**: https://your-app.vercel.app/api/health

## 🔧 Admin Dashboard Features

All accessible from `/admin/dashboard`:

1. **Sync EPD Data** - One-click data sync from providers
2. **Match Suppliers** - Auto-match RFQs with suppliers
3. **Send Notifications** - Process pending notifications
4. **Update Certifications** - Verify supplier certs
5. **Generate Reports** - Create analytics reports

## 🗄️ Database Setup

### Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and keys to Vercel env vars
4. Done! Tables auto-created on first use

### MongoDB (2 minutes)

1. Go to [mongodb.com](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Copy connection string to Vercel env vars

## 🔌 Optional Services

### Intercom (Customer Support)

1. Sign up at [intercom.com](https://app.intercom.com)
2. Get App ID
3. Add to Vercel: `NEXT_PUBLIC_INTERCOM_APP_ID`

### Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Add to Vercel: `RESEND_API_KEY`

### AWS S3 (File Storage)

1. Create S3 bucket
2. Create IAM user with S3 access
3. Add credentials to Vercel env vars

## 🚂 Deploy Backend (Optional)

If you need the Express backend for additional services:

```bash
# Deploy to Railway
cd backend
railway init
railway up

# Add backend URL to Vercel
# BACKEND_URL=https://your-backend.railway.app
```

## 📊 Architecture

**What Runs on Vercel:**

- Next.js app (admin dashboard, pages)
- API routes (all `/api/*` endpoints)
- Serverless functions
- Static assets

**What Runs Elsewhere:**

- Supabase: Database + Auth
- MongoDB Atlas: Product data
- Railway/Render: Express backend (optional)
- AWS S3: File storage

## 🔄 Auto-Deploy Setup

1. Connect GitHub repo in Vercel Dashboard
2. Push to `main` branch → Auto-deploys to production
3. Push to other branches → Preview deployments
4. Pull requests → Automatic preview URLs

## 🌐 Custom Domain

1. Vercel Dashboard → Domains
2. Add domain: `greenchainz.com`
3. Update DNS:
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```
4. Wait 5-60 minutes for DNS propagation
5. SSL auto-configured

## 📈 Monitoring

Built-in Vercel features:

- **Analytics** - Traffic, performance, Web Vitals
- **Logs** - Real-time function logs
- **Speed Insights** - Performance metrics
- **Deployments** - History with rollback

View logs:

```bash
vercel logs --follow
```

## 🐛 Troubleshooting

### Build Failed

```bash
# Test locally first
npm run build

# Check logs
vercel logs --build
```

### Environment Variables Not Working

- Redeploy after adding variables
- Check variable names (case-sensitive)
- Ensure set for correct environment

### API Routes 404

- Check files are in `app/api/` directory
- Verify exports are correct
- Check `vercel.json` configuration

### Database Connection Failed

- Verify environment variables
- Check Supabase project is active
- Ensure MongoDB IP whitelist includes `0.0.0.0/0`

## ✅ Post-Deploy Checklist

- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Admin dashboard accessible
- [ ] API health check passing (`/api/health`)
- [ ] Database connections working
- [ ] Intercom widget loading
- [ ] Email sending configured
- [ ] File uploads working
- [ ] Custom domain configured (optional)

## 🚀 Next Steps

1. ✅ Platform deployed on Vercel
2. 🔐 Configure OAuth providers (Google, GitHub, LinkedIn)
3. 📊 Import initial product data
4. 🔑 Set up data provider API keys (EC3, EPD International)
5. 💳 Configure Stripe for payments (optional)
6. 🌐 Add custom domain
7. 📧 Set up email templates
8. 👥 Invite team members
9. 🎨 Customize branding
10. 🚀 Launch!

## 💡 Pro Tips

- Use Vercel CLI for faster deployments: `vercel --prod`
- Preview deployments for testing: `vercel` (without --prod)
- Pull env vars locally: `vercel env pull .env.local`
- View real-time logs: `vercel logs --follow`
- Rollback if needed: Vercel Dashboard → Deployments → Promote

## 🤝 Support

- **Docs**: See `VERCEL-SETUP.md` for detailed guide
- **Issues**: GitHub Issues
- **Chat**: Intercom widget (bottom right)
- **Email**: support@greenchainz.com

---

**Your GreenChainz platform is live on Vercel! 🎉**

Everything runs from Vercel with full automation capabilities.
