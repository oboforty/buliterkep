# data "aws_iam_policy_document" "AWSLambdaTrustPolicy" {
#   statement {
#     actions    = [
#       "sts:AssumeRole"
#     ]
#     effect     = "Allow"
#     principals {
#       type        = "Service"
#       identifiers = ["lambda.amazonaws.com"]
#     }
#   }
# }

# resource "aws_iam_role" "buliterkep_lambda_role" {
#   name               = "buliterkep_lambda_role"
#   assume_role_policy = data.aws_iam_policy_document.AWSLambdaTrustPolicy.json
# }

# resource "aws_iam_role_policy_attachment" "buliterkep_lambda_policy1" {
#   role       = aws_iam_role.buliterkep_lambda_role.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
# }

# data "aws_iam_policy_document" "AWSCloudfrontInvalidatePolicy_BT" {
#   statement {
#     actions = [
#       "cloudfront:CreateInvalidation",
#     ]
#     effect = "Allow"
#     resources = [aws_cloudfront_distribution.s3_distribution.arn]
#   }

#   statement {
#     actions = [
#       "s3:GetObject",
#       "s3:PutObject",
#     ]
#     effect = "Allow"
#     resources = [
#       aws_s3_bucket.buliterkep_website.arn,
#       "${aws_s3_bucket.buliterkep_website.arn}/*"
#     ]
#   }
# }

# resource "aws_iam_policy" "buliterkep_cf_policy" {
#   name        = "AWSCloudfrontInvalidatePolicy_BT"
#   description = "Enables lambda to invalidate ECB data"
#   policy      = data.aws_iam_policy_document.AWSCloudfrontInvalidatePolicy_BT.json

# }

# resource "aws_iam_role_policy_attachment" "buliterkep_lambda_policy2" {
#   role       = aws_iam_role.buliterkep_lambda_role.name
#   policy_arn = aws_iam_policy.buliterkep_cf_policy.arn
# }

