from .. import models, schema, oauth
from fastapi import Response, status, HTTPException, Depends, APIRouter, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from typing import List, Optional
from sqlalchemy import func
import requests
from ..config import settings
import uuid
from ..s3 import upload_file

router = APIRouter(prefix="/posts", tags=["Post"])

@router.get("/", response_model=List[schema.PostOut])
def get_posts(
    db: Session = Depends(get_db),
    current_user: int = Depends(oauth.get_current_user),
    limit: int = 1000,
    skip: int = 0,
    search: Optional[str] = "",
):
    # 1. Fetch posts from DB
    results = (
        db.query(models.Post, func.count(models.Vote.post_id).label("votes"))
        .join(models.Vote, models.Vote.post_id == models.Post.id, isouter=True)
        .group_by(models.Post.id)
        .filter(models.Post.content.contains(search))
        .limit(limit)
        .offset(skip)
        .all()
    )
    bucket_name = settings.s3_bucket_name
    region = getattr(settings, 'aws_region', 'us-east-1')
    s3_base_url = f"https://{bucket_name}.s3.{region}.amazonaws.com/"
    response = []
    for post, votes in results:
        final_image_url = post.image_key
        if post.image_key and not post.image_key.startswith("http"):
            final_image_url = f"{s3_base_url}{post.image_key}"

        response.append({
            "Post": post,
            "votes": votes,
            "image_url": final_image_url 
        })
    
    return response


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schema.Post)
def createpost(
    content: str = Form(""),  # Allow empty content if file is provided
    published: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user_id=Depends(oauth.get_current_user),
):
    image_key = None
    if file:
        print(f"Uploading file: {file.filename}, content_type: {file.content_type}")
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Upload to S3 and get the URL
        image_key = upload_file(file, unique_filename)
        print(f"File uploaded to S3: {image_key}")

    # Save to Database
    new_post = models.Post(
        owner_id=user_id.id,
        content=content,
        published=published,
        image_key=image_key 
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # AI Integration (@eva)
    if "@eva" in content:
        url = settings.url
        payload = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": content.replace("@eva", "").strip()}],
                }
            ]
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.api_key}",
        }
        
        ai_reply = "I could not generate a response."
        try:
            resp = requests.post(url, json=payload, headers=headers)
            resp_json = resp.json()
            ai_reply = resp_json["output"]["message"]["content"][0]["text"]
        except Exception as e:
            print("AI Request Failed:", e)

        # Create the AI's reply post
        ai_post = models.Post(
            owner_id=user_id.id,
            content=ai_reply,
            published=True,
        )
        db.add(ai_post)
        db.commit()
        db.refresh(ai_post)

    # Always return the original post (not the AI reply)
    return new_post


@router.get("/{id}", response_model=schema.PostOut)
def get_post(
    id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(oauth.get_current_user),
):
    post = (
        db.query(models.Post, func.count(models.Vote.post_id).label("votes"))
        .join(models.Vote, models.Vote.post_id == models.Post.id, isouter=True)
        .group_by(models.Post.id)
        .filter(models.Post.id == id)
        .first()
    )

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {id} not found",
        )

    post_data, votes = post
    return {
        "Post": post_data, 
        "votes": votes,
        "image_url": post_data.image_key  # Map image_key to image_url
    }


@router.delete("/{id}")
def delete_post(
    id: int,
    status_code=status.HTTP_204_NO_CONTENT,
    db: Session = Depends(get_db),
    user_id=Depends(oauth.get_current_user),
):
    post_querry = db.query(models.Post).filter(models.Post.id == id)
    post = post_querry.first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User of id: {id} not found"
        )
    if post.owner_id != user_id.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authorise to perform the Action",
        )
    post_querry.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{id}")
def updae_post(
    id: int,
    updated_post: schema.UpdatePost,
    db: Session = Depends(get_db),
    user_id=Depends(oauth.get_current_user),
):
    post_querry = db.query(models.Post).filter(models.Post.id == id)
    post = post_querry.first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User of id: {id} not found"
        )
    if post.owner_id != user_id.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authorise to perform the Action",
        )
    post_querry.update(updated_post.dict(), synchronize_session=False)
    db.commit()
    return {"message": post_querry.first()}