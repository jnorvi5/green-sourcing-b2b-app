# CloudFront CDN for GreenChainz

# ============================================
# Origin Access Identity for S3
# ============================================
resource "aws_cloudfront_origin_access_identity" "product_images" {
  comment = "OAI for GreenChainz product images"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "product_images_cloudfront" {
  bucket = aws_s3_bucket.product_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.product_images.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.product_images.arn}/*"
      }
    ]
  })
}

# ============================================
# CloudFront Distribution
# ============================================
resource "aws_cloudfront_distribution" "product_images" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GreenChainz Product Images CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe
  http_version        = "http2and3"

  aliases = [var.cloudfront_domain]

  origin {
    domain_name = aws_s3_bucket.product_images.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.product_images.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.product_images.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.product_images.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800    # 7 days
    max_ttl                = 31536000  # 1 year
    compress               = true
  }

  # Cache behavior for images
  ordered_cache_behavior {
    path_pattern     = "*.jpg"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.product_images.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800    # 7 days
    max_ttl                = 31536000  # 1 year
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "*.png"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.product_images.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800
    max_ttl                = 31536000
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "*.webp"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.product_images.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800
    max_ttl                = 31536000
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # Uncomment and configure after setting up ACM certificate:
    # acm_certificate_arn      = aws_acm_certificate.cdn.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name    = "Product Images CDN"
    purpose = "cdn"
  }
}

# ============================================
# Route 53 Record (if using custom domain)
# ============================================
# Uncomment after setting up hosted zone:
#
# data "aws_route53_zone" "main" {
#   name = var.domain_name
# }
#
# resource "aws_route53_record" "cdn" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = var.cloudfront_domain
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.product_images.domain_name
#     zone_id                = aws_cloudfront_distribution.product_images.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
