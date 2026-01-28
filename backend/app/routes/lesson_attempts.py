from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.models.lesson_attempt import LessonAttempt
from app.schemas.lesson_attempt import LessonAttemptCreate, LessonAttemptUpdate, LessonAttemptResponse
from app.core.auth import get_current_user
from app.models.user import User
import json

router = APIRouter()

@router.post("/start", response_model=LessonAttemptResponse)
def start_lesson_attempt(
    attempt_data: LessonAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new lesson attempt or return existing one."""
    
    # Check if there's an existing incomplete attempt
    existing = db.query(LessonAttempt).filter(
        LessonAttempt.user_id == current_user.id,
        LessonAttempt.lesson_id == attempt_data.lesson_id,
        LessonAttempt.module == attempt_data.module,
        LessonAttempt.is_completed == False
    ).first()
    
    if existing:
        # Update last accessed time
        existing.last_accessed_at = func.now()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new attempt
    new_attempt = LessonAttempt(
        user_id=current_user.id,
        lesson_id=attempt_data.lesson_id,
        module=attempt_data.module,
        exercises_total=attempt_data.exercises_total
    )
    
    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)
    
    return new_attempt

@router.put("/{attempt_id}", response_model=LessonAttemptResponse)
def update_lesson_attempt(
    attempt_id: int,
    update_data: LessonAttemptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update lesson attempt with user progress."""
    
    attempt = db.query(LessonAttempt).filter(
        LessonAttempt.id == attempt_id,
        LessonAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Update fields
    if update_data.exercises_attempted is not None:
        attempt.exercises_attempted = update_data.exercises_attempted
    if update_data.exercises_correct is not None:
        attempt.exercises_correct = update_data.exercises_correct
    if update_data.user_answers is not None:
        attempt.user_answers = update_data.user_answers
    if update_data.exercise_results is not None:
        attempt.exercise_results = update_data.exercise_results
    if update_data.time_spent_seconds is not None:
        attempt.time_spent_seconds = update_data.time_spent_seconds
    if update_data.is_completed is not None:
        attempt.is_completed = update_data.is_completed
        if update_data.is_completed:
            attempt.completed_at = func.now()
    if update_data.score_percentage is not None:
        attempt.score_percentage = update_data.score_percentage
    
    attempt.last_accessed_at = func.now()
    
    db.commit()
    db.refresh(attempt)
    
    return attempt

@router.get("/lesson/{module}/{lesson_id}", response_model=LessonAttemptResponse)
def get_lesson_attempt(
    module: str,
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the latest attempt for a specific lesson."""
    
    attempt = db.query(LessonAttempt).filter(
        LessonAttempt.user_id == current_user.id,
        LessonAttempt.lesson_id == lesson_id,
        LessonAttempt.module == module
    ).order_by(LessonAttempt.started_at.desc()).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="No attempt found")
    
    return attempt

@router.get("/", response_model=List[LessonAttemptResponse])
def get_all_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all lesson attempts for current user."""
    
    attempts = db.query(LessonAttempt).filter(
        LessonAttempt.user_id == current_user.id
    ).order_by(LessonAttempt.started_at.desc()).all()
    
    return attempts
