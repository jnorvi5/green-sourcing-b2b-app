terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Change as needed
}

resource "aws_s3_bucket" "assets_bucket" {
  bucket = "greencahinz-assets" # Must be globally unique

  tags = {
    Name        = "GreenChainz Assets"
    Environment = "Production"
  }
}

# Enable versioning for data safety
resource "aws_s3_bucket_versioning" "assets_versioning" {
  bucket = aws_s3_bucket.assets_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "assets_encryption" {
  bucket = aws_s3_bucket.assets_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block all public access (Private Bucket)
resource "aws_s3_bucket_public_access_block" "assets_block_public" {
  bucket = aws_s3_bucket.assets_bucket.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

# IAM User for the backend
resource "aws_iam_user" "backend_user" {
  name = "greenchainz-backend-user"
}

# Least Privilege Policy
resource "aws_iam_policy" "s3_upload_policy" {
  name        = "greenchainz-s3-upload-policy"
  description = "Allow backend to upload and read from assets bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject" # Optional, if you want to allow deletion
        ]
        Resource = "${aws_s3_bucket.assets_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.assets_bucket.arn
      }
    ]
  })
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "backend_attach" {
  user       = aws_iam_user.backend_user.name
  policy_arn = aws_iam_policy.s3_upload_policy.arn
}

# Create Access Key
resource "aws_iam_access_key" "backend_key" {
  user = aws_iam_user.backend_user.name
}

# Output credentials (SENSITIVE)
output "aws_access_key_id" {
  value = aws_iam_access_key.backend_key.id
}

output "aws_secret_access_key" {
  value     = aws_iam_access_key.backend_key.secret
  sensitive = true
}

output "s3_bucket_name" {
  value = aws_s3_bucket.assets_bucket.id
}
