# Homepage Architecture

**Last Updated:** December 7, 2025

---

## Overview

GreenChainz uses a **multi-page architecture** with different landing pages for different purposes:

1. **Platform Homepage** (`/app/page.tsx`) - Simple status/navigation page
2. **Marketing Landing Pages** (`/cloudflare-landing/`) - Full marketing pages for campaigns

---

## Platform Homepage (`/`)

**Location:** `/app/page.tsx`  
**Type:** Next.js Server Component  
**Purpose:** Internal platform navigation and status

### Features

- **Platform Overview**: Brief description of GreenChainz
- **Quick Navigation**: Links to key platform areas
  - Marketplace (for buyers)
  - Supplier registration
  - Admin dashboard
- **System Status**: Health indicators
  - API Status
  - Database Connection
  - Automation Status
  - Support Status
- **Health Check Link**: Direct link to `/api/health`

### Design

- Minimal, clean design
- Gradient background (green-50 to blue-50)
- Card-based layout
- No heavy animations or marketing copy
- Fast loading, server-rendered

### Use Cases

- Platform users checking system status
- Admins accessing dashboard
- Internal navigation hub
- Health monitoring

### Code Structure

```typescript
// Server component (no 'use client')
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Status cards */}
      {/* Navigation links */}
      {/* Health indicators */}
    </div>
  );
}
```

---

## Marketing Landing Pages

**Location:** `/cloudflare-landing/`  
**Type:** Static HTML  
**Purpose:** Marketing, lead generation, campaigns

### Available Pages

1. **Main Landing** (`index.html`)

   - Full marketing page with hero, features, pricing
   - Animated gradients and effects
   - "Founding 50" campaign messaging
   - Email capture form

2. **Architect-Focused** (`architects/`)

   - Tailored messaging for architects
   - Project-based use cases
   - LEED/certification focus

3. **Supplier-Focused** (`suppliers/`)

   - Supplier onboarding pitch
   - Pricing tiers
   - ROI messaging

4. **Data Provider-Focused** (`data-providers/`)
   - Partnership opportunities
   - API integration benefits
   - Data licensing

### Design

- High-conversion marketing design
- Animated backgrounds and effects
- Large hero sections
- Social proof and trust indicators
- Multiple CTAs
- Heavy use of brand colors (teal, emerald)

### Deployment

Deploy separately to **Cloudflare Pages** for:

- Global CDN performance
- Static site optimization
- Separate from platform infrastructure
- Easy A/B testing

```bash
cd cloudflare-landing
wrangler pages deploy .
```

---

## Why Two Approaches?

### Platform Homepage (Simple)

**Pros:**

- Fast loading
- Server-rendered
- Easy to maintain
- No marketing bloat
- Good for authenticated users

**Cons:**

- Not optimized for conversion
- Minimal marketing messaging
- Not suitable for campaigns

### Marketing Landing Pages (Full)

**Pros:**

- High conversion design
- Rich animations and effects
- Campaign-specific messaging
- A/B testing friendly
- SEO optimized

**Cons:**

- Heavier page weight
- Requires separate deployment
- More maintenance

---

## Migration History

### Previous Version (Removed)

The platform homepage previously contained:

- Full marketing landing page
- Animated gradient backgrounds
- Large hero section with logo
- "Founding 50" messaging
- Email capture form
- Pricing tiers
- Partner logos
- Complex animations

**Why Changed:**

- Marketing pages moved to `/cloudflare-landing/` for better separation
- Platform homepage simplified for internal use
- Reduced bundle size for authenticated users
- Clearer separation of concerns

### Current Version

- Minimal status page
- Quick navigation
- System health indicators
- Links to full marketing pages when needed

---

## Routing Strategy

```
/                           → Platform status (Next.js)
/admin/dashboard            → Admin interface (Next.js)
/marketplace                → Product search (Next.js or Vite)
/supplier/register          → Supplier onboarding (Next.js)

# Marketing (separate deployment)
https://greenchainz.com     → Marketing landing (Cloudflare)
https://greenchainz.com/architects → Architect pitch (Cloudflare)
https://greenchainz.com/suppliers  → Supplier pitch (Cloudflare)
```

---

## Development

### Local Development

**Platform Homepage:**

```bash
npm run dev
# Visit http://localhost:3001
```

**Marketing Pages:**

```bash
cd cloudflare-landing
python -m http.server 8000
# Visit http://localhost:8000
```

### Building

**Platform:**

```bash
npm run build
```

**Marketing:**
No build step needed (static HTML)

---

## Best Practices

### When to Use Platform Homepage

- Internal navigation
- System status checks
- Authenticated user landing
- Admin access
- Health monitoring

### When to Use Marketing Pages

- Public campaigns
- Lead generation
- SEO landing pages
- A/B testing
- Partner outreach
- Social media links

---

## Future Considerations

### Potential Enhancements

1. **Dynamic Status**: Real-time health checks on homepage
2. **User Dashboard**: Redirect authenticated users to their dashboard
3. **Personalization**: Show relevant links based on user role
4. **Announcements**: System-wide notifications on homepage
5. **Quick Actions**: Common tasks for logged-in users

### Marketing Page Evolution

1. **CMS Integration**: Move from static HTML to headless CMS
2. **A/B Testing**: Implement testing framework
3. **Analytics**: Enhanced tracking and conversion optimization
4. **Localization**: Multi-language support
5. **Dynamic Content**: Personalized messaging based on source

---

## Related Documentation

- **Admin Dashboard**: `/docs/ADMIN-DASHBOARD.md`
- **Deployment**: `/VERCEL-SETUP.md`
- **Quick Start**: `/QUICK-START.md`
- **Landing Page Setup**: `/LANDING-PAGE-SETUP.md` (legacy)

---

## Quick Reference

### URLs

- **Platform Homepage**: `https://app.greenchainz.com/`
- **Admin Dashboard**: `https://app.greenchainz.com/admin/dashboard`
- **Health Check**: `https://app.greenchainz.com/api/health`
- **Marketing Site**: `https://greenchainz.com` (separate deployment)

### Files

- Platform: `/app/page.tsx`
- Marketing: `/cloudflare-landing/index.html`
- Config: `/vercel.json`

### Commands

```bash
# Start platform dev server
npm run dev

# Build platform
npm run build

# Test marketing pages locally
cd cloudflare-landing && python -m http.server 8000
```
