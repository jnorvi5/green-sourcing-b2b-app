# Landing Page Setup Complete! 🚀

Your GreenChainz landing page is ready to capture the Founding 50 members.

## ✅ What's Been Done

1. **Landing Page Created** (`app/page.tsx`)

   - High-conversion design with "Founding 50" messaging
   - Email capture form
   - Value propositions and trust indicators
   - Mobile-responsive design

2. **API Endpoint Updated** (`app/api/email/subscribe/route.ts`)

   - Saves emails to Supabase
   - Handles duplicates gracefully
   - Returns proper success/error messages

3. **Supabase Configuration**
   - Environment variables updated in `.env` and `frontend/.env`
   - MCP server configured for database access

## 🔧 Setup Steps

### 1. Create the Subscribers Table in Supabase

Run this SQL in your Supabase SQL Editor:
https://app.supabase.com/project/jfexzdhacbguleutgdwq/sql

```sql
-- Create subscribers table for landing page email capture
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'landing_page',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from anyone (for public signup)
CREATE POLICY "Allow public inserts" ON subscribers
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow authenticated reads
CREATE POLICY "Allow authenticated reads" ON subscribers
    FOR SELECT
    USING (auth.role() = 'authenticated');
```

### 2. Update Vercel Environment Variables

Go to: https://vercel.com/your-project/settings/environment-variables

Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://jfexzdhacbguleutgdwq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZXh6ZGhhY2JndWxldXRnZHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTI4OTYsImV4cCI6MjA3ODIyODg5Nn0.ON2VrRQVyvxMEMS9w99V6QsQO1G2-c1bgtawe_zegKo
```

Select: **Production**, **Preview**, and **Development**

### 3. Deploy

```bash
git add .
git commit -m "Add landing page and email capture"
git push
```

Vercel will auto-deploy!

## 🎯 What Happens Now

1. **Visitors land on your page** → See the "Founding 50" pitch
2. **They enter their email** → Saved to Supabase `subscribers` table
3. **Success message** → "Welcome to the Founding 50! Check your email."

## 📊 View Your Subscribers

Go to Supabase Table Editor:
https://app.supabase.com/project/jfexzdhacbguleutgdwq/editor

Select the `subscribers` table to see all signups!

## 🚀 Next Steps

1. **Test locally**: `npm run dev` and visit http://localhost:3000
2. **Create the table** in Supabase (SQL above)
3. **Update Vercel env vars**
4. **Push to deploy**
5. **Share your link** and start collecting the Founding 50!

## 🔍 Troubleshooting

**"Failed to subscribe" error:**

- Make sure you created the `subscribers` table in Supabase
- Check that environment variables are set in Vercel

**White screen:**

- Check browser console for errors
- Verify Supabase credentials are correct

**Need help?**

- Check Supabase logs: https://app.supabase.com/project/jfexzdhacbguleutgdwq/logs
- Check Vercel logs: https://vercel.com/your-project/logs
