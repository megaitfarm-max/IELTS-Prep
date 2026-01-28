from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class LessonAttemptCreate(BaseModel):
    lesson_id: str
    module: str
    exercises_total: int

class LessonAttemptUpdate(BaseModel):
    exercises_attempted: Optional[int] = None
    exercises_correct: Optional[int] = None
    user_answers: Optional[str] = None  # JSON string
    exercise_results: Optional[str] = None  # JSON string
    time_spent_seconds: Optional[int] = None
    is_completed: Optional[bool] = None
    score_percentage: Optional[int] = None

class LessonAttemptResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: str
    module: str
    exercises_attempted: int
    exercises_correct: int
    exercises_total: int
    user_answers: Optional[str]
    exercise_results: Optional[str]
    time_spent_seconds: int
    started_at: datetime
    completed_at: Optional[datetime]
    last_accessed_at: datetime
    is_completed: bool
    score_percentage: int
    
    class Config:
        from_attributes = True
