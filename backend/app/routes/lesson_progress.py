from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.lesson_progress import LessonProgress
from app.models.user_activity import UserActivity
from app.schemas.lesson_progress import LessonProgressCreate, LessonProgressResponse
from app.core.auth import get_current_user
from app.models.user import User
import json

router = APIRouter()

@router.post("/complete", response_model=LessonProgressResponse)
def complete_lesson(
    progress: LessonProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a lesson as complete"""
    
    # Check if already completed
    existing = db.query(LessonProgress).filter(
        LessonProgress.user_id == current_user.id,
        LessonProgress.lesson_id == progress.lesson_id,
        LessonProgress.module == progress.module
    ).first()
    
    if existing:
        return existing
    
    # Create new progress record
    db_progress = LessonProgress(
        user_id=current_user.id,
        lesson_id=progress.lesson_id,
        module=progress.module,
        completed=True
    )
    
    db.add(db_progress)
    
    # Track activity for admin panel
    activity = UserActivity(
        user_id=current_user.id,
        activity_type="lesson_complete",
        module=progress.module,
        lesson_id=progress.lesson_id,
        details=json.dumps({"lesson": progress.lesson_id})
    )
    db.add(activity)
    
    db.commit()
    db.refresh(db_progress)
    
    return db_progress

@router.get("/", response_model=List[LessonProgressResponse])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all completed lessons for current user"""
    progress = db.query(LessonProgress).filter(
        LessonProgress.user_id == current_user.id
    ).all()
    
    return progress

@router.get("/{module}", response_model=List[LessonProgressResponse])
def get_module_progress(
    module: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get completed lessons for a specific module"""
    progress = db.query(LessonProgress).filter(
        LessonProgress.user_id == current_user.id,
        LessonProgress.module == module
    ).all()
    
    return progress
