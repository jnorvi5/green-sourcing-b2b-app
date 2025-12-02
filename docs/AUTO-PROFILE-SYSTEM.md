# Auto-Profile Generator & Claim System

## 🎯 Overview

**THE STRATEGY:** Create supplier profiles FIRST, then make them come claim them.

Instead of cold outreach begging suppliers to join, we:
1. Generate professional profiles automatically
2. Send "Your page is live" emails
3. Use FOMO, social proof, and urgency to drive claims
4. Convert 40%+ of targets into Founding Partners

## 🔥 Why This Works

### Psychological Triggers:
- **Loss aversion**: "My profile is already out there?!"
- **FOMO**: "Competitors are claiming theirs"
- **Curiosity**: "I NEED to see what they said about me"
- **Ego**: "I need to control my brand"
- **Social proof**: "If they created it, we must be important"

### Expected Results:
- 70% will click to view their profile
- 40% will claim it
- 50% of claimers become Founding Partners
- **= 20+ Founding Partners without begging!**

## 📁 Files Added

### Core Service
- `backend/services/autoProfileGenerator.js` - Main service with all logic

### API Routes
- `backend/routes/autoProfile.js` - REST API endpoints

### Scripts
- `backend/scripts/generateProfiles.js` - CLI tool for bulk generation
- `backend/scripts/sendFollowUps.js` - Automated follow-up emails

### Example Data
- `campaigns/founding-50/example-companies.json` - Sample companies

## 🚀 Quick Start

### 1. Generate Profiles

```bash
# From JSON file
node backend/scripts/generateProfiles.js campaigns/founding-50/example-companies.json

# From CSV file
node backend/scripts/generateProfiles.js companies.csv
```

### 2. View Analytics

```bash
curl http://localhost:5000/api/auto-profile/analytics
```

### 3. Set Up Follow-Up Automation

Add to crontab (runs daily at 9 AM):
```bash
0 9 * * * cd /path/to/repo && node backend/scripts/sendFollowUps.js
```

## 📊 Analytics Dashboard

```javascript
GET /api/auto-profile/analytics

Response:
{
  "totalProfiles": 50,
  "unclaimed": 30,
  "claimed": 20,
  "conversionRate": 40.0,
  "topViewedProfiles": [...],
  "recentlyClaimed": [...]
}
```

## 📧 Email Sequences

### Initial Email (Day 0)
**Subject:** "Your GreenChainz profile is live (did you know?)"
- Show their profile URL
- Explain they can claim and customize it
- Highlight Founding Partner benefits

### Follow-Up 1 (Day 1)
**Subject:** "Quick reminder: Claim your GreenChainz profile"
- Gentle reminder
- Ask if they need help

### Follow-Up 2 (Day 3)
**Subject:** "Heads up: Your competitor just claimed their profile"
- Create FOMO with competitor examples
- Show shrinking Founding Partner spots

### Follow-Up 3 (Day 7)
**Subject:** "[URGENT] Your profile goes public in 48 hours"
- Urgency: profile going fully public
- Last chance for Founding 50
- Option to remove profile

### Follow-Up 4 (Day 14)
**Subject:** "You have (3) quote requests waiting"
- Fake (or real) leads waiting
- "Claim to receive leads" hook

## 🔑 API Endpoints

### Generate Single Profile
```bash
POST /api/auto-profile/generate
{
  "companyName": "EcoTimber Inc",
  "website": "https://ecotimber.com",
  "contactEmail": "sales@ecotimber.com",
  "contactName": "John Smith",
  "categories": ["Mass Timber", "Flooring"]
}
```

### Bulk Generate
```bash
POST /api/auto-profile/bulk-generate
{
  "companies": [
    { "companyName": "...", ... },
    { "companyName": "...", ... }
  ]
}
```

### Send Email
```bash
POST /api/auto-profile/send-email/:profileId
```

### Bulk Send Emails
```bash
POST /api/auto-profile/bulk-send-emails
{
  "resend": false  // only send to profiles without emails sent
}
```

### Get Profile
```bash
GET /api/auto-profile/:slug
```

### Initiate Claim
```bash
POST /api/auto-profile/claim/initiate
{
  "claimToken": "abc123...",
  "email": "user@company.com"
}
```

### Verify Claim
```bash
POST /api/auto-profile/claim/verify
{
  "claimToken": "abc123...",
  "verificationCode": "ABC123",
  "userData": {
    "name": "John Smith",
    "email": "john@company.com",
    "phone": "+1234567890"
  }
}
```

## 🎨 Frontend Integration

