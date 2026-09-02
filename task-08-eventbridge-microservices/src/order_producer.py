import json
import uuid
import datetime
import boto3

eventbridge = boto3.client('events')

EVENT_BUS_NAME = "order-events-bus"

def lambda_handler(event, context):
    order_id = str(uuid.uuid4())
    order_payload = {
        'orderId': order_id,
        'customerId': 'CUST-10492',
        'amount': 249.99,
        'currency': 'USD',
        'items': ['SKU-100', 'SKU-204'],
        'timestamp': datetime.datetime.utcnow().isoformat()
    }

    response = eventbridge.put_events(
        Entries=[
            {
                'Source': 'com.ecommerce.orders',
                'DetailType': 'OrderPlaced',
                'Detail': json.dumps(order_payload),
                'EventBusName': EVENT_BUS_NAME
            }
        ]
    )

    print(f"Emitted OrderPlaced event: {json.dumps(order_payload)}")

    return {
        'statusCode': 200,
        'body': json.dumps({'orderId': order_id, 'status': 'Event Published'})
    }
