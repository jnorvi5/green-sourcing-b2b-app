# Admin Dashboard Guide

**Last Updated:** December 7, 2025  
**Status:** Active Development

---

## Overview

The GreenChainz Admin Dashboard provides a centralized interface for platform administrators to monitor system health, manage users, and run automated maintenance tasks.

**Location:** `/app/admin/dashboard/page.tsx`  
**Access URL:** `http://localhost:3001/admin/dashboard` (dev) or `https://yourdomain.com/admin/dashboard` (prod)

---

## Features

### 1. System Overview Dashboard

Real-time statistics displayed in card format:

- **Total Users**: Count of all registered users
- **Suppliers**: Number of supplier accounts
- **Buyers**: Number of buyer accounts
- **RFQs**: Total request for quotes submitted

Data is fetched from Supabase tables on page load and refreshes when automation tasks complete.

### 2. Automation Tools

One-click buttons to trigger common maintenance tasks:

#### Sync EPD Data

- **Purpose**: Pull latest Environmental Product Declarations from data providers
- **Backend Route**: `POST /api/data-providers/sync`
- **Service**: Backend data provider integrations
- **Use Case**: Weekly data refresh from EPD International, WAP Sustainability, Building Transparency

#### Run Supplier Matching

- **Purpose**: Match pending RFQs with qualified suppliers based on capabilities
- **Backend Route**: `POST /api/matchmaker/run`
- **Service**: `matchmakerService.js`
- **Use Case**: Daily automated matching or manual trigger for urgent RFQs

#### Send Notifications

- **Purpose**: Process pending notification queue (emails, in-app alerts)
- **Backend Route**: `POST /api/notifications/process`
- **Service**: `notificationService.ts`
- **Use Case**: Batch send notifications or retry failed sends

#### Update Certifications

- **Purpose**: Verify and update supplier certifications (LEED, FSC, etc.)
- **Backend Route**: `POST /api/certifier/verify-all`
- **Service**: `certifierService.js`
- **Use Case**: Monthly certification verification or pre-audit checks

#### Generate Reports

- **Purpose**: Create weekly analytics reports for stakeholders
- **Backend Route**: `POST /api/reports/generate`
- **Service**: To be implemented
- **Use Case**: Weekly business intelligence reports

### 3. Tabbed Interface

Navigation tabs for different admin functions:

- **Overview**: System health and statistics
- **Automation**: One-click automation tools (described above)
- **Users**: User management (coming soon)
- **Suppliers**: Supplier approval and monitoring (coming soon)
- **RFQs**: Quote request management (coming soon)

---

## Technical Architecture

### Frontend Component

**File:** `/app/admin/dashboard/page.tsx`

**Tech Stack:**

- Next.js 14 App Router (client component)
- React hooks (useState, useEffect)
- Supabase client for data fetching
- Tailwind CSS for styling

**Key Functions:**

```typescript
loadDashboardData(); // Fetches stats from Supabase
runAutomation(type); // Triggers backend automation via API
```

### Backend API Routes

**File:** `/app/api/admin/automation/[type]/route.ts`

**Supported Types:**

- `sync-epds`
- `match-suppliers`
- `send-notifications`
- `update-certifications`
- `generate-reports`

**Flow:**

1. Admin clicks button in dashboard
2. Frontend calls `/api/admin/automation/{type}`
3. Next.js API route validates admin auth
4. Route proxies request to backend Express server
5. Backend service executes task
6. Response returned to frontend
7. Dashboard refreshes stats

### Backend Services

**File:** `/backend/routes/automation.js`

**Express Routes:**

- `POST /api/matchmaker/run` → `matchmakerService.matchAllPendingRFQs()`
- `POST /api/certifier/verify-all` → `certifierService.verifyAllCertifications()`
- `POST /api/data-providers/sync` → Data provider sync logic
- `POST /api/notifications/process` → Notification processing
- `POST /api/reports/generate` → Report generation

---

## Authentication & Authorization

### Current Implementation

**Authentication:** Supabase Auth

- Admin must be logged in to access dashboard
- Session validated via `supabase.auth.getUser()`

**Authorization:** Basic check

- Currently checks if user is authenticated
- Returns 401 if no valid session

### Recommended Enhancements

**Role-Based Access Control (RBAC):**

```typescript
// Check if user has admin role
const { data: profile } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();

if (profile?.role !== "admin") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**Database Schema:**

```sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'buyer';
-- Possible values: 'admin', 'supplier', 'buyer'
```

---

## Usage Guide

### Accessing the Dashboard

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to admin dashboard:**

   ```
   http://localhost:3001/admin/dashboard
   ```

3. **Log in with admin credentials:**
   - Must have valid Supabase session
   - Recommended: Create dedicated admin user

### Running Automation Tasks

1. Click the **Automation** tab
2. Select the automation you want to run
3. Click **Run Now** button
4. Wait for confirmation alert
5. Dashboard stats will refresh automatically

### Monitoring System Health

1. View the **Overview** tab
2. Check stat cards for anomalies:
   - Sudden drops in user counts
   - Spike in pending RFQs
   - Low supplier/buyer ratios
3. Use automation tools to address issues

---

## Development Notes

### Adding New Automation Tasks

**Step 1: Add backend route**

```javascript
// backend/routes/automation.js
router.post("/new-task/run", async (req, res) => {
  try {
    const results = await newTaskService.execute();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: "Task failed" });
  }
});
```

**Step 2: Add API proxy**

```typescript
// app/api/admin/automation/[type]/route.ts
case 'new-task':
  await executeNewTask();
  break;

