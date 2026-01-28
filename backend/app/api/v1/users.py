from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    target_band_score: Optional[float] = None
    test_date: Optional[date] = None


@router.get("/")
async def get_users():
    """Get all users (admin only)."""
    return {"message": "Users list"}


@router.get("/me")
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "target_band_score": current_user.target_band_score,
        "test_date": current_user.test_date,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.put("/me")
async def update_current_user(
    user_update: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    # Update only provided fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.target_band_score is not None:
        current_user.target_band_score = user_update.target_band_score
    
    if user_update.test_date is not None:
        current_user.test_date = user_update.test_date
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "target_band_score": current_user.target_band_score,
            "test_date": current_user.test_date,
        }
    }


@router.get("/{user_id}")
async def get_user(user_id: int):
    """Get user by ID."""
    return {"message": f"User {user_id}"}


@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """Delete user account."""
    return {"message": f"Deleted user {user_id}"}
