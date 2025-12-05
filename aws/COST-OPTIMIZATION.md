# AWS Cost Optimization Guide for GreenChainz

This guide provides best practices for managing AWS costs while maintaining performance and reliability.

## Current Budget

- **Monthly Budget:** $100
- **Warning Alert:** 80% ($80)
- **Critical Alert:** 100% ($100)
- **Alert Recipient:** founder@greenchainz.com

## Cost Breakdown (Estimated)

| Service | Estimated Monthly Cost | Notes |
|---------|----------------------|-------|
| S3 Storage | $2-10 | Depends on data volume |
| CloudFront | $5-20 | Based on traffic |
| Lambda | $1-5 | Typically very low |
| Secrets Manager | $1-2 | Per secret stored |
| EventBridge | <$1 | Minimal for scheduled rules |
| SES | $1-5 | Based on email volume |
| CloudWatch | $2-5 | Logs and metrics |
| **Total** | **~$15-50** | Well under budget |

## Cost Optimization Strategies

### 1. S3 Storage Optimization

#### Use Intelligent-Tiering
S3 Intelligent-Tiering automatically moves objects between access tiers:

```hcl
# Already configured in terraform/aws/s3.tf
resource "aws_s3_bucket_lifecycle_configuration" "product_images" {
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"  # 40% cheaper
    }
  }
}
```

#### Enable Glacier for Backups
Backups are automatically transitioned to Glacier after 30 days:

```hcl
transition {
  days          = 30
  storage_class = "GLACIER"  # 80% cheaper than Standard
}
```

#### Monitor Storage Usage

```bash
# Check bucket sizes
aws s3 ls s3://gc-product-images-prod --summarize --human-readable --recursive | tail -2
aws s3 ls s3://gc-epd-documents-prod --summarize --human-readable --recursive | tail -2
aws s3 ls s3://gc-data-backups-prod --summarize --human-readable --recursive | tail -2
```

### 2. Lambda Optimization

#### Right-size Memory
Lambda cost = (memory × execution time). Optimize both:

| Function | Current Memory | Recommended |
|----------|---------------|-------------|
| EC3 Sync | 512 MB | Keep (data processing) |
| EPD Sync | 1024 MB | Keep (large datasets) |
| Supabase Backup | 256 MB | Keep (I/O bound) |
| Cost Monitor | 256 MB | Keep (minimal) |

#### Reduce Cold Starts
Use provisioned concurrency only if needed (adds cost):

```hcl
# Only add if cold starts are problematic
resource "aws_lambda_provisioned_concurrency_config" "ec3_sync" {
  function_name                     = aws_lambda_function.ec3_sync.function_name
  provisioned_concurrent_executions = 1
  qualifier                         = aws_lambda_function.ec3_sync.version
}
```

#### Optimize Execution Time

```typescript
// ✅ Good: Batch operations
await collection.bulkWrite(operations);

// ❌ Bad: Individual writes
for (const item of items) {
  await collection.insertOne(item);
}
```

### 3. CloudFront Optimization

#### Use Price Class 100
Already configured - serves only from US, Canada, and Europe:

```hcl
price_class = "PriceClass_100"  # Cheapest, covers main markets
```

#### Optimize Cache TTL
Increase cache duration for static assets:

```hcl
default_ttl = 604800    # 7 days
max_ttl     = 31536000  # 1 year for images
```

#### Enable Compression
Already enabled - reduces bandwidth costs:

```hcl
compress = true
```

### 4. CloudWatch Logs Optimization

#### Reduce Log Retention
30 days is sufficient for debugging:

```hcl
resource "aws_cloudwatch_log_group" "ec3_sync" {
  retention_in_days = 30  # Not 365!
}
```

#### Use Metrics Instead of Logs
For monitoring, prefer CloudWatch Metrics over parsing logs:

```typescript
// Emit custom metrics instead of logging everything
await cloudWatchClient.send(new PutMetricDataCommand({
  Namespace: 'GreenChainz/Lambda',
  MetricData: [{
    MetricName: 'ItemsProcessed',
    Value: count,
  }],
}));
```

### 5. Data Transfer Optimization

#### Use VPC Endpoints
Avoid data transfer charges for S3 and Secrets Manager:

```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.us-east-1.s3"
}

resource "aws_vpc_endpoint" "secrets_manager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.secretsmanager"
  vpc_endpoint_type   = "Interface"
}
```

### 6. Secrets Manager Optimization

#### Consolidate Secrets
One secret with multiple key-value pairs is cheaper:

```json
// ✅ Good: One secret, multiple keys
{
  "EC3_API_KEY": "...",
  "EPD_API_KEY": "...",
  "MONGODB_URI": "..."
}

// ❌ Bad: Multiple secrets (each costs $0.40/month)
```

### 7. SES Optimization

#### Use Configuration Sets
Track delivery metrics to identify issues early:

```hcl
resource "aws_ses_configuration_set" "transactional" {
  reputation_metrics_enabled = true  # Free with SES
}
```

## Cost Monitoring

### Daily Cost Check Lambda

The `gc-cost-monitor` Lambda runs daily at 6 AM UTC and:
1. Gets current month's spending
2. Calculates forecast
3. Sends alerts if thresholds exceeded
4. Publishes CloudWatch metrics

### CloudWatch Dashboard

View costs at: AWS Console → CloudWatch → Dashboards → GreenChainz-Costs

### AWS Budgets Alerts

Automated alerts at:
- 50% ($50) - Informational
- 80% ($80) - Warning
- 100% ($100) - Critical
- 100% forecasted - Early warning

## Emergency Cost Reduction

If costs spike unexpectedly:

### 1. Disable Non-Critical Lambda Functions

```bash
# Temporarily disable scheduled triggers
aws events disable-rule --name gc-ec3-daily-sync
aws events disable-rule --name gc-epd-weekly-sync
```

### 2. Scale Down CloudFront

```bash
# Reduce cache behaviors or disable distribution
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config ...
```

### 3. Review S3 Usage

```bash
# Find large files
aws s3 ls s3://gc-product-images-prod --recursive | sort -k3 -n -r | head -20
```

### 4. Check for Anomalies

```bash
# View Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=gc-ec3-sync \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 3600 \
  --statistics Sum
```

## Free Tier Benefits

AWS Free Tier includes (first 12 months):

| Service | Free Tier |
|---------|-----------|
| Lambda | 1M requests/month |
| S3 | 5GB storage |
| CloudFront | 1TB transfer |
| CloudWatch | 10 custom metrics |
| SES | 62,000 emails/month (from EC2) |

## Cost Tags

All resources are tagged for cost tracking:

```hcl
tags = {
  project     = "greenchainz"
  environment = "production"
  managed_by  = "terraform"
}
```

View costs by tag: AWS Console → Cost Explorer → Filter by Tag

## Monthly Review Checklist

- [ ] Review Cost Explorer for unexpected spikes
- [ ] Check S3 bucket sizes and growth rate
- [ ] Review Lambda error rates (failed invocations cost money)
- [ ] Verify CloudFront cache hit ratio (should be >90%)
- [ ] Check for unused resources
- [ ] Review and rotate secrets if needed
- [ ] Update budget if business needs change

## Resources

- [AWS Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
- [Lambda Cost Optimization](https://docs.aws.amazon.com/lambda/latest/operatorguide/cost-optimization.html)
- [S3 Storage Classes](https://aws.amazon.com/s3/storage-classes/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
