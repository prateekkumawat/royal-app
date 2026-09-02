output "db_endpoint" {
  value       = aws_db_instance.postgres.endpoint
  description = "RDS PostgreSQL Endpoint"
}

output "secret_arn" {
  value       = aws_secretsmanager_secret.db_credentials.arn
  description = "Secrets Manager Secret ARN"
}
