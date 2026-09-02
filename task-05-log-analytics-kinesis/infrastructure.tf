terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Kinesis Data Stream
resource "aws_kinesis_stream" "log_stream" {
  name             = "log-analytics-stream"
  shard_count      = 1
  retention_period = 24
}

# SNS Alert Topic
resource "aws_sns_topic" "log_alerts" {
  name = "log-anomaly-alerts-topic"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/apps/production-api"
  retention_in_days = 7
}

# IAM Role for CloudWatch Logs Subscription Filter to write to Kinesis
resource "aws_iam_role" "cw_to_kinesis_role" {
  name = "cwToKinesisRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "logs.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "cw_to_kinesis_policy" {
  role = aws_iam_role.cw_to_kinesis_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["kinesis:PutRecord", "kinesis:PutRecords"]
      Resource = aws_kinesis_stream.log_stream.arn
    }]
  })
}

# CloudWatch Subscription Filter filtering ERROR or 5xx logs
resource "aws_cloudwatch_log_subscription_filter" "error_filter" {
  name            = "error-log-subscription"
  log_group_name  = aws_cloudwatch_log_group.app_logs.name
  filter_pattern  = "?ERROR ?500 ?503"
  destination_arn = aws_kinesis_stream.log_stream.arn
  role_arn        = aws_iam_role.cw_to_kinesis_role.arn
}
