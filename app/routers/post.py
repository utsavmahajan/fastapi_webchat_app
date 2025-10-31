from .. import models,schema,oauth
from fastapi import Response, status, HTTPException, Depends,APIRouter
from sqlalchemy.orm import Session
from ..database import get_db
from typing import List,Optional
from sqlalchemy import func

router = APIRouter(prefix='/posts',tags=['Post'])

@router.get("/", response_model=List[schema.PostOut])
def get_posts(db: Session = Depends(get_db),current_user: int = Depends(oauth.get_current_user),limit: int = 10,skip: int =0,search: Optional[str] = ""):
    results = db.query(models.Post,func.count(models.Vote.post_id).label("Votes")).join(models.Vote,models.Vote.post_id == models.Post.id,isouter=True).group_by(models.Post.id).filter(models.Post.content.contains(search)).limit(limit).offset(skip).all() # <-- FIXED LINE
    return [{"Post": post, "votes": votes} for post, votes in results]


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schema.Post)
def createpost(post: schema.PostCreate, db: Session = Depends(get_db),user_id = Depends(oauth.get_current_user)):
    new_post = models.Post(
        owner_id = user_id.id,content=post.content, published=post.published
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.get("/{id}", response_model=schema.PostOut)
def get_post(
    id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(oauth.get_current_user)
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
    return {"Post": post_data, "votes": votes}

@router.delete("/{id}")
def delete_post(id: int, status_code=status.HTTP_204_NO_CONTENT, db: Session = Depends(get_db),user_id = Depends(oauth.get_current_user)):
    post_querry = db.query(models.Post).filter(models.Post.id == id)
    post = post_querry.first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User of id: {id} not found"
        )
    if post.owner_id != user_id.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorise to perform the Action"
        )
    post_querry.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{id}")
def updae_post(id: int, updated_post: schema.UpdatePost, db: Session = Depends(get_db),user_id = Depends(oauth.get_current_user)):
    post_querry = db.query(models.Post).filter(models.Post.id == id)
    post = post_querry.first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"User of id: {id} not found"
        )
    if post.owner_id != user_id.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authorise to perform the Action"
        )
    post_querry.update(updated_post.dict(), synchronize_session=False)
    db.commit()
    return {"message": post_querry.first()}