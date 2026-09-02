import json

def lambda_handler(event, context):
    # Retrieve claims extracted by Cognito Authorizer
    claims = event['requestContext']['authorizer']['claims']
    username = claims.get('cognito:username', 'unknown')
    email = claims.get('email', 'N/A')

    response_body = {
        'status': 'authorized',
        'message': f'Welcome to Enterprise SaaS API, {username}!',
        'user_email': email,
        'request_id': context.aws_request_id
    }

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body)
    }
