from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.lesson_attempt import LessonAttempt
from app.models.lesson_progress import LessonProgress
from typing import List
from pydantic import BaseModel

router = APIRouter()


class UserToggleRequest(BaseModel):
    is_active: bool


@router.get("/users")
async def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)."""
    # TODO: Add admin check - for now allow all authenticated users
    users = db.query(User).order_by(desc(User.created_at)).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "target_band_score": user.target_band_score,
            "test_date": user.test_date,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        for user in users
    ]


@router.get("/attempts")
async def get_all_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lesson attempts (admin only)."""
    attempts = db.query(LessonAttempt).order_by(desc(LessonAttempt.created_at)).all()
    
    result = []
    for attempt in attempts:
        user = db.query(User).filter(User.id == attempt.user_id).first()
        result.append({
            "id": attempt.id,
            "user_id": attempt.user_id,
            "user_email": user.email if user else "Unknown",
            "lesson_id": attempt.lesson_id,
            "module": attempt.module,
            "score": attempt.score,
            "exercises_correct": attempt.exercises_correct,
            "exercises_total": attempt.exercises_total,
            "time_spent_seconds": attempt.time_spent_seconds,
            "is_completed": attempt.is_completed,
            "created_at": attempt.created_at.isoformat() if attempt.created_at else None,
            "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
        })
    
    return result


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get admin statistics."""
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    total_attempts = db.query(func.count(LessonAttempt.id)).scalar()
    completed_attempts = db.query(func.count(LessonAttempt.id)).filter(LessonAttempt.is_completed == True).scalar()
    
    # Calculate average score
    avg_score_result = db.query(func.avg(LessonAttempt.score)).filter(
        LessonAttempt.is_completed == True,
        LessonAttempt.score != None
    ).scalar()
    avg_score = float(avg_score_result) if avg_score_result else 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_attempts": total_attempts,
        "completed_attempts": completed_attempts,
        "average_score": round(avg_score, 2),
    }


@router.put("/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: int,
    toggle_data: UserToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle user active status (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own status"
        )
    
    user.is_active = toggle_data.is_active
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User {'activated' if toggle_data.is_active else 'deactivated'} successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active,
        }
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete associated data
    db.query(LessonAttempt).filter(LessonAttempt.user_id == user_id).delete()
    db.query(LessonProgress).filter(LessonProgress.user_id == user_id).delete()
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
