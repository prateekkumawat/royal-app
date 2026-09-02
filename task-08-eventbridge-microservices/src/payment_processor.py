import json

def lambda_handler(event, context):
    detail = event.get('detail', {})
    order_id = detail.get('orderId')
    amount = detail.get('amount')

    print(f"💰 [Payment Microservice] Processing payment for Order ID: {order_id}, Amount: ${amount}")
    
    # Simulate payment processing success
    return {
        'statusCode': 200,
        'body': json.dumps({'orderId': order_id, 'paymentStatus': 'SUCCESS'})
    }
