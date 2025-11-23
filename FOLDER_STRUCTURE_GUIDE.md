# GreenChainz Folder Structure Implementation Guide

**Date:** November 23, 2025  
**Purpose:** Complete reorganization per Gemini AI Development Partner specifications

---

## ✅ COMPLETED ON GITHUB

### 1. `/components/layout/`
- ✅ **Navbar.tsx** - Glass-effect navigation with transparent logo
- ✅ **Footer.tsx** - Dark green footer with white logo

---

## 📋 YOUR TASK: Replicate This Structure in Local File Explorer

Navigate to your project folder on your spare NVMe and create the following:

---

## 🗂️ COMPLETE FOLDER STRUCTURE

```
green-sourcing-b2b-app/
│
├── .git/                          [KEEP - Version control]
├── .env.local                     [CREATE - See Section A below]
├── .env.example                   [CREATE - Template for other devs]
├── .gitignore                     [KEEP]
├── next.config.js                 [KEEP]
├── package.json                   [KEEP]
├── tailwind.config.ts             [KEEP]
├── tsconfig.json                  [KEEP]
│
├── app/                           [KEEP - Next.js App Router]
│   ├── layout.tsx                 [KEEP]
│   ├── page.tsx                   [UPDATE - See Section B]
│   ├── globals.css                [KEEP - Has glass-effect styles]
│   │
│   ├── (marketing)/               [CREATE - Marketing route group]
│   │   ├── sourcing/
│   │   │   └── page.tsx           [CREATE]
│   │   └── suppliers/
│   │       └── page.tsx           [CREATE]
│   │
│   ├── (dashboard)/               [CREATE - Future: Protected routes]
│   │   ├── dashboard/
│   │   │   ├── buyer/
│   │   │   └── supplier/
│   │   └── layout.tsx
│   │
│   └── api/                       [KEEP - API routes]
│       └── webhooks/
│
├── components/                    [CREATE - Move from app/components]
│   ├── layout/
│   │   ├── Navbar.tsx             [✅ DONE ON GITHUB - Pull/sync]
│   │   └── Footer.tsx             [✅ DONE ON GITHUB - Pull/sync]
│   │
│   ├── home/
│   │   ├── Hero.tsx               [CREATE - See Section C]
│   │   └── TrustBar.tsx           [CREATE - See Section D]
│   │
│   ├── marketplace/
│   │   ├── ProductCard.tsx        [CREATE - Placeholder]
│   │   ├── SearchFilters.tsx
│   │   └── RFQModal.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       └── Badge.tsx
│
├── lib/                           [KEEP]
│   ├── supabase/
│   │   ├── client.ts              [KEEP]
│   │   └── server.ts
│   └── utils.ts
│
├── public/                        [CREATE - Nextjs standard for static assets]
│   └── assets/
│       ├── logo-transparent.png   [MOVE from assets/images/logo/]
│       ├── logo-white.png         [MOVE from assets/images/logo/]
│       ├── hero-visual.png        [MOVE from assets/images/logo/]
│       └── partners/              [CREATE folder]
│           ├── epd-logo.png       [MOVE from assets/images/]
│           ├── fsc-logo.png       [MOVE from assets/images/]
│           ├── leed-logo.png      [MOVE from assets/images/]
│           ├── usgbc-logo.png     [MOVE from assets/images/]
│           ├── wap-logo.svg       [MOVE from assets/images/]
│           ├── breeam-logo.svg    [MOVE from assets/images/]
│           └── bt-logo.svg        [MOVE from assets/images/]
│
├── types/                         [CREATE]
│   ├── database.types.ts          [CREATE - Supabase generated]
│   ├── product.ts                 [CREATE - See Section E]
│   └── sustainability.ts          [CREATE - See Section F]
│
├── assets/                        [KEEP BUT DEPRECATE]
│   └── images/                    [Will consolidate into public/assets]
│
├── backend/                       [KEEP]
├── database-schemas/              [KEEP]
├── docs/                          [KEEP]
├── emails/                        [KEEP]
├── frontend/                      [KEEP - Separate sub-project]
├── lib/                           [KEEP]
├── supabase/                      [KEEP]
└── terraform/                     [KEEP]
```

---

## 📝 SECTION A: Create `.env.local`

**Location:** Root directory  
**Action:** Create new file

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here

