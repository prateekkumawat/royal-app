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

# Custom EventBus
resource "aws_cloudwatch_event_bus" "order_bus" {
  name = "order-events-bus"
}

# SQS Queue for Inventory Service
resource "aws_sqs_queue" "inventory_queue" {
  name = "inventory-update-queue"
}

# EventBridge Rule 1: OrderPlaced -> Payment Lambda
resource "aws_cloudwatch_event_rule" "order_placed_rule" {
  name           = "order-placed-rule"
  event_bus_name = aws_cloudwatch_event_bus.order_bus.name

  event_pattern = jsonencode({
    source      = ["com.ecommerce.orders"]
    detail-type = ["OrderPlaced"]
  })
}

# SQS Policy allowing EventBridge to send messages
resource "aws_sqs_queue_policy" "inventory_queue_policy" {
  queue_url = aws_sqs_queue.inventory_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.inventory_queue.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_cloudwatch_event_rule.order_placed_rule.arn }
      }
    }]
  })
}

# Target: EventBridge -> Inventory SQS Queue
resource "aws_cloudwatch_event_target" "inventory_target" {
  rule           = aws_cloudwatch_event_rule.order_placed_rule.name
  event_bus_name = aws_cloudwatch_event_bus.order_bus.name
  target_id      = "InventorySQSTarget"
  arn            = aws_sqs_queue.inventory_queue.arn
}
