from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()


@router.get("/")
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get progress for a user."""
    return {"message": f"Progress for user {user_id}"}


@router.post("/")
async def update_progress(
    user_id: int,
    lesson_id: int,
    score: float = None,
    db: Session = Depends(get_db),
):
    """Update progress for a lesson."""
    return {"message": "Progress updated"}


@router.get("/stats")
async def get_progress_stats(user_id: int, db: Session = Depends(get_db)):
    """Get overall progress statistics."""
    return {
        "total_lessons": 38,
        "completed_lessons": 0,
        "reading_progress": 0,
        "listening_progress": 0,
        "writing_progress": 0,
        "speaking_progress": 0,
        "streak_days": 0,
        "total_time_minutes": 0,
    }
