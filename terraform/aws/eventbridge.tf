# EventBridge Scheduled Rules for GreenChainz

# ============================================
# EC3 Daily Sync - 2 AM UTC
# ============================================
resource "aws_cloudwatch_event_rule" "ec3_daily_sync" {
  name                = "gc-ec3-daily-sync"
  description         = "Trigger EC3 data sync Lambda daily at 2 AM UTC"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = {
    Name    = "EC3 Daily Sync"
    purpose = "ec3-sync"
  }
}

resource "aws_cloudwatch_event_target" "ec3_sync" {
  rule      = aws_cloudwatch_event_rule.ec3_daily_sync.name
  target_id = "EC3SyncLambda"
  arn       = aws_lambda_function.ec3_sync.arn

  input = jsonencode({
    source   = "eventbridge"
    trigger  = "scheduled"
    schedule = "daily"
  })
}

resource "aws_lambda_permission" "ec3_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec3_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec3_daily_sync.arn
}

# ============================================
# EPD Weekly Sync - Sundays at 3 AM UTC
# ============================================
resource "aws_cloudwatch_event_rule" "epd_weekly_sync" {
  name                = "gc-epd-weekly-sync"
  description         = "Trigger EPD International data sync Lambda weekly on Sundays at 3 AM UTC"
  schedule_expression = "cron(0 3 ? * SUN *)"

  tags = {
    Name    = "EPD Weekly Sync"
    purpose = "epd-sync"
  }
}

resource "aws_cloudwatch_event_target" "epd_sync" {
  rule      = aws_cloudwatch_event_rule.epd_weekly_sync.name
  target_id = "EPDSyncLambda"
  arn       = aws_lambda_function.epd_sync.arn

  input = jsonencode({
    source   = "eventbridge"
    trigger  = "scheduled"
    schedule = "weekly"
  })
}

resource "aws_lambda_permission" "epd_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.epd_sync.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.epd_weekly_sync.arn
}

# ============================================
# Supabase Backup - Daily at 4 AM UTC
# ============================================
resource "aws_cloudwatch_event_rule" "supabase_backup" {
  name                = "gc-supabase-backup"
  description         = "Trigger Supabase backup Lambda daily at 4 AM UTC"
  schedule_expression = "cron(0 4 * * ? *)"

  tags = {
    Name    = "Supabase Daily Backup"
    purpose = "database-backup"
  }
}

resource "aws_cloudwatch_event_target" "supabase_backup" {
  rule      = aws_cloudwatch_event_rule.supabase_backup.name
  target_id = "SupabaseBackupLambda"
  arn       = aws_lambda_function.supabase_backup.arn

  input = jsonencode({
    source   = "eventbridge"
    trigger  = "scheduled"
    schedule = "daily"
  })
}

resource "aws_lambda_permission" "supabase_backup_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.supabase_backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.supabase_backup.arn
}

# ============================================
# Cost Check - Daily at 6 AM UTC
# ============================================
resource "aws_cloudwatch_event_rule" "cost_check" {
  name                = "gc-cost-check"
  description         = "Trigger cost monitoring Lambda daily at 6 AM UTC"
  schedule_expression = "cron(0 6 * * ? *)"

  tags = {
    Name    = "Cost Daily Check"
    purpose = "cost-monitoring"
  }
}

resource "aws_cloudwatch_event_target" "cost_monitor" {
  rule      = aws_cloudwatch_event_rule.cost_check.name
  target_id = "CostMonitorLambda"
  arn       = aws_lambda_function.cost_monitor.arn

  input = jsonencode({
    source   = "eventbridge"
    trigger  = "scheduled"
    schedule = "daily"
  })
}

resource "aws_lambda_permission" "cost_monitor_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cost_check.arn
}
