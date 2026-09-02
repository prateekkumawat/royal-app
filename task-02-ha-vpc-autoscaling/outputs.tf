output "alb_dns_name" {
  description = "Application Load Balancer DNS Name"
  value       = aws_lb.web_alb.dns_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}
