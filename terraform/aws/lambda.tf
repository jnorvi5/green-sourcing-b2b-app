# Lambda Functions for GreenChainz

# ============================================
# Lambda Execution Role
# ============================================
resource "aws_iam_role" "lambda_execution" {
  name = "gc-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Basic Lambda execution policy (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda policy for Secrets Manager, SNS, S3, Cost Explorer
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "gc-lambda-permissions"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.lambda_notifications.arn,
          aws_sns_topic.budget_alerts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.data_backups.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ce:GetCostAndUsage",
          "ce:GetCostForecast"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================
# SNS Topic for Lambda Notifications
# ============================================
resource "aws_sns_topic" "lambda_notifications" {
  name         = "gc-lambda-notifications"
  display_name = "GreenChainz Lambda Notifications"

  tags = {
    Name    = "Lambda Notifications"
    purpose = "lambda-notifications"
  }
}

resource "aws_sns_topic_subscription" "lambda_email" {
  topic_arn = aws_sns_topic.lambda_notifications.arn
  protocol  = "email"
  endpoint  = var.admin_email
}

# ============================================
# EC3 Sync Lambda
# ============================================
resource "aws_lambda_function" "ec3_sync" {
  function_name = "gc-ec3-sync"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = var.lambda_ec3_timeout
  memory_size   = var.lambda_ec3_memory

  filename         = "${path.module}/../../lambda/ec3-sync/function.zip"
  source_code_hash = fileexists("${path.module}/../../lambda/ec3-sync/function.zip") ? filebase64sha256("${path.module}/../../lambda/ec3-sync/function.zip") : null

  environment {
    variables = {
      AWS_REGION        = var.aws_region
      SECRET_NAME       = aws_secretsmanager_secret.api_keys.name
      SNS_TOPIC_ARN     = aws_sns_topic.lambda_notifications.arn
      MONGODB_DATABASE  = "greenchainz"
      MONGODB_COLLECTION = "ec3_materials"
    }
  }

  tags = {
    Name    = "EC3 Data Sync"
    purpose = "ec3-sync"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "ec3_sync" {
  name              = "/aws/lambda/${aws_lambda_function.ec3_sync.function_name}"
  retention_in_days = 30
}

# ============================================
# EPD Sync Lambda
# ============================================
resource "aws_lambda_function" "epd_sync" {
  function_name = "gc-epd-sync"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = var.lambda_epd_timeout
  memory_size   = var.lambda_epd_memory

  filename         = "${path.module}/../../lambda/epd-sync/function.zip"
  source_code_hash = fileexists("${path.module}/../../lambda/epd-sync/function.zip") ? filebase64sha256("${path.module}/../../lambda/epd-sync/function.zip") : null

  environment {
    variables = {
      AWS_REGION        = var.aws_region
      SECRET_NAME       = aws_secretsmanager_secret.api_keys.name
      SNS_TOPIC_ARN     = aws_sns_topic.lambda_notifications.arn
      MONGODB_DATABASE  = "greenchainz"
      MONGODB_COLLECTION = "epd_products"
    }
  }

  tags = {
    Name    = "EPD International Data Sync"
    purpose = "epd-sync"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "epd_sync" {
  name              = "/aws/lambda/${aws_lambda_function.epd_sync.function_name}"
  retention_in_days = 30
}

# ============================================
# Supabase Backup Lambda
# ============================================
resource "aws_lambda_function" "supabase_backup" {
  function_name = "gc-supabase-backup"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = var.lambda_backup_timeout
  memory_size   = var.lambda_backup_memory

  filename         = "${path.module}/../../lambda/supabase-backup/function.zip"
  source_code_hash = fileexists("${path.module}/../../lambda/supabase-backup/function.zip") ? filebase64sha256("${path.module}/../../lambda/supabase-backup/function.zip") : null

  environment {
    variables = {
      AWS_REGION    = var.aws_region
      SECRET_NAME   = aws_secretsmanager_secret.api_keys.name
      SNS_TOPIC_ARN = aws_sns_topic.lambda_notifications.arn
      BACKUP_BUCKET = aws_s3_bucket.data_backups.id
    }
  }

  tags = {
    Name    = "Supabase Backup"
    purpose = "database-backup"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "supabase_backup" {
  name              = "/aws/lambda/${aws_lambda_function.supabase_backup.function_name}"
  retention_in_days = 30
}

# ============================================
# Cost Monitor Lambda
# ============================================
resource "aws_lambda_function" "cost_monitor" {
  function_name = "gc-cost-monitor"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = var.lambda_cost_timeout
  memory_size   = var.lambda_cost_memory

  filename         = "${path.module}/../../lambda/cost-monitor/function.zip"
  source_code_hash = fileexists("${path.module}/../../lambda/cost-monitor/function.zip") ? filebase64sha256("${path.module}/../../lambda/cost-monitor/function.zip") : null

  environment {
    variables = {
      AWS_REGION                 = var.aws_region
      SNS_TOPIC_ARN              = aws_sns_topic.budget_alerts.arn
      MONTHLY_BUDGET             = tostring(var.monthly_budget)
      WARNING_THRESHOLD_PERCENT  = "80"
      CRITICAL_THRESHOLD_PERCENT = "100"
    }
  }

  tags = {
    Name    = "Cost Monitor"
    purpose = "cost-monitoring"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_cloudwatch_log_group" "cost_monitor" {
  name              = "/aws/lambda/${aws_lambda_function.cost_monitor.function_name}"
  retention_in_days = 30
}
