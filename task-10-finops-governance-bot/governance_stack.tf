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

# SNS Notification Topic for FinOps Alerts
resource "aws_sns_topic" "finops_alerts" {
  name = "finops-governance-alerts"
}

# AWS Config Rule 1: S3 Public Read Prohibited
resource "aws_config_config_rule" "s3_public_read" {
  name = "s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }
}

# AWS Config Rule 2: Unattached EC2 EBS Volume Check
resource "aws_config_config_rule" "ebs_attached_check" {
  name = "ec2-volume-inuse-check"

  source {
    owner             = "AWS"
    source_identifier = "EC2_VOLUME_INUSE_CHECK"
  }
}

# EventBridge Cron Trigger for Daily FinOps Cost Report (Runs at 08:00 AM UTC)
resource "aws_cloudwatch_event_rule" "daily_cost_cron" {
  name                = "daily-cost-anomaly-check"
  schedule_expression = "cron(0 8 * * ? *)"
}
