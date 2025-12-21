# 🚀 Deploy GreenChainz to Vercel NOW

## ✅ Everything is Ready!

Your platform has:

- ✅ Admin dashboard with automation
- ✅ OAuth login (Google, GitHub, LinkedIn)
- ✅ Email/password login
- ✅ Supabase integration
- ✅ Intercom support widget
- ✅ API routes
- ✅ Health checks
- ✅ Auto-scaling configured

## Deploy in 2 Minutes

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Step 2: Add Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Copy these (minimum required):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-32-chars-minimum
SESSION_SECRET=your-random-secret-32-chars-minimum
```

**Optional but recommended:**

```bash
NEXT_PUBLIC_INTERCOM_APP_ID=your-intercom-app-id
RESEND_API_KEY=re_your_resend_api_key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=greenchainz-assets
```

### Step 3: Redeploy

```bash
vercel --prod
```

## 🎉 You're Live!

Access your platform:

- **Homepage**: https://your-app.vercel.app
- **Login**: https://your-app.vercel.app/login
- **Admin Dashboard**: https://your-app.vercel.app/admin/dashboard
- **API Health**: https://your-app.vercel.app/api/health

## 🔐 Configure OAuth (Optional)

To enable Google/GitHub/LinkedIn login:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable each provider you want
3. Add OAuth credentials from:
   - Google: https://console.cloud.google.com/apis/credentials
   - GitHub: https://github.com/settings/developers
   - LinkedIn: https://www.linkedin.com/developers/apps
4. Set callback URL: `https://your-project.supabase.co/auth/v1/callback`

See `VERCEL-AUTH-SETUP.md` for detailed instructions.

## 🧪 Test Your Deployment

### 1. Check Health

```bash
curl https://your-app.vercel.app/api/health
```

Should return:

```json
{
  "status": "healthy",
  "services": {
    "api": "operational",
    "database": "connected"
  }
}
```

### 2. Test Login

Go to: https://your-app.vercel.app/login

Try:

- OAuth buttons (Google, GitHub, LinkedIn)
- Email/password login
- Demo account buttons

### 3. Access Admin Dashboard

Go to: https://your-app.vercel.app/admin/dashboard

Test automation buttons:

- Sync EPD Data
- Match Suppliers
- Send Notifications
- Update Certifications
- Generate Reports

## 📊 What's Running on Vercel

**Frontend:**

- Homepage with platform overview
- Login page with OAuth + email/password
- Admin dashboard with automation tools
- All existing pages (signup, dashboards, etc.)

**Backend:**

- API routes (`/api/*`)
- Admin automation endpoints
- Health checks
- Proxy to backend services (if needed)

**Integrations:**

- Supabase: Auth + Database + Product data
- Intercom: Support widget
- Resend: Emails
- AWS S3: File storage

## 🔄 Auto-Deploy Setup

Connect GitHub for automatic deployments:

1. Vercel Dashboard → Your Project → Settings → Git
2. Connect GitHub repository
3. Set production branch: `main`
4. Enable automatic deployments

Now every push to `main` auto-deploys to production!

## 🌐 Add Custom Domain (Optional)

1. Vercel Dashboard → Domains
2. Add domain: `greenchainz.com`
3. Update DNS:
   ```
   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```
4. Wait 5-60 minutes
5. SSL auto-configured

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
- Check spelling (case-sensitive)
- Ensure set for "Production" environment

### Login Not Working

- Check Supabase URL and keys
- Verify OAuth providers are enabled in Supabase
- Check browser console for errors

### Admin Dashboard 401 Error

- Ensure user is authenticated
- Check Supabase session is valid
- Verify API routes have correct auth

## ✅ Post-Deploy Checklist

- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] Login page accessible
- [ ] OAuth buttons working (if configured)
- [ ] Admin dashboard accessible
- [ ] Automation buttons working
- [ ] Database connections working
- [ ] Intercom widget loading
- [ ] Custom domain configured (optional)

## 🚀 You're Ready!

Your GreenChainz platform is now live on Vercel with:

- Full authentication (OAuth + email/password)
- Admin dashboard with one-click automation
- Auto-scaling serverless architecture
- Global CDN for fast performance
- Automatic SSL/HTTPS
- CI/CD ready

**Next steps:**

1. Configure OAuth providers
2. Import initial data
3. Invite team members
4. Start onboarding suppliers and buyers
5. Launch! 🎉
