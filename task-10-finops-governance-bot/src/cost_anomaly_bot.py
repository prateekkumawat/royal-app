import datetime
import os
import boto3

ce_client = boto3.client('ce')
sns_client = boto3.client('sns')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    start_date = (today - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
    end_date = today.strftime('%Y-%m-%d')

    # Query Cost Explorer API
    response = ce_client.get_cost_and_usage(
        TimePeriod={'Start': start_date, 'End': end_date},
        Granularity='DAILY',
        Metrics=['UnblendedCost']
    )

    results = response.get('ResultsByTime', [])
    if len(results) >= 2:
        yesterday_cost = float(results[-1]['Total']['UnblendedCost']['Amount'])
        prev_avg = sum([float(r['Total']['UnblendedCost']['Amount']) for r in results[:-1]]) / len(results[:-1])

        print(f"💰 Yesterday Cost: ${yesterday_cost:.2f} | 7-Day Avg: ${prev_avg:.2f}")

        # Detect cost spike > 20%
        if yesterday_cost > (prev_avg * 1.20) and yesterday_cost > 10.0:
            message = (
                f"🚨 AWS FinOps Alert: Cost Anomaly Detected!\n\n"
                f"Yesterday Spend: ${yesterday_cost:.2f}\n"
                f"7-Day Average: ${prev_avg:.2f}\n"
                f"Spike Percentage: {((yesterday_cost - prev_avg)/prev_avg)*100:.1f}%\n"
            )
            if SNS_TOPIC_ARN:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="⚠️ AWS Cost Anomaly Notification",
                    Message=message
                )

    return {
        'statusCode': 200,
        'body': 'FinOps Cost Audit Completed'
    }
