terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}

# Primary & Secondary Backup Vaults
resource "aws_backup_vault" "primary_vault" {
  provider    = aws.primary
  name        = "primary-backup-vault"
  kms_key_arn = "arn:aws:kms:us-east-1:123456789012:key/default" # Replace with actual KMS Key ARN
}

resource "aws_backup_vault" "secondary_vault" {
  provider = aws.secondary
  name     = "secondary-dr-vault"
}

# AWS Backup Plan with Automated Cross-Region Copy
resource "aws_backup_plan" "dr_plan" {
  provider = aws.primary
  name     = "cross-region-dr-backup-plan"

  rule {
    rule_name         = "daily-backup-cross-region-copy"
    target_vault_name = aws_backup_vault.primary_vault.name
    schedule          = "cron(0 12 * * ? *)"

    lifecycle {
      delete_after = 30
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.secondary_vault.arn

      lifecycle {
        delete_after = 90
      }
    }
  }
}

# S3 Versioned Buckets with Cross-Region Replication (CRR)
resource "aws_s3_bucket" "primary_bucket" {
  provider = aws.primary
  bucket   = "dr-primary-data-bucket-us-east-1"
}

resource "aws_s3_bucket_versioning" "primary_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "secondary_bucket" {
  provider = aws.secondary
  bucket   = "dr-secondary-replica-bucket-us-west-2"
}

resource "aws_s3_bucket_versioning" "secondary_versioning" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication_role" {
  provider = aws.primary
  name     = "s3ReplicationRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
    }]
  })
}

resource "aws_s3_bucket_replication_configuration" "crr" {
  provider   = aws.primary
  depends_on = [aws_s3_bucket_versioning.primary_versioning]

  role   = aws_iam_role.replication_role.arn
  bucket = aws_s3_bucket.primary_bucket.id

  rule {
    id     = "FullBucketReplication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary_bucket.arn
      storage_class = "STANDARD"
    }
  }
}
