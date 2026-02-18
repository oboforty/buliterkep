import os
import random

import boto3
from botocore.exceptions import ClientError


distributionId = os.environ['CLOUDFRONT_DIST']

cloudfront = boto3.client(
    'cloudfront',
    region_name='eu-central-1'
)


def invalidate_cloudfront(s3_key):
    caller_ref = f"lambda_{random.randint(100, 999)}"
    cloudfront.create_invalidation(
        DistributionId=distributionId,
        InvalidationBatch={
            'Paths': {
                'Quantity': 1,
                'Items': [
                    f'/{s3_key}'
                ]
            },
            'CallerReference': caller_ref
        }
    )
