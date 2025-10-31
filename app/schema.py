from pydantic import BaseModel,EmailStr
from datetime import datetime
from typing import Optional,Literal

class Usercreate(BaseModel):
    email :EmailStr
    password: str

class UserOut(BaseModel):
    id : int
    email : EmailStr

class UserLogin(BaseModel):
    email : EmailStr
    password : str

class PostBase(BaseModel):
    title: str
    content: str
    published: bool = True


class PostCreate(BaseModel):
    title: str
    content: str
    published: bool = True


class UpdatePost(BaseModel):
    published: bool


class Post(PostBase):
    id: int
    created_at: datetime
    owner_id: int
    owner : UserOut

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class Vote(BaseModel):
    post_id: int
    dir: Literal[0,1]

class PostOut(BaseModel):
    Post: Post
    votes: int
    class Config:
        from_attributes = True