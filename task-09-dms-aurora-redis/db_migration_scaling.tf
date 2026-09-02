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

# Target Aurora MySQL Cluster
resource "aws_rds_cluster" "aurora_cluster" {
  cluster_identifier      = "aurora-mysql-cluster"
  engine                  = "aurora-mysql"
  engine_version          = "8.0.mysql_aurora.3.04.0"
  database_name           = "ecommerce"
  master_username         = "aurora_admin"
  master_password         = "SecureAuroraPass123!"
  skip_final_snapshot     = true
  apply_immediately       = true
}

# Aurora Primary Writer Instance
resource "aws_rds_cluster_instance" "aurora_writer" {
  identifier         = "aurora-writer-1"
  cluster_identifier = aws_rds_cluster.aurora_cluster.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.aurora_cluster.engine
  engine_version     = aws_rds_cluster.aurora_cluster.engine_version
}

# Aurora Auto-Scaling Read Replica Instance
resource "aws_rds_cluster_instance" "aurora_reader" {
  identifier         = "aurora-reader-1"
  cluster_identifier = aws_rds_cluster.aurora_cluster.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.aurora_cluster.engine
  engine_version     = aws_rds_cluster.aurora_cluster.engine_version
}

# ElastiCache Redis Cluster for Read Caching Layer
resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id           = "app-redis-cache"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# AWS DMS Replication Instance
resource "aws_dms_replication_instance" "dms_instance" {
  replication_instance_id     = "dms-migration-instance"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 50
  publicly_accessible         = false
  apply_immediately           = true
}

# DMS Endpoints
resource "aws_dms_endpoint" "source_mysql" {
  endpoint_id                 = "source-mysql-endpoint"
  endpoint_type               = "source"
  engine_name                 = "mysql"
  username                    = "source_admin"
  password                    = "SourcePass123!"
  server_name                 = "source-db.example.com"
  port                        = 3306
}

resource "aws_dms_endpoint" "target_aurora" {
  endpoint_id                 = "target-aurora-endpoint"
  endpoint_type               = "target"
  engine_name                 = "aurora"
  username                    = aws_rds_cluster.aurora_cluster.master_username
  password                    = aws_rds_cluster.aurora_cluster.master_password
  server_name                 = aws_rds_cluster.aurora_cluster.endpoint
  port                        = 3306
}

# DMS Migration Task (Full Load + CDC)
resource "aws_dms_replication_task" "migration_task" {
  replication_task_id      = "mysql-to-aurora-cdc-task"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.dms_instance.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source_mysql.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target_aurora.endpoint_arn
  table_mappings           = jsonencode({
    rules = [{
      rule-type = "selection"
      rule-id   = "1"
      rule-name = "all_tables"
      object-locator = {
        schema-name = "ecommerce"
        table-name  = "%"
      }
      rule-action = "include"
    }]
  })
}
