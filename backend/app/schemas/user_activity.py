from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserActivityCreate(BaseModel):
    activity_type: str
    module: Optional[str] = None
    lesson_id: Optional[str] = None
    details: Optional[str] = None

class UserActivityResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    module: Optional[str]
    lesson_id: Optional[str]
    details: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
