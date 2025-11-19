import boto3
from botocore.exceptions import NoCredentialsError
from .config import settings

s3 = boto3.client(
    's3',
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name='us-east-1'
)

BUCKET_NAME = settings.s3_bucket_name

def upload_file(file, filename: str):
    try:
        s3.upload_fileobj(
            file.file, 
            BUCKET_NAME, 
            filename,
            ExtraArgs={'ContentType': file.content_type} 
        )
        
        url = f"https://{BUCKET_NAME}.s3.{settings.aws_region}.amazonaws.com/{filename}"
        return url
    except Exception as e:
        print(f"Something happened: {e}")
        return None