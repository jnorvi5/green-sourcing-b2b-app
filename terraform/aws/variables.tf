# Variables for GreenChainz AWS Infrastructure

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "greenchainz.com"
}

variable "cloudfront_domain" {
  description = "CloudFront CDN domain"
  type        = string
  default     = "cdn.greenchainz.com"
}

variable "admin_email" {
  description = "Admin email for notifications"
  type        = string
  default     = "founder@greenchainz.com"
}

variable "monthly_budget" {
  description = "Monthly AWS budget in USD"
  type        = number
  default     = 100
}

# Lambda configuration
variable "lambda_ec3_timeout" {
  description = "Timeout for EC3 sync Lambda in seconds"
  type        = number
  default     = 300 # 5 minutes
}

variable "lambda_ec3_memory" {
  description = "Memory for EC3 sync Lambda in MB"
  type        = number
  default     = 512
}

variable "lambda_epd_timeout" {
  description = "Timeout for EPD sync Lambda in seconds"
  type        = number
  default     = 600 # 10 minutes
}

variable "lambda_epd_memory" {
  description = "Memory for EPD sync Lambda in MB"
  type        = number
  default     = 1024
}

variable "lambda_backup_timeout" {
  description = "Timeout for Supabase backup Lambda in seconds"
  type        = number
  default     = 900 # 15 minutes
}

variable "lambda_backup_memory" {
  description = "Memory for Supabase backup Lambda in MB"
  type        = number
  default     = 256
}

variable "lambda_cost_timeout" {
  description = "Timeout for cost monitor Lambda in seconds"
  type        = number
  default     = 120 # 2 minutes
}

variable "lambda_cost_memory" {
  description = "Memory for cost monitor Lambda in MB"
  type        = number
  default     = 256
}

# Secrets (sensitive)
variable "ec3_api_key" {
  description = "EC3 API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "epd_api_key" {
  description = "EPD International API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection URI"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_access_token" {
  description = "Supabase access token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_project_ref" {
  description = "Supabase project reference"
  type        = string
  sensitive   = true
  default     = ""
}
