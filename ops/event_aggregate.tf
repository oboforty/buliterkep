
##
## IAM Policies
##
data "aws_iam_policy_document" "mapp_aggregator_lambda_trust_policy_document" {
  statement {
    actions    = [
      "sts:AssumeRole"
    ]
    effect     = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "mapp_aggregator_lambda_role" {
  name               = "mapp_aggregator_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.mapp_aggregator_lambda_trust_policy_document.json
}

resource "aws_iam_role_policy_attachment" "mapp_aggregator_lambda_policy1" {
  role       = aws_iam_role.mapp_aggregator_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

##
## DDB->S3 Aggregator for Lambda (specific table)
##
data "aws_iam_policy_document" "mapp_aggregator_lambda_policy_document" {
  statement {
    actions = [
      "cloudfront:CreateInvalidation",
    ]
    effect = "Allow"
    resources = [aws_cloudfront_distribution.s3_distribution.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:Scan"
    ]
    resources = [
      "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/MalterEventPush"
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    effect = "Allow"
    resources = [
      aws_s3_bucket.buliterkep_website.arn,
      "${aws_s3_bucket.buliterkep_website.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "mapp_aggregator_lambda_dynamodb" {
  name   = "mapp_aggregator_lambda_dynamodb_put"
  policy = data.aws_iam_policy_document.mapp_aggregator_lambda_policy_document.json
}

resource "aws_iam_role_policy_attachment" "mapp_aggregator_lambda_dynamodb" {
  role       = aws_iam_role.mapp_aggregator_lambda_role.name
  policy_arn = aws_iam_policy.mapp_aggregator_lambda_dynamodb.arn
}

##
## Lambda Event Pusher
##
data "archive_file" "mapp_aggregator_event_push_lambda_files" {
  type        = "zip"
  source_dir  = "../lambdas/MalterEventAggregate"
  output_path = "../tmp/mapp_aggregator_push_lamb.zip"
}

resource "aws_lambda_function" "MappEventAggregator" {
  function_name = "MalterEventAggregate"

  filename         = data.archive_file.mapp_aggregator_event_push_lambda_files.output_path
  source_code_hash = data.archive_file.mapp_aggregator_event_push_lambda_files.output_base64sha256

  runtime          = "python3.13"
  role             = aws_iam_role.mapp_aggregator_lambda_role.arn

  handler = "app.handler"

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.buliterkep_website.id
      CLOUDFRONT_DIST = aws_cloudfront_distribution.s3_distribution.id
    }
  }
}

## 
## Public URL (no api gw)
## 
resource "aws_lambda_function_url" "mapp_aggregator_url" {
  function_name      = aws_lambda_function.MappEventAggregator.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["HEAD", "POST"]
    allow_headers = ["*"]
  }
}


## 
## Cloudfront invalidation
## 
resource "aws_iam_policy" "mapp_cf_policy" {
  name        = "MappCFInvalidatePolicy"
  description = "Enables Mapp lambda to invalidate JSON data"
  policy      = data.aws_iam_policy_document.mapp_aggregator_lambda_policy_document.json
}

resource "aws_iam_role_policy_attachment" "mapp_lambda_policy2" {
  role       = aws_iam_role.mapp_aggregator_lambda_role.name
  policy_arn = aws_iam_policy.mapp_cf_policy.arn
}
