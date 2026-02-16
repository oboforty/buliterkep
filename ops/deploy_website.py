import boto3

import os
import mimetypes
import boto3

#from dev_app import appbuilder

S3_BUCKET = 'buliterkep-website'
DISTRIBUTION_ID = 'E3TYHQ53GZ5HQS'

ROOT_DIR = '../'
STATIC_DIR = f'{ROOT_DIR}/static/public'
SRC_DIR = f'{ROOT_DIR}/src'
DIST_DIR = f'{ROOT_DIR}/dist'

s3_client = boto3.client('s3')
cf_client = boto3.client('cloudfront')


def upload_directory_to_s3(local_directory, bucket_name, s3_prefix=''):
    for root, dirs, files in os.walk(local_directory):
        for filename in files:
            if 'data/' in filename:
                continue

            local_path = os.path.join(root, filename)
            relative_path = os.path.relpath(local_path, local_directory)
            s3_path = os.path.join(s3_prefix, relative_path).replace("\\", "/")

            file, _ext = os.path.splitext(filename)
            s3_client.upload_file(
              Filename=local_path,
              Bucket=bucket_name,
              Key=s3_path,
              ExtraArgs={
                'ContentType': mimetypes.types_map[_ext]
              }
            )
            print(f"Uploaded {local_path} to s3://{bucket_name}/{s3_path}")


if __name__ == "__main__":
    # Verify files are existing
    # if not os.path.exists(f'./static/dist.html'):
    #appbuilder.render('./static/dist', pretty=False, quoted_printable=True)

    # Client - upload bundle to s3
    upload_directory_to_s3(STATIC_DIR, S3_BUCKET)
    s3_client.upload_file(
        Filename=f'{DIST_DIR}/index.html',
        Bucket=S3_BUCKET,
        Key='index.html',
        ExtraArgs={
            'ContentType': "text/html",
            #'ACL': "public-read"
        }
    )
    s3_client.upload_file(
        Filename=f'{DIST_DIR}/main.js',
        Bucket=S3_BUCKET,
        Key='main.js',
        ExtraArgs={
            'ContentType': "text/javascript",
            #'ACL': "public-read"
        }
    )

    caller_ref = f"deploy_script"
    cf_client.create_invalidation(
        DistributionId=DISTRIBUTION_ID,
        InvalidationBatch={
            'Paths': {
                'Quantity': 1,
                'Items': [
                    '/*'
                ]
            },
            'CallerReference': caller_ref
        }
    )
    print("Invalidated CF")

    print("Finished")
