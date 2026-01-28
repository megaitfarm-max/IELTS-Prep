from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LessonProgressCreate(BaseModel):
    lesson_id: str
    module: str

class LessonProgressResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: str
    module: str
    completed: bool
    completed_at: datetime

    class Config:
        orm_mode = True
