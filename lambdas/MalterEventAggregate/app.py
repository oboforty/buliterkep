import os
import json
import uuid
from datetime import datetime, date, timedelta

import boto3
from botocore.exceptions import ClientError

from cf_invalidate import invalidate_cloudfront

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table("MalterEventPush")

s3 = boto3.client('s3')

S3_BUCKET = os.environ.get("S3_BUCKET")
S3_KEY = "events.json"

UPDATE_CLOUDFRONT = bool(os.environ.get('INVALIDATE', True))


def download_existing_json() -> list[dict]:
    """Download existing JSON array from S3 if it exists."""
    try:
        response = s3.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
        content = response["Body"].read().decode("utf-8")
        return json.loads(content)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return []  # File doesn't exist yet
        else:
            raise e

def is_recent_event(event: dict) -> bool:
    """
    Returns true if event is held in the future, or was held yesterday.
    the map app will further filter these events based on time, we just want to clear old events from the JSON
    """
    timestamps = event["dates"]

    for timestamp in timestamps:
        dt = datetime.fromtimestamp(timestamp)
        yesterday = date.today() - timedelta(days=1)
        dt_date = dt.date()
        if dt_date >= yesterday:
            return True
    # none of the dates satisfied the >=yesterday condition
    return False


def handler(event, context):
    """
	Lambda handler for aggregating processed events into one giant json file
	"""

    # TODO: HMAC verify caller's identity (if lambda function url)

    # Scan table with pagination
    items = []
    response = table.scan()
    items.extend(response.get("Items", []))

    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    # filter out too old events (from previous scans)
    new_events: int = 0
    data = download_existing_json()
    for event in data:
        if is_recent_event(event):
            items.append(event)
            new_events += 1

    # TODO: better logging
    print(f"[Mapp] {new_events} new events parsed.")

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=S3_KEY,
        Body=json.dumps(items),
        ContentType="application/json"
    )

    if UPDATE_CLOUDFRONT:
        invalidate_cloudfront(s3_key=S3_KEY)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": f"Exported {new_events} new items ({len(items)} total) to s3://{S3_BUCKET}/{S3_KEY}"
        })
    }
