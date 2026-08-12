"""Simple S3 helper functions used by the GUI.

This module provides small wrappers around boto3 for creating a client,
listing objects, uploading and downloading files. The functions raise
the underlying exceptions so the UI can report errors to the user.
"""

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from typing import List, Optional


def create_s3_client(aws_access_key_id: Optional[str] = None,
					 aws_secret_access_key: Optional[str] = None,
					 region_name: Optional[str] = None):
	"""Create and return a boto3 S3 client.

	If keys are omitted, boto3 will fall back to the default credential
	resolution chain (env vars, shared credentials file, IAM role, etc.).
	"""
	session = boto3.Session(
		aws_access_key_id=aws_access_key_id,
		aws_secret_access_key=aws_secret_access_key,
		region_name=region_name,
	)
	return session.client('s3')


def list_objects(client, bucket_name: str, prefix: str = '') -> List[str]:
	"""Return list of object keys in `bucket_name` optionally filtered by `prefix`."""
	try:
		paginator = client.get_paginator('list_objects_v2')
		page_iterator = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
		keys: List[str] = []
		for page in page_iterator:
			for obj in page.get('Contents', []):
				keys.append(obj['Key'])
		return keys
	except (BotoCoreError, ClientError):
		raise


def upload_file(client, bucket_name: str, key: str, filename: str) -> None:
	"""Upload local `filename` to `bucket_name` at object `key`."""
	try:
		client.upload_file(Filename=filename, Bucket=bucket_name, Key=key)
	except (BotoCoreError, ClientError):
		raise


def download_file(client, bucket_name: str, key: str, filename: str) -> None:
	"""Download S3 object `key` from `bucket_name` to local `filename`."""
	try:
		client.download_file(Bucket=bucket_name, Key=key, Filename=filename)
	except (BotoCoreError, ClientError):
		raise

