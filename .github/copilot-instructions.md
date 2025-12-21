# Copilot Instructions for GreenChainz B2B Marketplace

## Overview

GreenChainz is a global B2B green sourcing marketplace connecting sustainability-minded buyers (architects, contractors, procurement teams) with verified green suppliers. The platform aggregates, standardizes, and presents EPDs (Environmental Product Declarations), certifications, and carbon footprints using a hybrid "Ecosystem Strategy 2.0" architecture.

---

## The "Symbiotic" Technology Stack

### Core Application

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) + TypeScript 5.x (Strict Mode) | Server-side rendering, deployed on Vercel |
| Styling | Tailwind CSS + Shadcn UI | Utility-first CSS with accessible primitives |
| State | Zustand | Lightweight client-side state management |

### Data Architecture

| Database | Purpose | Use Case |
|----------|---------|----------|
| **Supabase (PostgreSQL)** | Single Source of Truth | Users, Auth, Orders, Payments, Suppliers, Products, EPD metadata, Certification data, RFQs. Uses JSONB columns for flexible schema data. Strict RLS enabled. |

**Database Rules:**
- ✅ **Supabase**: All data storage - user data, authentication, relationships, transactions, product specifications, EPD data, certification details
- ✅ **JSONB Columns**: Use PostgreSQL JSONB columns for flexible/varying schemas (product specs, EPD data, certifications)
- ✅ **Type Safety**: All database operations use Zod validation and TypeScript types

### The "Brain" (AI & Intelligence)

| Service | Purpose |
|---------|---------|
| **Azure AI Foundry** | AI orchestration and model management |
| **GPT-4o via Azure OpenAI Service** | "Green Audits" - PDF/BIM parsing, sustainability recommendations |
| **Azure AI Document Intelligence** | OCR and structured extraction from EPD documents, certificates |

### The "Nervous System" (Operations)

| Service | Purpose |
|---------|---------|
| **Zoho Flow** | Workflow orchestration (NOT Zapier) |
| **Intercom** | Customer chat with user context (User ID, Email, Company) |
| **MailerLite** | Email marketing and nurture campaigns |
| **Zoho Mail** | Transactional email delivery |

---

## Project Structure

```
/
├── app/                       # Next.js 14 App Router
│   ├── (auth)/               # Auth routes (login, signup, reset)
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── admin/            # Admin "White Glove" tools
│   │   │   └── suppliers/    # Supplier verification dashboard
│   │   ├── supplier/         # Supplier portal
│   │   └── buyer/            # Buyer portal
│   ├── api/                  # API Routes (when Server Actions aren't suitable)
│   └── actions/              # Server Actions (type-safe mutations)
├── components/
│   ├── ui/                   # Shadcn UI primitives
│   ├── forms/                # Form components with Zod validation
│   └── layout/               # Layout components
├── lib/
│   ├── supabase/             # Supabase client & queries
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   ├── azure-ai.ts           # Azure OpenAI and Document Intelligence
│   ├── azure/                # Azure utilities (emailer, etc.)
│   ├── integrations/         # Third-party service integrations
│   │   ├── epd-international.ts  # EPD International API
│   │   └── autodesk/         # Autodesk APS integration
│   ├── intercom.ts           # Intercom customer chat API
│   ├── mailerlite.ts         # MailerLite email marketing API
│   ├── zoho-smtp.ts          # Zoho Mail transactional email
│   ├── email/                # Email templates and sending
│   ├── validations/          # Zod schemas (shared across app)
│   ├── verification/         # Certification verification logic
│   └── utils/                # Utility functions
├── supabase/
│   ├── migrations/           # SQL migrations
│   └── functions/            # Edge Functions
├── types/                    # TypeScript type definitions
└── package.json
```

