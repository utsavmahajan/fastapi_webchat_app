from jose import JWTError,jwt
from datetime import datetime,timedelta
from . import schema
from fastapi import status,HTTPException,Depends
from fastapi.security import OAuth2PasswordBearer
from .config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='login')

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp" : expire})
    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)

def verify_access_token(token : str ,credentials_exceptions):
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        id: str = payload.get("user_id")
        if id is None:
            raise credentials_exceptions
        token_data = schema.TokenData(id=id)
    except JWTError:
        raise credentials_exceptions
    return token_data
    
def get_current_user(token: str = Depends(oauth2_scheme)):
    credential_exception = HTTPException(status_code = status.HTTP_401_UNAUTHORIZED,
                                          detail= "could not verify the credentials",headers = {"WWW_Authenticate" : "Bearer"})
    return verify_access_token(token,credential_exception)
    