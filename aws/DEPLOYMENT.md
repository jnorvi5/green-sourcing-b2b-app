# AWS Deployment Guide for GreenChainz

This guide provides step-by-step instructions for deploying the GreenChainz AWS infrastructure.

## Prerequisites

### Required Tools

1. **AWS CLI v2**
   ```bash
   # Install on macOS
   brew install awscli

   # Install on Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Verify installation
   aws --version
   ```

2. **Terraform v1.5+**
   ```bash
   # Install on macOS
   brew install terraform

   # Install on Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

3. **Node.js v18+**
   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   ```

### AWS Account Setup

1. Create an AWS account or use an existing one
2. Create an IAM user with programmatic access
3. Attach the `AdministratorAccess` policy (or create a more restrictive policy)
4. Save the Access Key ID and Secret Access Key

### Configure AWS CLI

```bash
aws configure
# Enter your credentials when prompted:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-east-1
# Default output format: json
```

## Step 1: Prepare Secrets

Before deploying, gather the following secrets:

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `EC3_API_KEY` | Building Transparency API key | [buildingtransparency.org](https://buildingtransparency.org) |
| `EPD_INTERNATIONAL_API_KEY` | EPD International API key | [environdec.com](https://www.environdec.com/) |
| `MONGODB_URI` | MongoDB Atlas connection string | [cloud.mongodb.com](https://cloud.mongodb.com) |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token | Supabase Dashboard → Settings → Access Tokens |
| `SUPABASE_PROJECT_REF` | Supabase project reference | Supabase Dashboard URL (e.g., `abcd1234`) |

## Step 2: Create Terraform State Backend

Before running Terraform, create the S3 bucket and DynamoDB table for state storage:

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket greenchainz-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket greenchainz-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket greenchainz-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name greenchainz-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Step 3: Build Lambda Functions

Build the Lambda function deployment packages:

```bash
# Navigate to lambda directory
cd lambda

# Build each Lambda function
for lambda in ec3-sync epd-sync supabase-backup cost-monitor; do
  echo "Building $lambda..."
  cd $lambda
  npm install
  npm run build
  npm run package
  cd ..
done
```

## Step 4: Deploy with Terraform

### Initialize Terraform

```bash
cd terraform/aws

# Initialize with remote backend
terraform init
```

### Create Variable File (Optional)

Create `terraform.tfvars` for your secrets:

```hcl
# terraform/aws/terraform.tfvars
ec3_api_key           = "your-ec3-api-key"
epd_api_key           = "your-epd-api-key"
mongodb_uri           = "mongodb+srv://user:pass@cluster.mongodb.net/greenchainz"
supabase_access_token = "your-supabase-token"
supabase_project_ref  = "your-project-ref"
```

⚠️ **Never commit this file to git!** Add `terraform.tfvars` to `.gitignore`.

### Review the Plan

```bash
terraform plan
```

### Apply Changes

```bash
terraform apply
```

### Save Outputs

```bash
# View all outputs
terraform output

# Save to file
terraform output -json > tf-outputs.json
```

## Step 5: Verify Deployment

### Check S3 Buckets

```bash
aws s3 ls | grep gc-
# Should show:
# gc-product-images-prod
# gc-epd-documents-prod
# gc-data-backups-prod
```

### Check Lambda Functions

```bash
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'gc-')].[FunctionName,Runtime,MemorySize]" --output table
```

### Test Lambda Functions

```bash
# Test EC3 sync
aws lambda invoke \
  --function-name gc-ec3-sync \
  --payload '{"source": "manual", "trigger": "test"}' \
  response.json

cat response.json
```

### Check CloudFront

```bash
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='GreenChainz Product Images CDN'].[Id,DomainName]"
```

## Step 6: Configure DNS (Optional)

If you want to use `cdn.greenchainz.com`:

1. Get the CloudFront distribution domain from Terraform outputs
2. Add a CNAME record in your DNS:
   ```
   cdn.greenchainz.com → d1234abcd.cloudfront.net
   ```

## Step 7: Configure SES

### Verify Domain

1. Go to AWS SES Console
2. Navigate to "Verified identities"
3. Add the DKIM and SPF records to your DNS:

```
# DKIM records (example)
selector1._domainkey.greenchainz.com CNAME selector1.dkim.amazonses.com
selector2._domainkey.greenchainz.com CNAME selector2.dkim.amazonses.com
selector3._domainkey.greenchainz.com CNAME selector3.dkim.amazonses.com

# SPF record
greenchainz.com TXT "v=spf1 include:amazonses.com ~all"

# Mail From domain
mail.greenchainz.com MX 10 feedback-smtp.us-east-1.amazonses.com
```

### Request Production Access

If in SES sandbox, request production access:
1. Go to SES Console → Account Dashboard
2. Click "Request production access"
3. Fill out the form with your use case

## Step 8: Update Application Environment

Add the following to your `.env.local` or production environment:

```env
# AWS Production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<from terraform output>
AWS_SECRET_ACCESS_KEY=<from terraform output>
AWS_CLOUDFRONT_DISTRIBUTION_ID=<from terraform output>
AWS_CLOUDFRONT_DOMAIN=<from terraform output>
AWS_BACKUP_BUCKET=gc-data-backups-prod
AWS_EPD_BUCKET=gc-epd-documents-prod
AWS_IMAGES_BUCKET=gc-product-images-prod

# AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@greenchainz.com
AWS_SES_CONFIGURATION_SET=gc-transactional
```

## Step 9: Set Up GitHub Actions

Add these secrets to your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for deployment |
| `EC3_API_KEY` | EC3 API key |
| `EPD_INTERNATIONAL_API_KEY` | EPD API key |
| `MONGODB_URI` | MongoDB connection string |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token |
| `SUPABASE_PROJECT_REF` | Supabase project reference |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

## Rollback

If something goes wrong, rollback with:

```bash
# Rollback to previous state
terraform apply -target=<resource> -var="..."

# Or destroy and recreate
terraform destroy
terraform apply
```

## Troubleshooting

### Common Issues

1. **S3 bucket already exists**
   - Change the bucket name in `variables.tf`
   - Or import existing: `terraform import aws_s3_bucket.product_images gc-product-images-prod`

2. **Lambda deployment fails**
   - Ensure the `function.zip` files exist in each Lambda directory
   - Check IAM permissions

3. **SES in sandbox mode**
   - Verify sender and recipient emails manually
   - Request production access

4. **CloudFront 403 errors**
   - Check S3 bucket policy
   - Verify Origin Access Identity

### Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/gc-ec3-sync --follow

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=gc-ec3-sync \
  --start-time $(date -u +%Y-%m-%dT%H:%M:%SZ -d '1 hour ago') \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Sum
```

## Next Steps

1. Review [Cost Optimization Guide](./COST-OPTIMIZATION.md)
2. Set up monitoring dashboards
3. Configure alerting thresholds
4. Document runbooks for incident response
