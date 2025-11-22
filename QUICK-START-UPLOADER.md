# 🚀 Quick Start Commands - GreenChainz Uploader Test

## Copy-Paste These Commands (PowerShell)

### **Terminal 1: Backend**

```powershell
# Navigate to backend
cd d:\perplexitydownloads\green-sourcing-b2b-app\backend

# Install new dependency
npm install

# Start backend server
npm start
```

**Keep this terminal open** - you should see:
```
Server running on port 3001
```

---

### **Terminal 2: Frontend**

```powershell
# Navigate to frontend (new terminal window)
cd d:\perplexitydownloads\green-sourcing-b2b-app\frontend

# Start dev server
npm run dev
```

**Keep this terminal open** - you should see:
```
Local: http://localhost:5173/
```

---

### **Browser Test**

Open: **http://localhost:5173/test/s3**

---

## If You Get Auth Error

**Quick Fix** (Dev Only):

Edit: `d:\perplexitydownloads\green-sourcing-b2b-app\backend\routes\presigned-upload.js`

Find this line (line 12):
```javascript
router.post('/', authenticateToken, async (req, res) => {
```

Change to:
```javascript
router.post('/', async (req, res) => {
```

Then restart backend (Ctrl+C, then `npm start`)

⚠️ **Re-enable auth after testing!**

---

## Required .env Variables

Minimum config in `d:\perplexitydownloads\green-sourcing-b2b-app\.env`:

```dotenv
# AWS
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
AWS_REGION=us-east-1
S3_BUCKET_NAME=greenchainz-assets

# Backend
PORT=3001
JWT_SECRET=any-random-string-here
FRONTEND_URL=http://localhost:5173

# Database (if backend needs it)
DB_USER=user
DB_PASSWORD=password
DB_NAME=greenchainz_dev
POSTGRES_HOST=localhost
```

---

## Success Indicators

✅ **Backend Terminal**: No error messages
✅ **Frontend Terminal**: Vite dev server running
✅ **Browser**: Glass-effect card with file input visible
✅ **Upload**: Spinner shows, then success alert
✅ **Preview**: Image appears with S3 URL

---

## Report Back

**Success Format:**
```
✅ It works!
Screenshot: [attach screenshot]
S3 URL: [paste the URL shown]
```

**Error Format:**
```
❌ Error at step X
Error message: [paste exact error]
Backend logs: [paste from terminal]
Frontend logs: [paste from browser console]
```
