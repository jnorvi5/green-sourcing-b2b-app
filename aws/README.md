# AWS Infrastructure for GreenChainz

This directory contains AWS infrastructure configuration for the GreenChainz B2B sustainable building materials marketplace.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GreenChainz AWS Architecture                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │  CloudFront CDN │────▶│  S3: Product    │     │  S3: EPD        │        │
│  │  (cdn.green...) │     │  Images (Public)│     │  Documents      │        │
│  └─────────────────┘     └─────────────────┘     │  (Private)      │        │
│                                                   └─────────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        EventBridge Scheduler                         │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │    │
│  │  │ EC3 Sync     │ │ EPD Sync     │ │ Supabase     │ │ Cost       │  │    │
│  │  │ (Daily 2AM)  │ │ (Weekly Sun) │ │ Backup (4AM) │ │ Check (6AM)│  │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬─────┘  │    │
│  └─────────┼────────────────┼────────────────┼────────────────┼────────┘    │
│            ▼                ▼                ▼                ▼             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
│  │  Lambda: EC3    │ │  Lambda: EPD    │ │  Lambda: Backup │ │ Lambda:    │ │
│  │  Data Sync      │ │  International  │ │  Supabase → S3  │ │ Cost Mon.  │ │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └─────┬──────┘ │
│           │                   │                   │                 │        │
│           ▼                   ▼                   ▼                 ▼        │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  ┌──────────┐ │
│  │         MongoDB Atlas               │  │  S3: Backups    │  │ SNS/CW   │ │
│  │  (ec3_materials, epd_products)      │  │  (→ Glacier)    │  │ Alerts   │ │
│  └─────────────────────────────────────┘  └─────────────────┘  └──────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Secrets Manager                               │    │
│  │  EC3_API_KEY | EPD_API_KEY | MONGODB_URI | SUPABASE_ACCESS_TOKEN   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        AWS SES (Transactional Email)                 │    │
│  │  Templates: RFQ Notification | Supplier Verification | Green Audit  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
aws/
├── README.md                    # This file
├── DEPLOYMENT.md                # Step-by-step deployment guide
├── COST-OPTIMIZATION.md         # Cost management best practices
├── IAM_ROLES_AND_POLICIES.md    # IAM configuration reference
├── cloudformation/
│   ├── s3-buckets.yaml          # S3 bucket configurations
│   └── ses-configuration.yaml   # SES email setup
├── eventbridge/
│   └── scheduled-rules.json     # Scheduled job configurations
└── s3-public-bucket.yaml        # Legacy public bucket template
```

## S3 Buckets

| Bucket | Purpose | Access | Lifecycle |
|--------|---------|--------|-----------|
| `gc-product-images-prod` | Product images & logos | CloudFront CDN | → IA after 90 days |
| `gc-epd-documents-prod` | EPD PDFs & certificates | Signed URLs only | 7-year retention |
| `gc-data-backups-prod` | Supabase backups | Private | → Glacier 30d, delete 365d |

## Lambda Functions

| Function | Trigger | Purpose | Timeout | Memory |
|----------|---------|---------|---------|--------|
| `gc-ec3-sync` | Daily 2 AM UTC | Sync EC3 carbon data | 5 min | 512 MB |
| `gc-epd-sync` | Weekly Sun 3 AM | Sync EPD International | 10 min | 1024 MB |
| `gc-supabase-backup` | Daily 4 AM UTC | Backup Supabase → S3 | 15 min | 256 MB |
| `gc-cost-monitor` | Daily 6 AM UTC | Cost alerts & metrics | 2 min | 256 MB |

## Quick Start

### Prerequisites

- AWS CLI v2 installed and configured
- Terraform v1.5+
- Node.js v18+
- AWS account with admin permissions

### Deploy with Terraform

```bash
# Navigate to Terraform directory
cd terraform/aws

# Initialize Terraform
terraform init

# Review the plan
terraform plan \
  -var="ec3_api_key=$EC3_API_KEY" \
  -var="epd_api_key=$EPD_API_KEY" \
  -var="mongodb_uri=$MONGODB_URI" \
  -var="supabase_access_token=$SUPABASE_ACCESS_TOKEN" \
  -var="supabase_project_ref=$SUPABASE_PROJECT_REF"

# Apply changes
terraform apply
```

### Deploy with CloudFormation

```bash
# Deploy S3 buckets
aws cloudformation create-stack \
  --stack-name gc-s3-buckets \
  --template-body file://cloudformation/s3-buckets.yaml \
  --capabilities CAPABILITY_NAMED_IAM

# Deploy SES configuration
aws cloudformation create-stack \
  --stack-name gc-ses \
  --template-body file://cloudformation/ses-configuration.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

## Environment Variables

Add these to your `.env` file after deployment:

```env
# AWS Production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<from Terraform outputs>
AWS_SECRET_ACCESS_KEY=<from Terraform outputs>
AWS_CLOUDFRONT_DISTRIBUTION_ID=<from Terraform outputs>
AWS_CLOUDFRONT_DOMAIN=cdn.greenchainz.com
AWS_BACKUP_BUCKET=gc-data-backups-prod
AWS_EPD_BUCKET=gc-epd-documents-prod
AWS_IMAGES_BUCKET=gc-product-images-prod

# AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@greenchainz.com
AWS_SES_CONFIGURATION_SET=gc-transactional

# Data Provider API Keys
EC3_API_KEY=your-ec3-bearer-token
EPD_INTERNATIONAL_API_KEY=your-epd-api-key

# Supabase Backup
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
SUPABASE_PROJECT_REF=your-project-ref
```

## Cost Monitoring

- **Monthly Budget:** $100
- **Warning Alert:** 80% ($80)
- **Critical Alert:** 100% ($100)

Alerts are sent to `founder@greenchainz.com` via SNS.

## Next.js Integration

```typescript
import { 
  uploadProductImage, 
  getCDNUrl, 
  sendRFQNotification 
} from '@/lib/aws';

// Upload a product image
const result = await uploadProductImage(imageBuffer, {
  supplierId: 'supplier-123',
  productId: 'product-456',
});

// Get CDN URL
const cdnUrl = getCDNUrl(result.key);

// Send RFQ notification email
await sendRFQNotification('supplier@example.com', {
  supplierName: 'Green Materials Co',
  productName: 'Recycled Steel',
  quantity: '500 kg',
  deadline: '2024-02-15',
  buyerMessage: 'Need quote for construction project',
});
```

## Security

- All secrets stored in AWS Secrets Manager
- S3 buckets have server-side encryption (AES-256)
- EPD documents accessible only via signed URLs
- Lambda functions use least-privilege IAM roles
- All API keys rotated quarterly

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Cost Optimization](./COST-OPTIMIZATION.md)
- [Lambda Functions](../lambda/README.md)
- [Terraform Configuration](../terraform/aws/)
