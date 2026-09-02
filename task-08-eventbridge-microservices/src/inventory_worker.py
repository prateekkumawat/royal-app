import json

def lambda_handler(event, context):
    for record in event.get('Records', []):
        body = json.loads(record['body'])
        detail = body.get('detail', {})
        order_id = detail.get('orderId')
        items = detail.get('items', [])

        print(f"📦 [Inventory Worker] Reserving stock for Order ID: {order_id}, Items: {items}")

    return {
        'statusCode': 200,
        'body': 'Inventory processing complete'
    }
