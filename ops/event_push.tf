
##
## IAM Policies
##
data "aws_iam_policy_document" "buliterkep_lambda_trust_policy" {
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

resource "aws_iam_role" "buliterkep_lambda_role" {
  name               = "buliterkep_lambda_role"
  assume_role_policy = data.aws_iam_policy_document.buliterkep_lambda_trust_policy.json
}

resource "aws_iam_role_policy_attachment" "buliterkep_lambda_policy1" {
  role       = aws_iam_role.buliterkep_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

##
## Lambda Event Pusher
##
data "archive_file" "buliterkep_event_push_lambda_files" {
  type        = "zip"
  source_dir  = "../lambdas/MalterEventPush"
  output_path = "../tmp/buliterkep_push_lamb.zip"
}

resource "aws_lambda_function" "BuliterkepEventPusher" {
  function_name = "MalterEventPush"

  filename         = data.archive_file.buliterkep_event_push_lambda_files.output_path
  source_code_hash = data.archive_file.buliterkep_event_push_lambda_files.output_base64sha256

  runtime          = "python3.13"
  role             = aws_iam_role.buliterkep_lambda_role.arn

  handler = "app.handler"
}

## 
## Public URL (no api gw)
## 
resource "aws_lambda_function_url" "buliterkep_url" {
  function_name      = aws_lambda_function.BuliterkepEventPusher.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["HEAD", "POST"]
    allow_headers = ["*"]
  }
}
