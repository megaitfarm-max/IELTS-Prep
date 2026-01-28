from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.youtube_video import YouTubeVideo
from app.models.user_video_progress import UserVideoProgress
from app.models.lesson_progress import LessonProgress
from app.schemas.youtube_video import (
    YouTubeVideoResponse,
    YouTubeVideoCreate,
    UserVideoProgressCreate,
    UserVideoProgressUpdate,
    UserVideoProgressResponse
)
from app.core.auth import get_current_user
from app.models.user import User
from sqlalchemy.sql import func

router = APIRouter()


def check_video_unlock(user_id: int, video: YouTubeVideo, db: Session) -> bool:
    """Check if user has unlocked a long video (5 minutes)."""
    if video.video_type == "short":
        return True  # All short videos are free
    
    # For long videos, check if user completed 3+ lessons in that module
    if video.module == "tips":
        # Tips videos unlock after completing all short videos
        short_videos_count = db.query(YouTubeVideo).filter(
            YouTubeVideo.video_type == "short",
            YouTubeVideo.is_active == True
        ).count()
        
        completed_short = db.query(UserVideoProgress).join(YouTubeVideo).filter(
            UserVideoProgress.user_id == user_id,
            UserVideoProgress.completed == True,
            YouTubeVideo.video_type == "short"
        ).count()
        
        return completed_short >= short_videos_count
    
    # Module-specific long videos - unlock after just 1 lesson!
    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.user_id == user_id,
        LessonProgress.module == video.module,
        LessonProgress.completed == True
    ).count()
    
    return completed_lessons >= 1


@router.get("/", response_model=List[YouTubeVideoResponse])
def get_all_videos(
    module: Optional[str] = None,
    video_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active videos with user progress."""
    query = db.query(YouTubeVideo).filter(YouTubeVideo.is_active == True)
    
    if module:
        query = query.filter(YouTubeVideo.module == module)
    if video_type:
        query = query.filter(YouTubeVideo.video_type == video_type)
    
    videos = query.order_by(YouTubeVideo.order_index).all()
    
    # Enrich with user progress
    result = []
    for video in videos:
        progress = db.query(UserVideoProgress).filter(
            UserVideoProgress.user_id == current_user.id,
            UserVideoProgress.video_id == video.id
        ).first()
        
        video_dict = {
            "id": video.id,
            "title": video.title,
            "description": video.description,
            "youtube_id": video.youtube_id,
            "duration_seconds": video.duration_seconds,
            "module": video.module,
            "video_type": video.video_type,
            "thumbnail_url": video.thumbnail_url,
            "difficulty": video.difficulty,
            "tags": video.tags,
            "order_index": video.order_index,
            "is_active": video.is_active,
            "created_at": video.created_at,
            "is_unlocked": check_video_unlock(current_user.id, video, db),
            "watched_percentage": float(progress.watched_percentage) if progress else 0,
            "last_position_seconds": progress.last_position_seconds if progress else 0
        }
        result.append(YouTubeVideoResponse(**video_dict))
    
    return result


@router.get("/{video_id}", response_model=YouTubeVideoResponse)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific video with user progress."""
    video = db.query(YouTubeVideo).filter(
        YouTubeVideo.id == video_id,
        YouTubeVideo.is_active == True
    ).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    progress = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == current_user.id,
        UserVideoProgress.video_id == video.id
    ).first()
    
    video_dict = {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "youtube_id": video.youtube_id,
        "duration_seconds": video.duration_seconds,
        "module": video.module,
        "video_type": video.video_type,
        "thumbnail_url": video.thumbnail_url,
        "difficulty": video.difficulty,
        "tags": video.tags,
        "order_index": video.order_index,
        "is_active": video.is_active,
        "created_at": video.created_at,
        "is_unlocked": check_video_unlock(current_user.id, video, db),
        "watched_percentage": float(progress.watched_percentage) if progress else 0,
        "last_position_seconds": progress.last_position_seconds if progress else 0
    }
    
    return YouTubeVideoResponse(**video_dict)


@router.post("/progress", response_model=UserVideoProgressResponse)
def update_video_progress(
    progress_data: UserVideoProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user's video watching progress."""
    # Check if progress exists
    existing = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == current_user.id,
        UserVideoProgress.video_id == progress_data.video_id
    ).first()
    
    if existing:
        # Update existing progress
        existing.last_position_seconds = progress_data.last_position_seconds
        existing.watched_percentage = progress_data.watched_percentage
        existing.last_watched_at = func.now()
        
        # Mark as completed if watched 95%+
        if progress_data.watched_percentage >= 95 and not existing.completed:
            existing.completed = True
            existing.completed_at = func.now()
        
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new progress
        new_progress = UserVideoProgress(
            user_id=current_user.id,
            video_id=progress_data.video_id,
            last_position_seconds=progress_data.last_position_seconds,
            watched_percentage=progress_data.watched_percentage,
            completed=progress_data.watched_percentage >= 95
        )
        
        if new_progress.completed:
            new_progress.completed_at = func.now()
        
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress


@router.get("/progress/{video_id}", response_model=UserVideoProgressResponse)
def get_video_progress(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's progress for a specific video."""
    progress = db.query(UserVideoProgress).filter(
        UserVideoProgress.user_id == current_user.id,
        UserVideoProgress.video_id == video_id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this video")
    
    return progress


@router.post("/admin/create", response_model=YouTubeVideoResponse)
def create_video(
    video_data: YouTubeVideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin only: Create a new video."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_video = YouTubeVideo(**video_data.dict())
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    
    # Return with default progress values
    video_dict = {
        **new_video.__dict__,
        "is_unlocked": True,
        "watched_percentage": 0,
        "last_position_seconds": 0
    }
    return YouTubeVideoResponse(**video_dict)
