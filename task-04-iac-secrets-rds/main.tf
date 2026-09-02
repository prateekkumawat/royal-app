terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# KMS Customer Managed Key
resource "aws_kms_key" "db_key" {
  description             = "KMS Key for RDS Database & Secret Encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
  }
}

# VPC & Isolated DB Subnets
resource "aws_vpc" "db_vpc" {
  cidr_block           = "10.100.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_subnet" "db_isolated_1" {
  vpc_id            = aws_vpc.db_vpc.id
  cidr_block        = "10.100.1.0/24"
  availability_zone = "${var.aws_region}a"
}

resource "aws_subnet" "db_isolated_2" {
  vpc_id            = aws_vpc.db_vpc.id
  cidr_block        = "10.100.2.0/24"
  availability_zone = "${var.aws_region}b"
}

resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = [aws_subnet.db_isolated_1.id, aws_subnet.db_isolated_2.id]
}

# Random DB Password Generation
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# AWS Secrets Manager Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.environment}/fintech-db-creds-v2"
  kms_key_id              = aws_kms_key.db_key.arn
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db_credentials_version" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "db_admin"
    password = random_password.db_password.result
    engine   = "postgres"
    port     = 5432
  })
}

# Security Group for DB
resource "aws_security_group" "db_sg" {
  name        = "${var.environment}-db-sg"
  description = "Security Group for Isolated RDS PostgreSQL"
  vpc_id      = aws_vpc.db_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.100.0.0/16"] # Only internal VPC traffic allowed
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Multi-AZ RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier             = "${var.environment}-postgres-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t4g.micro"
  db_name                = var.db_name
  username               = "db_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  multi_az              = true
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.db_key.arn
  publicly_accessible   = false
  skip_final_snapshot   = true

  tags = {
    Environment = var.environment
  }
}
