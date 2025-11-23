# terraform/lambda.tf
# AWS Lambda and SNS resources for EPD sync

# SNS Topic for error notifications
resource "aws_sns_topic" "epd_sync_errors" {
  name = "greenchainz-epd-sync-errors"
  
  tags = {
    Name        = "EPD Sync Error Notifications"
    Environment = "Production"
  }
}

# SNS Topic Subscription - Email to founder
resource "aws_sns_topic_subscription" "epd_sync_email" {
  topic_arn = aws_sns_topic.epd_sync_errors.arn
  protocol  = "email"
  endpoint  = "founder@greenchainz.com"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_epd_sync_role" {
  name = "greenchainz-lambda-epd-sync-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "EPD Sync Lambda Role"
  }
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_role_policy" "lambda_logging" {
  name = "lambda-logging-policy"
  role = aws_iam_role.lambda_epd_sync_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM Policy for Lambda - SNS Publish
resource "aws_iam_role_policy" "lambda_sns_publish" {
  name = "lambda-sns-publish-policy"
  role = aws_iam_role.lambda_epd_sync_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.epd_sync_errors.arn
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "epd_sync" {
  filename      = "lambda/greenchainz-epd-sync/function.zip"
  function_name = "greenchainz-epd-sync"
  role          = aws_iam_role.lambda_epd_sync_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 900 # 15 minutes
  memory_size   = 512 # MB

  environment {
    variables = {
      SUPABASE_URL          = var.supabase_url
      SUPABASE_SERVICE_KEY  = var.supabase_service_key
      EPD_API_URL           = var.epd_api_url
      EPD_API_KEY           = var.epd_api_key
      SNS_TOPIC_ARN         = aws_sns_topic.epd_sync_errors.arn
      ENVIRONMENT           = "production"
    }
  }

  tags = {
    Name        = "GreenChainz EPD Sync"
    Environment = "Production"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.epd_sync.function_name}"
  retention_in_days = 30 # Keep logs for 30 days

  tags = {
    Name = "EPD Sync Lambda Logs"
  }
}

# EventBridge (CloudWatch Events) Rule - Run daily at 2 AM UTC
resource "aws_cloudwatch_event_rule" "epd_sync_schedule" {
  name                = "greenchainz-epd-sync-daily"
  description         = "Trigger EPD sync Lambda daily at 2 AM UTC"
  schedule_expression = "cron(0 2 * * ? *)" # 2 AM UTC every day

  tags = {
    Name = "EPD Sync Schedule"
  }
}

# EventBridge Target - Invoke Lambda
resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.epd_sync_schedule.name
  target_id = "EPDSyncLambda"
  arn       = aws_lambda_function.epd_sync.arn
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.epd_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.epd_sync_schedule.arn
}

# Outputs
output "lambda_function_name" {
  value       = aws_lambda_function.epd_sync.function_name
  description = "EPD Sync Lambda function name"
}

output "lambda_function_arn" {
  value       = aws_lambda_function.epd_sync.arn
  description = "EPD Sync Lambda function ARN"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.epd_sync_errors.arn
  description = "SNS Topic ARN for error notifications"
}
