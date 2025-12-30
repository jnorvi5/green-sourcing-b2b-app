# S3 Buckets for GreenChainz

# ============================================
# Product Images Bucket (Public via CloudFront)
# ============================================
resource "aws_s3_bucket" "product_images" {
  bucket = "gc-product-images-prod"

  tags = {
    Name    = "GreenChainz Product Images"
    purpose = "product-images"
  }
}

resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = [
      "https://greenchainz.com",
      "https://www.greenchainz.com",
      "https://*.azurewebsites.net"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# ============================================
# EPD Documents Bucket (Private, Signed URLs)
# ============================================
resource "aws_s3_bucket" "epd_documents" {
  bucket = "gc-epd-documents-prod"

  tags = {
    Name       = "GreenChainz EPD Documents"
    purpose    = "epd-documents"
    compliance = "7-year-retention"
  }
}

resource "aws_s3_bucket_versioning" "epd_documents" {
  bucket = aws_s3_bucket.epd_documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "epd_documents" {
  bucket = aws_s3_bucket.epd_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "epd_documents" {
  bucket = aws_s3_bucket.epd_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "epd_documents" {
  bucket = aws_s3_bucket.epd_documents.id

  rule {
    id     = "retain-all-versions-7-years"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 2555 # ~7 years
    }
  }
}

# ============================================
# Data Backups Bucket (Private, Cross-Region Replication)
# ============================================
resource "aws_s3_bucket" "data_backups" {
  bucket = "gc-data-backups-prod"

  tags = {
    Name    = "GreenChainz Data Backups"
    purpose = "database-backups"
  }
}

resource "aws_s3_bucket_versioning" "data_backups" {
  bucket = aws_s3_bucket.data_backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_backups" {
  bucket = aws_s3_bucket.data_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_backups" {
  bucket = aws_s3_bucket.data_backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "data_backups" {
  bucket = aws_s3_bucket.data_backups.id

  rule {
    id     = "transition-and-expire"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Backup Replication Bucket in us-west-2
resource "aws_s3_bucket" "data_backups_replica" {
  provider = aws.west
  bucket   = "gc-data-backups-replica-us-west-2"

  tags = {
    Name    = "GreenChainz Data Backups Replica"
    purpose = "database-backups-replica"
  }
}

resource "aws_s3_bucket_versioning" "data_backups_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.data_backups_replica.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_backups_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.data_backups_replica.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_backups_replica" {
  provider = aws.west
  bucket   = aws_s3_bucket.data_backups_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Replication IAM Role
resource "aws_iam_role" "s3_replication" {
  name = "gc-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_replication" {
  name = "gc-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.data_backups.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.data_backups.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.data_backups_replica.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "data_backups" {
  bucket = aws_s3_bucket.data_backups.id
  role   = aws_iam_role.s3_replication.arn

  rule {
    id     = "cross-region-replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.data_backups_replica.arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.data_backups]
}

# ============================================
# S3 Access User for Application
# ============================================
resource "aws_iam_user" "s3_access" {
  name = "greenchainz-s3-service"

  tags = {
    Name    = "GreenChainz S3 Service User"
    purpose = "s3-access"
  }
}

resource "aws_iam_access_key" "s3_access" {
  user = aws_iam_user.s3_access.name
}

resource "aws_iam_user_policy" "s3_access" {
  name = "gc-s3-access-policy"
  user = aws_iam_user.s3_access.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          "${aws_s3_bucket.product_images.arn}/*",
          "${aws_s3_bucket.epd_documents.arn}/*",
          "${aws_s3_bucket.data_backups.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.product_images.arn,
          aws_s3_bucket.epd_documents.arn,
          aws_s3_bucket.data_backups.arn
        ]
      }
    ]
  })
}
