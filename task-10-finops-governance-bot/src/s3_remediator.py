import json
import boto3

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    # Triggered by AWS Config Non-Compliance Event for s3-bucket-public-read-prohibited
    detail = event.get('detail', {})
    resource_id = detail.get('resourceId')

    if resource_id:
        print(f"🔒 [S3 Remediator] Auto-enforcing Public Access Block on non-compliant bucket: {resource_id}")
        
        s3_client.put_public_access_block(
            Bucket=resource_id,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': True,
                'IgnorePublicAcls': True,
                'BlockPublicPolicy': True,
                'RestrictPublicBuckets': True
            }
        )
        print(f"✅ Successfully secured bucket {resource_id}")

    return {
        'statusCode': 200,
        'body': f'Remediated {resource_id}'
    }
