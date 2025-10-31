from fastapi import status, HTTPException, Depends,APIRouter
from .. import schema,database,models,oauth
from sqlalchemy.orm import Session


router = APIRouter(
    prefix="/vote",
    tags=["Vote"]
)

@router.post("/",status_code=status.HTTP_201_CREATED)
def vote(vote: schema.Vote,db:Session = Depends(database.get_db),current_user = Depends(oauth.get_current_user)):
    post_query = db.query(models.Post).filter(models.Post.id == vote.post_id).first()
    if not post_query:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Post not found")
    vote_querry = db.query(models.Vote).filter(models.Vote.post_id == vote.post_id,
                                     models.Vote.user_id == current_user.id)
    found_vote = vote_querry.first()
    if(vote.dir == 1):
        if found_vote:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail=
                                f"user {current_user.id} hass already voted on post {vote.post_id}")
        new_vote = models.Vote(post_id = vote.post_id,user_id=current_user.id)
        db.add(new_vote)
        db.commit()
        return {"message":"success"}
    else:
        if not found_vote:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=
                                "Vote does not exist")
        vote_querry.delete(synchronize_session=False)
        db.commit()
        return {"message" : "succesfully deleted vote"}