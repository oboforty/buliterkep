
resource "aws_s3_bucket" "buliterkep_website" {
  bucket = "buliterkep-website"
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.buliterkep_website.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [
        "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.origin_access_identity.id}"
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "buliterkep_website_policy" {
  bucket = aws_s3_bucket.buliterkep_website.id
  policy = data.aws_iam_policy_document.s3_policy.json
}


locals {
  default_certs = ["default"]
#  acm_certs     = var.use_default_domain ? [] : ["acm"]
#  domain_name   = var.use_default_domain ? [] : [var.domain_name]
}

resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {
  comment = "access-identity-buliterkep.s3.amazonaws.com"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  depends_on = [
    aws_s3_bucket.buliterkep_website
  ]

  origin {
    domain_name = aws_s3_bucket.buliterkep_website.bucket_regional_domain_name
    origin_id   = "s3-cloudfront"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

#  aliases = local.domain_name

  default_cache_behavior {
    allowed_methods = [
      "GET",
      "HEAD",
    ]

    cached_methods = [
      "GET",
      "HEAD",
    ]

    target_origin_id = "s3-cloudfront"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"

    # https://stackoverflow.com/questions/67845341/cloudfront-s3-etag-possible-for-cloudfront-to-send-updated-s3-object-before-t
    min_ttl     = var.cloudfront_min_ttl
    default_ttl = var.cloudfront_default_ttl
    max_ttl     = var.cloudfront_max_ttl
  }

#  price_class = var.price_class

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations = []
    }
  }
  dynamic "viewer_certificate" {
    for_each = local.default_certs
    content {
      cloudfront_default_certificate = true
    }
  }

#  dynamic "viewer_certificate" {
#    for_each = local.acm_certs
#    content {
#      acm_certificate_arn      = data.aws_acm_certificate.acm_cert[0].arn
#      ssl_support_method       = "sni-only"
#      minimum_protocol_version = "TLSv1"
#    }
#  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    error_caching_min_ttl = 0
    response_page_path    = "/index.html"
  }

  wait_for_deployment = false
#  tags                = var.tags
}
