
##
## IAM Policies
##
data "aws_iam_policy_document" "mapp_push_lambda_trust_policy" {
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

resource "aws_iam_role" "mapp_push_lambda_role" {
  name               = "mapp_push_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.mapp_push_lambda_trust_policy.json
}

resource "aws_iam_role_policy_attachment" "mapp_push_lambda_policy1" {
  role       = aws_iam_role.mapp_push_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

##
## DynamoDB PutItem for Lambda (specific table)
##

data "aws_iam_policy_document" "mapp_push_lambda_dynamodb" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:BatchWriteItem"
    ]
    resources = [
      "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/MalterEventPush"
    ]
  }
}

resource "aws_iam_policy" "mapp_push_lambda_dynamodb" {
  name   = "mapp_push_lambda_dynamodb_put"
  policy = data.aws_iam_policy_document.mapp_push_lambda_dynamodb.json
}

resource "aws_iam_role_policy_attachment" "mapp_push_lambda_dynamodb" {
  role       = aws_iam_role.mapp_push_lambda_role.name
  policy_arn = aws_iam_policy.mapp_push_lambda_dynamodb.arn
}

##
## Lambda Event Pusher
##
data "archive_file" "mapp_event_push_lambda_files" {
  type        = "zip"
  source_dir  = "../lambdas/MalterEventPush"
  output_path = "../tmp/mapp_push_push_lamb.zip"
}

resource "aws_lambda_function" "MappEventPusher" {
  function_name = "MalterEventPush"

  filename         = data.archive_file.mapp_event_push_lambda_files.output_path
  source_code_hash = data.archive_file.mapp_event_push_lambda_files.output_base64sha256

  runtime          = "python3.13"
  role             = aws_iam_role.mapp_push_lambda_role.arn

  handler = "app.handler"
}

## 
## Public URL (no api gw)
## 
resource "aws_lambda_function_url" "mapp_push_url" {
  function_name      = aws_lambda_function.MappEventPusher.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["HEAD", "POST"]
    allow_headers = ["*"]
  }
}
