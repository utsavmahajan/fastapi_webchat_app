from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_hostname: str
    database_username: str
    database_port: str
    database_password: str
    database_name: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    api_key: str
    url: str
    aws_access_key_id : str
    aws_secret_access_key:str
    s3_bucket_name:str
    aws_region:str

    class Config:
        env_file = ".env"


settings = Settings()