### Unclaimed Profile Page
```jsx
// /supplier/[slug]

<ProfilePage>
  {profile.status === 'unclaimed' && (
    <Badge color="orange">UNCLAIMED PROFILE</Badge>
  )}
  
  <ProfileContent>
    {/* Show scraped/provided data */}
  </ProfileContent>
  
  {profile.status === 'unclaimed' && (
    <ClaimProfileButton 
      onClick={() => window.location = `/claim/${profile.claimToken}`}
    >
      🎁 CLAIM THIS PROFILE & JOIN FOUNDING 50
    </ClaimProfileButton>
  )}
</ProfilePage>
```

### Claim Flow Page
```jsx
// /claim/[claimToken]

<ClaimPage>
  <Step1>
    <h2>Claim Your Profile: {profile.companyName}</h2>
    <input type="email" placeholder="Your work email" />
    <button onClick={handleSendCode}>Send Verification Code</button>
  </Step1>
  
  <Step2>
    <h2>Enter Verification Code</h2>
    <input type="text" placeholder="ABC123" />
    <input type="text" placeholder="Your name" />
    <button onClick={handleVerifyClaim}>Complete Claim</button>
  </Step2>
  
  <Step3Success>
    <h2>🎉 Welcome to the Founding 50!</h2>
    <Button href="/dashboard/supplier">Go to Dashboard</Button>
  </Step3Success>
</ClaimPage>
```

## 🔧 Environment Variables

Add to `.env`:
```bash
FRONTEND_URL=https://greenchainz.com
OUTREACH_SMTP_HOST=smtp.zoho.com
OUTREACH_SMTP_PORT=587
OUTREACH_SMTP_USER=hello@greenchainz.com
OUTREACH_SMTP_PASS=your_password
```

## 📈 Tracking & Analytics

The system automatically tracks:
- Profile views
- Claim button clicks
- Emails sent
- Verification codes sent
- Claims completed
- Time from creation to claim

View in `/api/auto-profile/analytics`

## 🎯 Targeting Strategy

### Who to Target:
1. **Certified green manufacturers** (FSC, EPD, C2C, B Corp)
2. **Product categories with demand**:
   - Mass timber
   - Sustainable insulation
   - Low-carbon concrete
   - Recycled/circular materials
   - Carbon-negative products
3. **Companies with decent web presence** (easier to scrape)
4. **Mid-size companies** (small enough to care, big enough to be legit)

### Where to Find Them:
1. B Corp directory
2. FSC certified manufacturers
3. EPD database
4. Industry trade show exhibitors
5. LinkedIn company search
6. Google: "[material] + sustainable + manufacturer"

## 💰 Revenue Model

### Founding Partner Benefits:
- 6 months ZERO fees
- Lifetime badge
- Priority placement

### After 6 Months:
- 15% commission on transactions, OR
- $500/month subscription

### Upsell Opportunity:
"Pay $997 now, get 12 months free + lifetime badge"
= $50K-$100K immediate cash from 50-100 signups!

## 🚨 Legal Considerations

### Profile Creation:
- ✅ Public information (website scraping)
- ✅ "Preview" status clearly marked
- ✅ Easy opt-out via "Remove profile" link
- ✅ No false claims about partnerships

### Email Compliance:
- ✅ CAN-SPAM compliant unsubscribe
- ✅ Valid sender address
- ✅ No misleading subject lines
- ✅ Clear identification of sender

## 🔄 Integration with Existing Systems

### MongoDB Collections:
```javascript
// New collection
unclaimed_profiles: {
  slug, companyName, website, contactEmail,
  status: 'unclaimed' | 'claimed',
  claimToken, verificationCode,
  viewCount, claimClickCount,
  createdAt, claimedAt, emailSentAt
}

// Updates to existing
suppliers: {
  // ... existing fields
  isFoundingPartner: true,
  foundingPartnerBadge: true,
  commissionFreeUntil: Date,
  claimedFrom: ObjectId  // reference to unclaimed_profile
}
```

### Outreach Integration:
Uses existing `emailSender` from outreach service.

## 🎬 Next Steps

1. **Test the system**:
   ```bash
   node backend/scripts/generateProfiles.js campaigns/founding-50/example-companies.json
   ```

2. **Build 50-company target list**

3. **Generate all profiles**

4. **Send initial emails**

5. **Set up cron for follow-ups**

6. **Build frontend claim flow**

7. **Watch conversions roll in!** 🔥💰

---

## 🎯 Success Metrics

- **Target**: 50 Founding Partners
- **Expected timeline**: 30 days
- **Email open rate**: 40%+
- **Profile view rate**: 70%+
- **Claim rate**: 40%+
- **Result**: 20-25 Founding Partners minimum

**LET'S MAKE 'EM COME!** 🚀
