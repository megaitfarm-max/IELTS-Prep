from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.speaking_analysis import speaking_service

router = APIRouter(prefix="/api/v1/speaking", tags=["speaking"])

class SpeakingAnalysisRequest(BaseModel):
    part_number: int
    topic: str
    prompt_text: str
    transcription: str
    duration_seconds: int
    word_count: int

class SpeakingFeedbackResponse(BaseModel):
    overall_score: float
    fluency_coherence: float
    lexical_resource: float
    grammatical_range: float
    pronunciation: float
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]

class SpeakingAnalysisResponse(BaseModel):
    success: bool
    feedback: SpeakingFeedbackResponse

@router.post("/analyze", response_model=SpeakingAnalysisResponse)
async def analyze_speaking(
    request: SpeakingAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze speaking response and provide AI feedback
    """
    try:
        feedback = await speaking_service.analyze_speaking(
            transcription=request.transcription,
            part_number=request.part_number,
            prompt_text=request.prompt_text,
            duration_seconds=request.duration_seconds,
            word_count=request.word_count
        )
        
        return {
            "success": True,
            "feedback": feedback
        }
    except Exception as e:
        print(f"Speaking analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
