# AWS Budgets and Cost Monitoring for GreenChainz

# ============================================
# SNS Topic for Budget Alerts
# ============================================
resource "aws_sns_topic" "budget_alerts" {
  name         = "gc-budget-alerts"
  display_name = "GreenChainz Budget Alerts"

  tags = {
    Name    = "Budget Alerts"
    purpose = "cost-monitoring"
  }
}

resource "aws_sns_topic_subscription" "budget_alerts_email" {
  topic_arn = aws_sns_topic.budget_alerts.arn
  protocol  = "email"
  endpoint  = var.admin_email
}

# SNS Topic Policy for AWS Budgets
resource "aws_sns_topic_policy" "budget_alerts" {
  arn = aws_sns_topic.budget_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowBudgetsPublish"
        Effect = "Allow"
        Principal = {
          Service = "budgets.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.budget_alerts.arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# ============================================
# AWS Budget - $100 Monthly
# ============================================
resource "aws_budgets_budget" "monthly" {
  name         = "gc-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name = "TagKeyValue"
    values = [
      "user:project$greenchainz",
      "user:environment$production"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.admin_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.admin_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.admin_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.admin_email]
  }
}

# ============================================
# CloudWatch Alarms for Cost Anomalies
# ============================================
resource "aws_cloudwatch_metric_alarm" "daily_cost_spike" {
  alarm_name          = "gc-daily-cost-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DailyCost"
  namespace           = "GreenChainz/Costs"
  period              = 86400 # 24 hours
  statistic           = "Sum"
  threshold           = 10 # $10/day is high for $100/month budget
  alarm_description   = "Daily cost exceeded $10"

  dimensions = {
    Project = "greenchainz"
  }

  alarm_actions = [aws_sns_topic.budget_alerts.arn]
  ok_actions    = [aws_sns_topic.budget_alerts.arn]

  treat_missing_data = "notBreaching"

  tags = {
    Name    = "Daily Cost Spike Alarm"
    purpose = "cost-monitoring"
  }
}

resource "aws_cloudwatch_metric_alarm" "budget_warning" {
  alarm_name          = "gc-budget-warning"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BudgetUsedPercent"
  namespace           = "GreenChainz/Costs"
  period              = 86400
  statistic           = "Maximum"
  threshold           = 80
  alarm_description   = "Budget usage exceeded 80%"

  dimensions = {
    Project = "greenchainz"
  }

  alarm_actions = [aws_sns_topic.budget_alerts.arn]

  treat_missing_data = "notBreaching"

  tags = {
    Name    = "Budget Warning Alarm"
    purpose = "cost-monitoring"
  }
}

# ============================================
# CloudWatch Dashboard for Costs
# ============================================
resource "aws_cloudwatch_dashboard" "costs" {
  dashboard_name = "GreenChainz-Costs"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Month-to-Date Cost"
          region = var.aws_region
          metrics = [
            ["GreenChainz/Costs", "MonthToDateCost", "Project", "greenchainz", { stat = "Maximum" }]
          ]
          view   = "singleValue"
          period = 86400
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Budget Used %"
          region = var.aws_region
          metrics = [
            ["GreenChainz/Costs", "BudgetUsedPercent", "Project", "greenchainz", { stat = "Maximum" }]
          ]
          view   = "gauge"
          period = 86400
          yAxis = {
            left = {
              min = 0
              max = 150
            }
          }
          annotations = {
            horizontal = [
              { value = 80, color = "#ff7f0e", label = "Warning" },
              { value = 100, color = "#d62728", label = "Critical" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          title  = "Daily Cost Trend"
          region = var.aws_region
          metrics = [
            ["GreenChainz/Costs", "DailyCost", "Project", "greenchainz"]
          ]
          view   = "timeSeries"
          period = 86400
          stat   = "Sum"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "Forecasted Monthly Cost"
          region = var.aws_region
          metrics = [
            ["GreenChainz/Costs", "ForecastedMonthCost", "Project", "greenchainz", { stat = "Maximum" }]
          ]
          view   = "singleValue"
          period = 86400
        }
      },
      {
        type   = "text"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          markdown = <<-EOF
## Cost Management Tips

- **Budget**: $${var.monthly_budget}/month
- **Warning Threshold**: 80% ($${var.monthly_budget * 0.8})
- **Critical Threshold**: 100% ($${var.monthly_budget})

### Actions when budget exceeded:
1. Review Lambda invocation frequency
2. Check S3 storage growth
3. Optimize CloudFront cache
4. Review API call patterns
EOF
        }
      }
    ]
  })
}
