# terraform/variables.tf
# Variables for Lambda and SNS configuration

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_service_key" {
  description = "Supabase service role key (server-side only)"
  type        = string
  sensitive   = true
}

variable "epd_api_url" {
  description = "EPD International API endpoint"
  type        = string
  default     = "https://epd-apim.developer.azure-api.net/v1/epds"
}

variable "epd_api_key" {
  description = "EPD International API subscription key"
  type        = string
  sensitive   = true
}
