import datetime
import boto3

ec2_client = boto3.client('ec2')

def lambda_handler(event, context):
    # Find all unattached (available) EBS volumes
    volumes = ec2_client.describe_volumes(
        Filters=[{'Name': 'status', 'Values': ['available']}]
    )

    deleted_count = 0
    for volume in volumes.get('Volumes', []):
        vol_id = volume['VolumeId']
        create_time = volume['CreateTime']
        age_days = (datetime.datetime.now(datetime.timezone.utc) - create_time).days

        # Delete unattached volumes older than 7 days
        if age_days >= 7:
            print(f"🗑️ [EBS Cleaner] Snapshotting & deleting orphan volume {vol_id} (Age: {age_days} days)")
            
            # Create safety snapshot first
            ec2_client.create_snapshot(
                VolumeId=vol_id,
                Description=f"Pre-deletion snapshot of orphaned volume {vol_id}"
            )
            # Delete volume
            ec2_client.delete_volume(VolumeId=vol_id)
            deleted_count += 1

    return {
        'statusCode': 200,
        'body': f'Cleaned {deleted_count} orphaned EBS volumes.'
    }
