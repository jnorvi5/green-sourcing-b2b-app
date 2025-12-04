# Terraform Outputs for GreenChainz AWS Infrastructure

# ============================================
# S3 Buckets
# ============================================
output "s3_product_images_bucket" {
  description = "Product images S3 bucket name"
  value       = aws_s3_bucket.product_images.id
}

output "s3_product_images_arn" {
  description = "Product images S3 bucket ARN"
  value       = aws_s3_bucket.product_images.arn
}

output "s3_epd_documents_bucket" {
  description = "EPD documents S3 bucket name"
  value       = aws_s3_bucket.epd_documents.id
}

output "s3_epd_documents_arn" {
  description = "EPD documents S3 bucket ARN"
  value       = aws_s3_bucket.epd_documents.arn
}

output "s3_data_backups_bucket" {
  description = "Data backups S3 bucket name"
  value       = aws_s3_bucket.data_backups.id
}

output "s3_data_backups_arn" {
  description = "Data backups S3 bucket ARN"
  value       = aws_s3_bucket.data_backups.arn
}

# ============================================
# CloudFront
# ============================================
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.product_images.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.product_images.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID (for Route 53)"
  value       = aws_cloudfront_distribution.product_images.hosted_zone_id
}

# ============================================
# Lambda Functions
# ============================================
output "lambda_ec3_sync_arn" {
  description = "EC3 Sync Lambda function ARN"
  value       = aws_lambda_function.ec3_sync.arn
}

output "lambda_epd_sync_arn" {
  description = "EPD Sync Lambda function ARN"
  value       = aws_lambda_function.epd_sync.arn
}

output "lambda_supabase_backup_arn" {
  description = "Supabase Backup Lambda function ARN"
  value       = aws_lambda_function.supabase_backup.arn
}

output "lambda_cost_monitor_arn" {
  description = "Cost Monitor Lambda function ARN"
  value       = aws_lambda_function.cost_monitor.arn
}

# ============================================
# SNS Topics
# ============================================
output "sns_lambda_notifications_arn" {
  description = "Lambda notifications SNS topic ARN"
  value       = aws_sns_topic.lambda_notifications.arn
}

output "sns_budget_alerts_arn" {
  description = "Budget alerts SNS topic ARN"
  value       = aws_sns_topic.budget_alerts.arn
}

output "sns_ses_bounces_arn" {
  description = "SES bounces SNS topic ARN"
  value       = aws_sns_topic.ses_bounces.arn
}

output "sns_ses_complaints_arn" {
  description = "SES complaints SNS topic ARN"
  value       = aws_sns_topic.ses_complaints.arn
}

# ============================================
# SES
# ============================================
output "ses_domain_identity" {
  description = "SES domain identity"
  value       = aws_ses_domain_identity.main.domain
}

output "ses_configuration_set" {
  description = "SES configuration set name"
  value       = aws_ses_configuration_set.transactional.name
}

output "ses_dkim_tokens" {
  description = "SES DKIM tokens (add to DNS)"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}

# ============================================
# Secrets Manager
# ============================================
output "secrets_api_keys_arn" {
  description = "API keys secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "secrets_api_keys_name" {
  description = "API keys secret name"
  value       = aws_secretsmanager_secret.api_keys.name
}

# ============================================
# IAM (Sensitive - use with caution)
# ============================================
output "s3_access_key_id" {
  description = "S3 access key ID"
  value       = aws_iam_access_key.s3_access.id
  sensitive   = true
}

output "s3_secret_access_key" {
  description = "S3 secret access key"
  value       = aws_iam_access_key.s3_access.secret
  sensitive   = true
}

output "ses_smtp_username" {
  description = "SES SMTP username"
  value       = aws_iam_access_key.ses_smtp.id
  sensitive   = true
}

output "ses_smtp_password" {
  description = "SES SMTP password (must be converted to SMTP password)"
  value       = aws_iam_access_key.ses_smtp.secret
  sensitive   = true
}

# ============================================
# EventBridge Rules
# ============================================
output "eventbridge_ec3_sync_rule_arn" {
  description = "EC3 sync EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.ec3_daily_sync.arn
}

output "eventbridge_epd_sync_rule_arn" {
  description = "EPD sync EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.epd_weekly_sync.arn
}

output "eventbridge_backup_rule_arn" {
  description = "Supabase backup EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.supabase_backup.arn
}

output "eventbridge_cost_check_rule_arn" {
  description = "Cost check EventBridge rule ARN"
  value       = aws_cloudwatch_event_rule.cost_check.arn
}

# ============================================
# Environment Variables for .env
# ============================================
output "env_file_content" {
  description = "Environment variables for .env file"
  value = <<-EOF
# AWS Production (generated by Terraform)
AWS_REGION=${var.aws_region}
AWS_CLOUDFRONT_DISTRIBUTION_ID=${aws_cloudfront_distribution.product_images.id}
AWS_CLOUDFRONT_DOMAIN=${aws_cloudfront_distribution.product_images.domain_name}
AWS_BACKUP_BUCKET=${aws_s3_bucket.data_backups.id}
AWS_EPD_BUCKET=${aws_s3_bucket.epd_documents.id}
AWS_IMAGES_BUCKET=${aws_s3_bucket.product_images.id}

# AWS SES
AWS_SES_REGION=${var.aws_region}
AWS_SES_FROM_EMAIL=noreply@${var.domain_name}
AWS_SES_CONFIGURATION_SET=${aws_ses_configuration_set.transactional.name}
EOF
  sensitive = false
}
