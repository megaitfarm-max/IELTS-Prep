from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.lesson import ModuleType, DifficultyLevel


class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    module_type: ModuleType
    difficulty_level: DifficultyLevel
    duration_minutes: int = 30


class LessonCreate(LessonBase):
    content: Optional[str] = None
    order_index: int = 0


class LessonResponse(LessonBase):
    id: int
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class LessonDetail(LessonResponse):
    content: Optional[str] = None
