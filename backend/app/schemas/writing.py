from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# Submission Schemas
class WritingSubmissionBase(BaseModel):
    task_type: str = Field(..., pattern="^(task1|task2)$")
    prompt: str = Field(..., min_length=10)
    user_essay: str = Field(..., min_length=50, max_length=10000)

class WritingSubmissionCreate(WritingSubmissionBase):
    pass

class WritingSubmissionResponse(WritingSubmissionBase):
    id: int
    user_id: int
    word_count: int
    submitted_at: datetime
    has_feedback: bool = False

    class Config:
        from_attributes = True

# Feedback Schemas
class WritingFeedbackResponse(BaseModel):
    id: int
    submission_id: int
    overall_score: float
    task_achievement: float
    coherence_cohesion: float
    lexical_resource: float
    grammatical_range: float
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    grammar_errors: Optional[Dict[str, Any]] = None
    vocabulary_suggestions: Optional[Dict[str, Any]] = None
    ai_model: str
    generated_at: datetime

    class Config:
        from_attributes = True

class WritingSubmissionWithFeedback(WritingSubmissionResponse):
    feedback: Optional[WritingFeedbackResponse] = None

    class Config:
        from_attributes = True
