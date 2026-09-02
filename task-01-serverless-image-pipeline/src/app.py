import os
import io
import uuid
import datetime
import urllib.parse
import boto3
from PIL import Image

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')

RESIZED_BUCKET = os.environ.get('RESIZED_BUCKET')
METADATA_TABLE = os.environ.get('METADATA_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
    table = dynamodb.Table(METADATA_TABLE)

    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')

        # Download raw image from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        image_content = response['Body'].read()

        # Resize image using Pillow
        image = Image.open(io.BytesIO(image_content))
        original_size = image.size
        image.thumbnail((200, 200))

        buffer = io.BytesIO()
        image.save(buffer, format=image.format or 'JPEG')
        buffer.seek(0)

        # Upload thumbnail to resized bucket
        resized_key = f"resized-{key}"
        s3_client.put_object(
            Bucket=RESIZED_BUCKET,
            Key=resized_key,
            Body=buffer,
            ContentType=response.get('ContentType', 'image/jpeg')
        )

        # Record metadata in DynamoDB
        image_id = str(uuid.uuid4())
        item = {
            'ImageId': image_id,
            'OriginalKey': key,
            'ResizedKey': resized_key,
            'OriginalDimensions': f"{original_size[0]}x{original_size[1]}",
            'ResizedDimensions': f"{image.size[0]}x{image.size[1]}",
            'UploadedAt': datetime.datetime.utcnow().isoformat()
        }
        table.put_item(Item=item)

        # Publish notification event to SNS
        message = f"Successfully processed image {key}. Thumbnail saved as {resized_key}."
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Image Processing Completed",
            Message=message
        )

    return {
        'statusCode': 200,
        'body': 'Image processing completed successfully'
    }
