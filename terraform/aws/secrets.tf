# AWS Secrets Manager for GreenChainz

# ============================================
# API Keys Secret
# ============================================
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "greenchainz/production/api-keys"
  description = "API keys for GreenChainz Lambda functions"

  recovery_window_in_days = 7

  tags = {
    Name    = "GreenChainz API Keys"
    purpose = "api-keys"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id

  secret_string = jsonencode({
    EC3_API_KEY               = var.ec3_api_key
    EPD_INTERNATIONAL_API_KEY = var.epd_api_key
    SUPABASE_ACCESS_TOKEN     = var.supabase_access_token
    SUPABASE_PROJECT_REF      = var.supabase_project_ref
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ============================================
# Secret Rotation (Optional - for future use)
# ============================================
# Uncomment to enable automatic rotation
#
# resource "aws_secretsmanager_secret_rotation" "api_keys" {
#   secret_id           = aws_secretsmanager_secret.api_keys.id
#   rotation_lambda_arn = aws_lambda_function.secret_rotation.arn
#
#   rotation_rules {
#     automatically_after_days = 90
#   }
# }

# ============================================
# IAM Policy for Secret Access
# ============================================
resource "aws_iam_policy" "secrets_read" {
  name        = "gc-secrets-read-policy"
  description = "Policy for reading GreenChainz secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      }
    ]
  })
}

# ============================================
# Additional Secrets for Future Use
# ============================================

# Database credentials (if needed separately)
resource "aws_secretsmanager_secret" "database" {
  name        = "greenchainz/production/database"
  description = "Database credentials for GreenChainz"

  recovery_window_in_days = 7

  tags = {
    Name    = "GreenChainz Database Credentials"
    purpose = "database"
  }
}

# AWS service credentials for application use
resource "aws_secretsmanager_secret" "aws_credentials" {
  name        = "greenchainz/production/aws-credentials"
  description = "AWS credentials for GreenChainz application"

  recovery_window_in_days = 7

  tags = {
    Name    = "GreenChainz AWS Credentials"
    purpose = "aws-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "aws_credentials" {
  secret_id = aws_secretsmanager_secret.aws_credentials.id

  secret_string = jsonencode({
    AWS_ACCESS_KEY_ID     = aws_iam_access_key.s3_access.id
    AWS_SECRET_ACCESS_KEY = aws_iam_access_key.s3_access.secret
    SES_SMTP_USERNAME     = aws_iam_access_key.ses_smtp.id
    SES_SMTP_PASSWORD     = aws_iam_access_key.ses_smtp.secret
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