**TypeScript Path Mappings:**
The project uses TypeScript path aliases for cleaner imports:
- `@/app/*` → `app/*`
- `@/components/*` → `components/*`
- `@/lib/*` → `lib/*`
- `@/types/*` → `types/*` (for type imports, resolved via @/lib/* mapping)

Example: `import { createClient } from '@/lib/supabase/client'`

---

## Build, Test, and Run Commands

```bash
# Install dependencies
npm install

# Development
npm run dev              # Start Next.js dev server (port 3001)

# Production
npm run build            # Build for production
npm run start            # Start production server (port 3001)

# Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check
npm run test             # Run Jest tests
npm run test:watch       # Run Jest tests in watch mode
npm run check:links      # Check all documentation links

# Database
# Note: Database migrations are managed manually via Supabase CLI or SQL files
# - Migration files: supabase/migrations/*.sql
# - Seed data: supabase/seed.ts and supabase/seed-demo-users.sql
# - Schema: supabase/schema.sql
# - RLS Policies: supabase/rls-policies.sql
```

---

## Security & Validation Standards

### TypeScript Strict Mode (REQUIRED)

All code MUST use TypeScript strict mode. NO `any` types allowed.

```typescript
// tsconfig.json - REQUIRED settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Zod Validation (ALL Inputs)

Every form, API endpoint, and Server Action MUST validate inputs with Zod.

```typescript
// lib/validations/supplier.ts
import { z } from 'zod';

export const supplierRegistrationSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactEmail: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  website: z.string().url().optional(),
  certifications: z.array(z.string()).min(1, 'At least one certification required'),
  sustainabilityStatement: z.string().max(1000).optional(),
});

export type SupplierRegistration = z.infer<typeof supplierRegistrationSchema>;
```

```typescript
// Usage in Server Action
'use server';

import { supplierRegistrationSchema } from '@/lib/validations/supplier';

export async function registerSupplier(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  
  // ALWAYS validate with Zod
  const result = supplierRegistrationSchema.safeParse(rawData);
  
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  
  // result.data is now fully typed and validated
  const { companyName, contactEmail } = result.data;
  // ... proceed with database operations
}
```

### Server Actions Pattern (Type-Safe Mutations)

Use Next.js Server Actions for all data mutations. NOT Express.js endpoints.

```typescript
// app/actions/rfq.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const createRfqSchema = z.object({
  supplierId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  message: z.string().min(10).max(2000),
  deadline: z.string().datetime(),
});

export async function createRfq(input: z.infer<typeof createRfqSchema>) {
  // Validate input
  const validated = createRfqSchema.parse(input);
  
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }
  
  // Insert with type safety
  const { data, error } = await supabase
    .from('rfqs')
    .insert({
      buyer_id: user.id,
      supplier_id: validated.supplierId,
      product_id: validated.productId,
      quantity: validated.quantity,
      message: validated.message,
      deadline: validated.deadline,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Revalidate the RFQ list page
  revalidatePath('/dashboard/buyer/rfqs');
  
  return { success: true, rfq: data };
}
```

### Row Level Security (RLS) Policies

ALL Supabase tables MUST have RLS enabled with appropriate policies.

```sql
-- Enable RLS on suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Suppliers can only read/update their own profile
CREATE POLICY "Suppliers can view own profile"
  ON suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can update own profile"
  ON suppliers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Buyers can view verified suppliers only
CREATE POLICY "Buyers can view verified suppliers"
  ON suppliers FOR SELECT
  USING (
    verification_status = 'verified'
    OR auth.uid() = user_id
  );

-- Admins have full access
CREATE POLICY "Admins have full access to suppliers"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

---

## Phase 3: "Founding 50" Supplier Onboarding

### Admin "White Glove" Dashboard

Location: `/admin/suppliers`

Features:
- View all pending supplier applications
- Review uploaded certificates and EPD documents
- Approve/reject suppliers with feedback
- Track verification pipeline metrics

### PDF/Certificate Upload Workflow

```typescript
// app/actions/upload-certificate.ts
'use server';

import { AzureDocumentIntelligence } from '@/lib/azure/document-intelligence';
import { uploadToS3 } from '@/lib/aws/s3';
import { createClient } from '@/lib/supabase/server';

export async function uploadAndExtractCertificate(formData: FormData) {
  const file = formData.get('certificate') as File;
  const supplierId = formData.get('supplierId') as string;
  
  // 1. Upload to S3
  const s3Url = await uploadToS3(file, `certificates/${supplierId}`);
  
  // 2. Extract data with Azure AI Document Intelligence
  const documentIntelligence = new AzureDocumentIntelligence();
  const extractedData = await documentIntelligence.analyzeCertificate(s3Url);
  
  // 3. Store extracted data in Supabase (JSONB column for flexible schema)
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('certifications')
    .insert({
      supplier_id: supplierId,
      s3_url: s3Url,
      extracted_data: extractedData, // JSONB column
      extraction_source: 'azure_document_intelligence',
      extraction_date: new Date().toISOString(),
      confidence_score: extractedData.confidence,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 4. Update supplier verification status
  await supabase
    .from('suppliers')
    .update({
      verification_status: 'in_review',
    })
    .eq('id', supplierId);
  
  return { success: true, extractedData, certificationId: data.id };
}
```

### Verification Workflow

```typescript
// Verification status enum
type VerificationStatus = 'pending' | 'in_review' | 'verified' | 'rejected';

// app/actions/verify-supplier.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
// Note: Email notifications would be sent via lib/email/templates.ts or lib/zoho-smtp.ts

const verifySupplierSchema = z.object({
  supplierId: z.string().uuid(),
  status: z.enum(['verified', 'rejected']),
  feedback: z.string().optional(),
  verifiedCertifications: z.array(z.string()).optional(),
});

export async function verifySupplier(input: z.infer<typeof verifySupplierSchema>) {
  const validated = verifySupplierSchema.parse(input);
  const supabase = await createClient();
  
  // Update supplier verification status
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .update({
      verification_status: validated.status,
      verification_feedback: validated.feedback,
      verified_at: validated.status === 'verified' ? new Date().toISOString() : null,
      verified_certifications: validated.verifiedCertifications,
    })
    .eq('id', validated.supplierId)
    .select('*, users(email, full_name)')
    .single();
  
  if (error) throw error;
  
  // Trigger downstream workflows (e.g., welcome email)
  if (validated.status === 'verified') {
    // Send welcome email or trigger other notifications
    // Implementation would use lib/email/templates.ts or lib/email/email-service.ts
  }
  
  return { success: true, supplier };
}
```

### Intercom Integration (User Context)

```typescript
// lib/intercom.ts
// Client-side Intercom widget integration

export function initIntercom() {
  // Initializes Intercom widget with app ID from env
  // See lib/intercom.ts for full implementation
}

export function updateIntercomUser(user: {
  email?: string;
  name?: string;
  userId?: string;
  userType?: 'buyer' | 'supplier' | 'admin';
  company?: string;
}) {
  if (typeof window === 'undefined' || !(window as any).Intercom) return;

  (window as any).Intercom('update', {
    email: user.email,
    name: user.name,
    user_id: user.userId,
    user_type: user.userType,
    company: { name: user.company }
  });
}
```

---

## High-Impact Anti-Patterns (NEVER DO THIS)

### 1. ❌ "Build it from Scratch" Trap

**WRONG:**
```typescript
// DON'T build custom chat
export function CustomChatWidget() {
  const [messages, setMessages] = useState([]);
  // 500 lines of WebSocket code...
}

// DON'T build custom newsletter
export async function POST(req: Request) {
  const { email } = await req.json();
  // Custom email collection, double opt-in, unsubscribe...
}
```

**RIGHT:**
```typescript
// USE Intercom for chat (client-side widget)
import { useEffect } from 'react';
import { initIntercom, updateIntercomUser } from '@/lib/intercom';

// Initialize in app layout or component
useEffect(() => {
  initIntercom();
  
  if (user) {
    updateIntercomUser({
      email: user.email,
      name: user.name,
      userId: user.id,
      userType: user.role,
      company: user.company
    });
  }
}, [user]);

// USE MailerLite for newsletter
import { addSubscriber } from '@/lib/mailerlite';

export async function subscribeToNewsletter(email: string, name?: string) {
  await addSubscriber({
    email,
    fields: { name },
    groups: ['sustainability_updates']
  });
}
```

### 2. ❌ Wrong Database for the Job

**WRONG:**
```typescript
// DON'T store flexible EPD data in rigid PostgreSQL columns
await supabase.from('products').insert({
  epd_gwp_a1: 12.5,
  epd_gwp_a2: 3.2,
  epd_gwp_a3: 8.1,
  // 50 more nullable columns for different EPD formats...
  custom_field_1: '...',
  custom_field_2: '...',
});
```

**RIGHT:**
```typescript
// Store flexible data in Supabase JSONB columns
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: product, error } = await supabase
  .from('products')
  .update({
    epd_data: { // JSONB column for flexible schema
      program_operator: 'EPD International',
      pcr: 'UN CPC 412',
      declared_unit: '1 kg',
      gwp: {
        a1_a3: 23.8,
        a4: 1.2,
        c1_c4: 0.8,
        d: -5.2,
      },
      // Any additional fields the EPD contains...
    },
    certifications: [ // Array column or JSONB
      { name: 'LEED v4', points: 4, category: 'Materials' },
      { name: 'Cradle to Cradle', level: 'Gold' },
    ],
    custom_attributes: { // JSONB column for supplier-specific fields
      // Supplier-specific fields
    },
  })
  .eq('id', productId)
  .select()
  .single();

if (error) throw error;
```

// Store reference in Supabase
const supabase = await createClient();
await supabase.from('products').update({
  mongo_specs_id: mongoProductSpecs.insertedId.toString(),
}).eq('id', productId);
```

### 3. ❌ Generic OpenAI Calls

**WRONG:**
```typescript
// DON'T use OpenAI directly
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
});
```

**RIGHT:**
```typescript
// USE Azure OpenAI Service
import { AzureOpenAI } from 'openai';

const azureOpenAI = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiVersion: '2024-02-15-preview',
});

export async function analyzeEPD(epdContent: string) {
  const response = await azureOpenAI.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!, // e.g., 'gpt-4o'
    messages: [
      {
        role: 'system',
        content: `You are a sustainability expert analyzing Environmental Product Declarations (EPDs).
                  Extract key metrics: GWP, declared unit, validity period, certifications.
                  Return structured JSON matching our schema.`,
      },
      { role: 'user', content: epdContent },
    ],
    response_format: { type: 'json_object' },
  });
  
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response content from Azure OpenAI');
  }
  
  return JSON.parse(content);
}
```

### 4. ❌ Ignoring Type Safety

**WRONG:**
```typescript
// DON'T skip validation
export async function createProduct(req: Request) {
  const data = await req.json(); // any type, no validation
  await supabase.from('products').insert(data); // SQL injection risk
}
```

**RIGHT:**
```typescript
// ALWAYS use Zod validation
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000),
  category: z.enum(['insulation', 'flooring', 'structural', 'finishes']),
  price: z.number().positive().optional(),
});

export async function createProduct(input: unknown) {
  const validated = createProductSchema.parse(input); // Throws if invalid
  // validated is now fully typed
  await supabase.from('products').insert(validated);
}
```

---

## Database Schema

### Supabase (PostgreSQL) - Relational Source of Truth

```sql
-- Custom Types
CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
CREATE TYPE rfq_status AS ENUM ('pending', 'answered', 'closed', 'expired');

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  
  -- Verification workflow
  verification_status verification_status DEFAULT 'pending',
  verification_feedback TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verified_certifications TEXT[],
  
  -- Flexible data in JSONB columns
  profile_data JSONB,              -- Extended company profile
  certifications_data JSONB,       -- Certification documents & extracted data
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_urls TEXT[],
  
  -- Flexible product specifications in JSONB columns
  epd_data JSONB,                  -- EPD data with varying schema
  specifications JSONB,            -- Product specifications
  
  -- Searchable summary fields (extracted from JSONB for filtering)
  certifications TEXT[],           -- e.g., ['LEED', 'Cradle to Cradle']
  gwp_a1_a3 DECIMAL,               -- Primary carbon metric for filtering
  
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFQs Table
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  quantity INTEGER NOT NULL,
  message TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  status rfq_status DEFAULT 'pending',
  
  -- Response tracking
  response_message TEXT,
  response_price DECIMAL,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
```

### Supabase Database Schema - Single Source of Truth

All data is stored in Supabase PostgreSQL with JSONB columns for flexible schemas:

```typescript
// Example schema pattern for lib/validations/product-specs.ts
import { z } from 'zod';

// EPD data can vary significantly between products and standards
export const epdDataSchema = z.object({
  program_operator: z.string().optional(),
  registration_number: z.string().optional(),
  pcr: z.string().optional(),               // Product Category Rules
  declared_unit: z.string(),
  validity: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }).optional(),
  
  // Global Warming Potential by lifecycle stage
  gwp: z.object({
    a1_a3: z.number().optional(),           // Raw material & manufacturing
    a4: z.number().optional(),              // Transport
    a5: z.number().optional(),              // Installation
    b1_b7: z.number().optional(),           // Use phase
    c1_c4: z.number().optional(),           // End of life
    d: z.number().optional(),               // Benefits beyond boundary
  }).optional(),
  
  // Additional impact categories (optional, varies by EPD)
  odp: z.number().optional(),               // Ozone Depletion Potential
  ap: z.number().optional(),                // Acidification Potential
  ep: z.number().optional(),                // Eutrophication Potential
  
  // Raw extracted text for reference
  raw_text: z.string().optional(),
});

export const productSpecsSchema = z.object({
  supabase_product_id: z.string().uuid(),
  
  epd_data: epdDataSchema.optional(),
  
  certifications: z.array(z.object({
    name: z.string(),
    level: z.string().optional(),           // e.g., 'Gold', 'Platinum'
    points: z.number().optional(),          // e.g., LEED points
    category: z.string().optional(),
    certificate_url: z.string().url().optional(),
    valid_until: z.string().datetime().optional(),
  })).optional(),
  
  specifications: z.record(z.unknown()),    // Flexible key-value specs
  
  // Extraction metadata
  extraction_source: z.enum([
    'manual_entry',
    'azure_document_intelligence',
    'pdf_extraction',
    'api_import',
  ]),
  extraction_date: z.date(),
  confidence_score: z.number().min(0).max(1).optional(),
  
  created_at: z.date(),
  updated_at: z.date(),
});

// These schemas validate JSONB data stored in Supabase
// Use with Zod's .parse() or .safeParse() before inserting into database
export type ProductSpecs = z.infer<typeof productSpecsSchema>;

// Example usage:
// const validated = productSpecsSchema.parse(rawData);
// await supabase.from('products').update({ epd_data: validated.epd_data }).eq('id', productId);
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# ===========================================
# SUPABASE (PostgreSQL - Source of Truth)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-side only, NEVER expose

# ===========================================
# MONGODB ATLAS (Flex Layer)
# ========================================

# ===========================================
# AZURE AI FOUNDRY (The "Brain")
# ===========================================
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key

# ===========================================
# AWS S3 (File Storage)
# ===========================================
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=greenchainz-uploads

# ===========================================
# OPERATIONS (The "Nervous System")
# ===========================================
# Intercom - Customer Chat
NEXT_PUBLIC_INTERCOM_APP_ID=your-app-id
INTERCOM_ACCESS_TOKEN=your-access-token    # Server-side only

# MailerLite - Email Marketing
MAILERLITE_API_KEY=your-api-key

# Zoho Flow - Workflow Orchestration
ZOHO_FLOW_WEBHOOK_URL=https://flow.zoho.com/webhook/...

# Zoho Mail - Transactional Email
ZOHO_MAIL_USER=noreply@greenchainz.com
ZOHO_MAIL_PASSWORD=your-app-password
```

---

## Compliance Standards

The platform aligns with international sustainability standards:

| Standard | Description | Application |
|----------|-------------|-------------|
| **ISO 14025** | Type III Environmental Declarations (EPDs) | EPD data structure and validation |
| **EN 15804** | Sustainability of construction works | European EPD format support |
| **ISO 21930** | Environmental declarations for building products | Building product categorization |
| **EPD Hub GPI v1.3** | General Program Instructions | EPD metadata requirements |

---

## Key User Personas

### Buyer (Architect/Contractor)
- Discovers and compares green materials by sustainability metrics
- Sends RFQs to verified suppliers
- Manages projects and saved products
- Accesses EPD documents and certifications

### Supplier (Manufacturer)
- Lists products with sustainability data
- Uploads EPD documents for AI extraction
- Responds to RFQs with quotes
- Manages company profile and certifications
- Tracks verification status

### Admin (White Glove Support)
- Reviews pending supplier applications
- Verifies uploaded certificates using AI extraction
- Approves/rejects suppliers with feedback
- Monitors platform health and metrics

---

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- --testPathPattern=supplier
```

### Test Structure
- Unit tests: `__tests__/` directories or `*.test.ts` files
- Integration tests: `__tests__/integration/`
- E2E tests: `e2e/` (Playwright)

### Testing Zod Schemas

```typescript
// __tests__/validations/supplier.test.ts
import { supplierRegistrationSchema } from '@/lib/validations/supplier';

describe('supplierRegistrationSchema', () => {
  it('validates correct input', () => {
    const input = {
      companyName: 'Green Materials Co',
      contactEmail: 'contact@greenmaterials.com',
      phone: '+14155551234',
      certifications: ['ISO 14001'],
    };
    
    expect(() => supplierRegistrationSchema.parse(input)).not.toThrow();
  });
  
  it('rejects invalid email', () => {
    const input = {
      companyName: 'Green Materials Co',
      contactEmail: 'not-an-email',
      phone: '+14155551234',
      certifications: ['ISO 14001'],
    };
    
    expect(() => supplierRegistrationSchema.parse(input)).toThrow();
  });
});
```

---

## Additional Resources

- Architecture diagrams: `ARCHITECTURE-DIAGRAMS.md`
- Business plan: `BUSINESS-PLAN.md`
- Deployment guide: `CLOUD-DEPLOYMENT.md`
- Documentation index: `DOCUMENTATION-INDEX.md`