# CookieYes
NEXT_PUBLIC_COOKIEYES_KEY=80d633ac80d2b968de32ce14

# Google Analytics
NEXT_PUBLIC_GA_ID=G-P1FXVHYCSZ
```

---

## 📝 SECTION B: Update `app/page.tsx`

**Location:** `app/page.tsx`  
**Action:** Replace entire file

```typescript
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import TrustBar from '@/components/home/TrustBar';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        {/* More sections coming soon */}
      </main>
      <Footer />
    </>
  );
}
```

---

## 📝 SECTION C: Create `components/home/Hero.tsx`

See Gemini conversation - Full Hero component code provided.

---

## 📝 SECTION D: Create `components/home/TrustBar.tsx`

See Gemini conversation - Full TrustBar component code provided.

---

## 📝 SECTION E: Create `types/product.ts`

```typescript
export interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  sustainability_score?: number;
  certifications: Certification[];
  epd_data?: EPDData;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  valid_until: string;
  certificate_url: string;
}

export interface EPDData {
  document_id: string;
  gwp_a1_a3: number; // kg CO2e
  source: string;
  verified: boolean;
}
```

---

## 📝 SECTION F: Create `types/sustainability.ts`

```typescript
// Environmental Product Declaration Standards
export interface EPD {
  id: string;
  product_id: string;
  document_url: string;
  issuing_body: 'EPD International' | 'IBU' | 'Other';
  valid_from: string;
  valid_until: string;
  lca_stages: LCAStages;
  verified_by: string;
}

export interface LCAStages {
  a1_a3_gwp: number; // Global Warming Potential kg CO2e
  a4_transport?: number;
  c1_c4_end_of_life?: number;
}

export type CertificationStandard = 
  | 'LEED'
  | 'BREEAM'
  | 'FSC'
  | 'PEFC'
  | 'Cradle to Cradle'
  | 'Living Building Challenge';
```

---

## ⚡ IMPLEMENTATION STEPS (In Your File Explorer)

### Step 1: Pull Latest Changes from GitHub
```bash
git pull origin main
```

### Step 2: Create Folder Structure
1. Right-click in `green-sourcing-b2b-app/` root
2. Create these folders:
   - `public/`
   - `public/assets/`
   - `public/assets/partners/`
   - `components/home/`
   - `components/marketplace/`
   - `components/ui/`
   - `types/`
   - `app/(marketing)/sourcing/`
   - `app/(marketing)/suppliers/`

### Step 3: Move Logo Files
**From:** `assets/images/logo/`  
**To:** `public/assets/`

- Move `logo-transparent.png`
- Move `logo-white.png` 
- Move `hero-visual.png`

### Step 4: Move Partner Logos
**From:** `assets/images/`  
**To:** `public/assets/partners/`

- Move all `*_logo.png` and `*_logo.svg` files

### Step 5: Create Component Files
Create empty `.tsx` files in:
- `components/home/Hero.tsx`
- `components/home/TrustBar.tsx`

### Step 6: Create Type Definition Files
Create empty `.ts` files in:
- `types/product.ts`
- `types/sustainability.ts`

### Step 7: Create `.env.local`
In root directory, create the file with Section A content.

### Step 8: Update `app/page.tsx`
Replace content with Section B code.

### Step 9: Commit Your Work
```bash
git add .
git commit -m "feat: Complete folder structure reorganization per Gemini specifications"
git push origin main
```

---

## 🎯 VERIFICATION CHECKLIST

- [ ] `/public/assets/` exists with 3 logo files
- [ ] `/public/assets/partners/` exists with 7 partner logos
- [ ] `/components/layout/` has Navbar.tsx and Footer.tsx
- [ ] `/components/home/` has Hero.tsx and TrustBar.tsx
- [ ] `/types/` has product.ts and sustainability.ts
- [ ] `.env.local` exists in root
- [ ] `app/page.tsx` imports all 4 components
- [ ] Old `app/components/` is empty (files moved)
- [ ] Run `npm run dev` - No import errors

---

## 🚀 NEXT STEPS AFTER COMPLETION

1. Fill in Hero.tsx content from Gemini conversation
2. Fill in TrustBar.tsx content from Gemini conversation  
3. Test the homepage loads with all components
4. Configure GTM with CookieYes (separate task)
5. Deploy to Vercel

---

**Questions?** Review the full Gemini conversation for detailed component code.
