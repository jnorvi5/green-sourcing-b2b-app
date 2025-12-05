# AWS SES Configuration for GreenChainz

# ============================================
# SES Domain Identity
# ============================================
resource "aws_ses_domain_identity" "main" {
  domain = var.domain_name
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.domain_name}"
}

# ============================================
# SES Configuration Set
# ============================================
resource "aws_ses_configuration_set" "transactional" {
  name = "gc-transactional"

  reputation_metrics_enabled = true
  sending_enabled            = true

  delivery_options {
    tls_policy = "REQUIRE"
  }
}

# ============================================
# SNS Topics for Bounce/Complaint Handling
# ============================================
resource "aws_sns_topic" "ses_bounces" {
  name         = "gc-ses-bounces"
  display_name = "GreenChainz SES Bounces"

  tags = {
    Name    = "SES Bounces"
    purpose = "email-bounces"
  }
}

resource "aws_sns_topic_subscription" "ses_bounces_email" {
  topic_arn = aws_sns_topic.ses_bounces.arn
  protocol  = "email"
  endpoint  = var.admin_email
}

resource "aws_sns_topic" "ses_complaints" {
  name         = "gc-ses-complaints"
  display_name = "GreenChainz SES Complaints"

  tags = {
    Name    = "SES Complaints"
    purpose = "email-complaints"
  }
}

resource "aws_sns_topic_subscription" "ses_complaints_email" {
  topic_arn = aws_sns_topic.ses_complaints.arn
  protocol  = "email"
  endpoint  = var.admin_email
}

# ============================================
# SES Event Destinations
# ============================================
resource "aws_ses_event_destination" "bounces" {
  name                   = "bounce-notifications"
  configuration_set_name = aws_ses_configuration_set.transactional.name
  enabled                = true
  matching_types         = ["bounce", "reject"]

  sns_destination {
    topic_arn = aws_sns_topic.ses_bounces.arn
  }
}

resource "aws_ses_event_destination" "complaints" {
  name                   = "complaint-notifications"
  configuration_set_name = aws_ses_configuration_set.transactional.name
  enabled                = true
  matching_types         = ["complaint"]

  sns_destination {
    topic_arn = aws_sns_topic.ses_complaints.arn
  }
}

# ============================================
# SES Email Templates
# ============================================
resource "aws_ses_template" "rfq_notification" {
  name    = "gc-rfq-notification"
  subject = "New RFQ Request: {{productName}}"
  
  html = <<-EOF
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .cta { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New RFQ Request</h1>
    </div>
    <div class="content">
      <p>Hello {{supplierName}},</p>
      <p>You have received a new Request for Quote (RFQ) on GreenChainz.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Product:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{productName}}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Quantity:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{quantity}}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Deadline:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{deadline}}</td></tr>
      </table>
      <p><strong>Message from buyer:</strong></p>
      <p style="background: white; padding: 15px; border-left: 4px solid #10B981;">{{buyerMessage}}</p>
      <a href="https://greenchainz.com/dashboard/supplier/rfqs" class="cta">View RFQ Details</a>
    </div>
    <div class="footer">
      <p>&copy; 2024 GreenChainz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
EOF

  text = <<-EOF
Hello {{supplierName}},

You have received a new Request for Quote (RFQ) on GreenChainz.

Product: {{productName}}
Quantity: {{quantity}}
Deadline: {{deadline}}

Message from buyer:
{{buyerMessage}}

Please log in to your dashboard to respond:
https://greenchainz.com/dashboard/supplier/rfqs

Best regards,
The GreenChainz Team
EOF
}

resource "aws_ses_template" "supplier_verification" {
  name    = "gc-supplier-verification"
  subject = "Congratulations! Your GreenChainz Supplier Account is Verified"
  
  html = <<-EOF
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .cta { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Verification Complete!</h1>
    </div>
    <div class="content">
      <p>Hello {{supplierName}},</p>
      <p>Great news! Your supplier account on GreenChainz has been <strong>verified</strong>.</p>
      <p><strong>Company:</strong> {{companyName}}</p>
      <p><strong>Verified Certifications:</strong> {{certifications}}</p>
      <h3>You can now:</h3>
      <ul>
        <li>List products in the marketplace</li>
        <li>Receive RFQs from verified buyers</li>
        <li>Access our sustainability analytics</li>
      </ul>
      <a href="https://greenchainz.com/dashboard/supplier" class="cta">Go to Dashboard</a>
    </div>
    <div class="footer">
      <p>Welcome to the GreenChainz community!</p>
      <p>&copy; 2024 GreenChainz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
EOF

  text = <<-EOF
Hello {{supplierName}},

Great news! Your supplier account on GreenChainz has been verified.

Company: {{companyName}}
Verified Certifications: {{certifications}}

You can now:
- List products in the marketplace
- Receive RFQs from verified buyers
- Access our sustainability analytics

Get started by logging into your dashboard:
https://greenchainz.com/dashboard/supplier

Welcome to the GreenChainz community!

Best regards,
The GreenChainz Team
EOF
}

resource "aws_ses_template" "green_audit_report" {
  name    = "gc-green-audit-report"
  subject = "Your Green Audit Report is Ready - {{projectName}}"
  
  html = <<-EOF
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .metric-value { font-size: 24px; font-weight: bold; color: #10B981; }
    .cta { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌱 Green Audit Report</h1>
      <p>{{projectName}}</p>
    </div>
    <div class="content">
      <p>Hello {{userName}},</p>
      <p>Your Green Audit report has been generated and is ready for review.</p>
      <div class="metric">
        <p>Total Carbon Footprint</p>
        <p class="metric-value">{{totalCarbon}} kg CO2e</p>
      </div>
      <div class="metric">
        <p>Materials Analyzed</p>
        <p class="metric-value">{{materialsCount}}</p>
      </div>
      <div class="metric">
        <p>Sustainability Score</p>
        <p class="metric-value">{{sustainabilityScore}}/100</p>
      </div>
      <h3>Key Recommendations:</h3>
      <p>{{recommendations}}</p>
      <a href="https://greenchainz.com/dashboard/buyer/audits/{{auditId}}" class="cta">View Full Report</a>
    </div>
    <div class="footer">
      <p>&copy; 2024 GreenChainz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
EOF

  text = <<-EOF
Hello {{userName}},

Your Green Audit report for "{{projectName}}" has been generated.

Summary:
- Total Carbon Footprint: {{totalCarbon}} kg CO2e
- Materials Analyzed: {{materialsCount}}
- Sustainability Score: {{sustainabilityScore}}/100

Key Recommendations:
{{recommendations}}

View your full report:
https://greenchainz.com/dashboard/buyer/audits/{{auditId}}

Best regards,
The GreenChainz Team
EOF
}

# ============================================
# IAM User for SES SMTP
# ============================================
resource "aws_iam_user" "ses_smtp" {
  name = "greenchainz-ses-smtp"

  tags = {
    Name    = "SES SMTP User"
    purpose = "ses-smtp"
  }
}

resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}

resource "aws_iam_user_policy" "ses_smtp" {
  name = "gc-ses-send-policy"
  user = aws_iam_user.ses_smtp.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
          "ses:SendBulkTemplatedEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = "noreply@${var.domain_name}"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ses:GetSendQuota",
          "ses:GetSendStatistics"
        ]
        Resource = "*"
      }
    ]
  })
}
