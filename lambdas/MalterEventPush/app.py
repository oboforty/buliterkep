import os
import json
import uuid

import boto3
from botocore.exceptions import ClientError


# Required keys for event validation
REQUIRED_KEYS = {'event_by', 'title', 'time', 'about1', 'loc1'}

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table("MalterEventPush")


def push_event(event):
	pass


def handler(event, context):
	"""
	Lambda handler for processing events.
	
	Supports both single event dict and list of event dicts.
	Returns 400 if input format is invalid.
	Processes valid events and inserts them into DynamoDB.
	"""
	try:
		if isinstance(event.get('body'), str):
			body = json.loads(event['body'])
		else:
			body = event.get('body', {})
		
		if isinstance(body, list):
			valid_events = []
			invalid_count = 0
			
			for item in body:
				if isinstance(item, dict) and REQUIRED_KEYS.issubset(item.keys()):
					event_id = str(uuid.uuid4())
					item['id'] = event_id
					valid_events.append(item)
				else:
					invalid_count += 1
			
			# Insert valid events into DynamoDB
			inserted_count = 0
			errors = []
			
			for event_item in valid_events:
				try:
					table.put_item(Item=event_item)
					inserted_count += 1
				except ClientError as e:
					errors.append({
						'event_id': event_item.get('id'),
						'error': str(e)
					})
			
			return {
				'statusCode': 200,
				'headers': {
					'Content-Type': 'application/json'
				},
				'body': json.dumps({
					'message': 'Processing completed',
					'inserted': inserted_count,
					'invalid': invalid_count,
					'errors': errors if errors else None
				})
			}
		
		elif isinstance(body, dict):
			if not REQUIRED_KEYS.issubset(body.keys()):
				return {
					'statusCode': 400,
					'headers': {
						'Content-Type': 'application/json'
					},
					'body': json.dumps({
						'error': 'Missing required keys',
						'required_keys': list(REQUIRED_KEYS),
						'received_keys': list(body.keys())
					})
				}
			
			# Generate UUID4 as primary key
			event_id = str(uuid.uuid4())
			body['id'] = event_id
			
			try:
				table.put_item(Item=body)
				return {
					'statusCode': 200,
					'headers': {
						'Content-Type': 'application/json'
					},
					'body': json.dumps({
						'message': 'Event inserted successfully',
						'id': event_id
					})
				}
			except ClientError as e:
				return {
					'statusCode': 500,
					'headers': {
						'Content-Type': 'application/json'
					},
					'body': json.dumps({
						'error': 'Failed to insert event',
						'details': str(e)
					})
				}
		
		else:
			# Invalid input format
			return {
				'statusCode': 400,
				'headers': {
					'Content-Type': 'application/json'
				},
				'body': json.dumps({
					'error': 'Invalid input format. Expected a dictionary or list of dictionaries.'
				})
			}
	
	except json.JSONDecodeError:
		return {
			'statusCode': 400,
			'headers': {
				'Content-Type': 'application/json'
			},
			'body': json.dumps({
				'error': 'Invalid JSON in request body'
			})
		}
	except Exception as e:
		return {
			'statusCode': 500,
			'headers': {
				'Content-Type': 'application/json'
			},
			'body': json.dumps({
				'error': 'Internal server error',
				'details': str(e)
			})
		}
