from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class YouTubeVideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    youtube_id: str
    duration_seconds: int
    module: str
    video_type: str
    thumbnail_url: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    order_index: Optional[int] = 0
    is_active: Optional[bool] = True


class YouTubeVideoCreate(YouTubeVideoBase):
    pass


class YouTubeVideoResponse(YouTubeVideoBase):
    id: int
    created_at: datetime
    is_unlocked: Optional[bool] = True  # Calculated field
    watched_percentage: Optional[float] = 0  # From user progress
    last_position_seconds: Optional[int] = 0  # From user progress

    class Config:
        from_attributes = True


class UserVideoProgressBase(BaseModel):
    video_id: int
    last_position_seconds: int
    watched_percentage: float


class UserVideoProgressCreate(UserVideoProgressBase):
    pass


class UserVideoProgressUpdate(BaseModel):
    last_position_seconds: Optional[int] = None
    watched_percentage: Optional[float] = None
    completed: Optional[bool] = None


class UserVideoProgressResponse(BaseModel):
    id: int
    user_id: int
    video_id: int
    watched_percentage: float
    last_position_seconds: int
    completed: bool
    completed_at: Optional[datetime] = None
    last_watched_at: datetime

    class Config:
        from_attributes = True
