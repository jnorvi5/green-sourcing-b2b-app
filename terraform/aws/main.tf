# Terraform AWS Infrastructure for GreenChainz
# Production environment configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      project     = "greenchainz"
      environment = var.environment
      managed_by  = "terraform"
    }
  }
}

# Secondary provider for us-west-2 (backup replication)
provider "aws" {
  alias  = "west"
  region = "us-west-2"

  default_tags {
    tags = {
      project     = "greenchainz"
      environment = var.environment
      managed_by  = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
