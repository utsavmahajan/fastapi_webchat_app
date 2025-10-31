from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto", truncate_error=False)

def hash(password:str):
    return pwd_context.hash(password)

def verify(plain_password,hashed_password):
    return pwd_context.verify(plain_password,hashed_password)