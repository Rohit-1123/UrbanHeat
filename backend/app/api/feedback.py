from typing import Literal, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Feedback

router = APIRouter(prefix="/api", tags=["Feedback"])


class FeedbackIn(BaseModel):
    is_correct: bool
    topic: Literal["heat_risk", "routes", "weather", "other"]
    comment: Optional[str] = Field(None, max_length=500)
    location_name: Optional[str] = Field(None, max_length=120)


@router.post("/feedback", status_code=201)
def submit_feedback(data: FeedbackIn, db: Session = Depends(get_db)):
    """Stores a user's verdict on whether the shown information was correct."""
    db.add(Feedback(**data.model_dump()))
    db.commit()
    return {"status": "received"}