async function executeNewTask() {
  const response = await fetch(`${process.env.BACKEND_URL}/api/new-task/run`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Task failed');
}
```

**Step 3: Add UI button**

```typescript
// app/admin/dashboard/page.tsx
const automations = [
  // ... existing automations
  {
    id: "new-task",
    name: "New Task",
    description: "Description of what it does",
  },
];
```

### Extending Dashboard Tabs

**Create new tab component:**

```typescript
function NewTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">New Feature</h2>
      {/* Your content here */}
    </div>
  );
}
```

**Add to tab navigation:**

```typescript
{['overview', 'automation', 'users', 'suppliers', 'rfqs', 'new-tab'].map((tab) => (
  // ... tab button
))}

{activeTab === 'new-tab' && <NewTab />}
```

---

## Troubleshooting

### Dashboard Won't Load

**Symptom:** Blank page or loading spinner never disappears

**Possible Causes:**

1. Supabase connection issue
2. Missing environment variables
3. Database tables don't exist

**Solutions:**

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase tables exist
# In Supabase dashboard: Table Editor → Check for users, suppliers, buyers, rfqs

# Check browser console for errors
# Open DevTools → Console tab
```

### Automation Tasks Fail

**Symptom:** Alert shows "Error running {type} automation"

**Possible Causes:**

1. Backend server not running
2. Backend route not implemented
3. Service dependencies missing

**Solutions:**

```bash
# Verify backend is running
cd backend
npm start

# Check backend logs
tail -f backend/logs/app.log

# Test backend route directly
curl -X POST http://localhost:3001/api/matchmaker/run
```

### Stats Show Zero

**Symptom:** All stat cards display 0

**Possible Causes:**

1. Empty database (expected in dev)
2. Supabase query error
3. Table permissions issue

**Solutions:**

```bash
# Seed database with test data
cd frontend
npm run seed

# Check Supabase RLS policies
# In Supabase dashboard: Authentication → Policies
# Ensure admin can read all tables

# Check browser network tab
# Look for failed API requests
```

### Unauthorized Error (401)

**Symptom:** "Unauthorized" error when accessing dashboard

**Possible Causes:**

1. Not logged in
2. Session expired
3. Invalid credentials

**Solutions:**

1. Navigate to `/login` and sign in
2. Clear browser cookies and re-login
3. Check Supabase Auth settings

---

## Security Considerations

### Current Security Measures

✅ **Authentication Required**: Must be logged in to access  
✅ **HTTPS in Production**: Vercel provides SSL/TLS  
✅ **CORS Protection**: Next.js API routes have CORS enabled  
✅ **Environment Variables**: Secrets stored securely

### Recommended Enhancements

⚠️ **Add Role-Based Access Control (RBAC)**

- Verify user has 'admin' role before allowing access
- Implement in both frontend and backend

⚠️ **Add Audit Logging**

- Log all automation task executions
- Track who ran what and when
- Store in `admin_audit_log` table

⚠️ **Add Rate Limiting**

- Prevent automation task spam
- Limit to X executions per hour per admin

⚠️ **Add Confirmation Dialogs**

- Require confirmation before running destructive tasks
- Show preview of what will be affected

**Example Audit Log Schema:**

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Future Enhancements

### Planned Features

1. **Real-Time Updates**

   - WebSocket connection for live stats
   - Auto-refresh without page reload
   - Live notification feed

2. **Advanced Analytics**

   - Charts and graphs (Chart.js or Recharts)
   - Trend analysis over time
   - Supplier performance metrics

3. **User Management**

   - View all users in table
   - Edit user roles
   - Suspend/activate accounts
   - Bulk actions

4. **Supplier Management**

   - Approve pending supplier applications
   - View supplier profiles
   - Manage certifications
   - Performance ratings

5. **RFQ Management**

   - View all RFQs in table
   - Filter by status, date, buyer
   - Manually assign to suppliers
   - Track response rates

6. **Scheduled Automations**

   - Cron-like scheduling for tasks
   - Set recurring automations
   - Email reports on completion

7. **System Health Monitoring**
   - API uptime checks
   - Database performance metrics
   - Error rate tracking
   - Alert thresholds

---

## Related Documentation

- **Backend Automation Routes**: `/backend/routes/automation.js`
- **Matchmaker Service**: `/backend/services/matchmakerService.js`
- **Certifier Service**: `/backend/services/certifierService.js`
- **Notification Service**: `/lib/notificationService.ts`
- **Supabase Setup**: `/docs/SUPABASE-AUTH-WEBHOOK-SETUP.md`
- **RBAC Implementation**: `/docs/RBAC-IMPLEMENTATION.md`

---

## Quick Reference

### URLs

- **Dev**: `http://localhost:3001/admin/dashboard`
- **Prod**: `https://yourdomain.com/admin/dashboard`

### Key Files

- Frontend: `/app/admin/dashboard/page.tsx`
- API Routes: `/app/api/admin/automation/[type]/route.ts`
- Backend: `/backend/routes/automation.js`

### Common Commands

```bash
# Start dev server
npm run dev

# Seed test data
cd frontend && npm run seed

# Check backend logs
cd backend && tail -f logs/app.log

# Test automation endpoint
curl -X POST http://localhost:3001/api/admin/automation/sync-epds
```

---

**Questions or Issues?** Check the troubleshooting section or review related documentation files.
