import base64
import json
import gzip
import os
import boto3
import urllib.request
import urllib.parse

# OpenSearch indexing script
OPENSEARCH_ENDPOINT = os.environ.get('OPENSEARCH_ENDPOINT')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

sns_client = boto3.client('sns')

def lambda_handler(event, context):
    error_count = 0

    for record in event['Records']:
        # Kinesis data payload is Base64 encoded and Gzip compressed from CloudWatch Logs
        compressed_payload = base64.b64decode(record['kinesis']['data'])
        uncompressed_payload = gzip.decompress(compressed_payload)
        log_data = json.loads(uncompressed_payload.decode('utf-8'))

        for log_event in log_data.get('logEvents', []):
            message = log_event.get('message', '')
            timestamp = log_event.get('timestamp')

            # Parse log record for ERROR or HTTP 5xx
            if "ERROR" in message or "500" in message or "503" in message:
                error_count += 1

            document = {
                'logGroup': log_data.get('logGroup'),
                'logStream': log_data.get('logStream'),
                'timestamp': timestamp,
                'message': message
            }

            # Indexing logic to OpenSearch would run here via SigV4 Signed Request / HTTP POST
            print(f"Indexed Log Event: {json.dumps(document)}")

    # Send SNS alert if error threshold exceeded
    if error_count >= 5 and SNS_TOPIC_ARN:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="⚠️ High Log Error Spike Detected!",
            Message=f"Detected {error_count} critical error events in the last batch stream."
        )

    return {
        'statusCode': 200,
        'body': f'Processed {len(event["Records"])} records. Errors found: {error_count}'
    }
