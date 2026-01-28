from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.writing_submission import WritingSubmission
from app.models.writing_feedback import WritingFeedback
from app.schemas.writing import (
    WritingSubmissionCreate,
    WritingSubmissionResponse,
    WritingSubmissionWithFeedback,
    WritingFeedbackResponse
)
from app.services.writing_analysis import writing_service
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/v1/writing", tags=["writing"])

@router.post("/submit", response_model=WritingSubmissionWithFeedback, status_code=status.HTTP_201_CREATED)
async def submit_essay(
    submission: WritingSubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit an IELTS Writing essay for AI analysis and feedback
    """
    try:
        # Count words
        word_count = len(submission.user_essay.split())
        
        # Create submission record
        new_submission = WritingSubmission(
            user_id=current_user.id,
            task_type=submission.task_type,
            prompt=submission.prompt,
            user_essay=submission.user_essay,
            word_count=word_count
        )
        db.add(new_submission)
        db.commit()
        db.refresh(new_submission)
        
        # Get AI analysis
        analysis = await writing_service.analyze_essay(
            essay=submission.user_essay,
            task_type=submission.task_type,
            prompt=submission.prompt
        )
        
        # Create feedback record
        feedback = WritingFeedback(
            submission_id=new_submission.id,
            overall_score=analysis["overall_score"],
            task_achievement=analysis["task_achievement"],
            coherence_cohesion=analysis["coherence_cohesion"],
            lexical_resource=analysis["lexical_resource"],
            grammatical_range=analysis["grammatical_range"],
            strengths=analysis["strengths"],
            weaknesses=analysis["weaknesses"],
            suggestions=analysis["suggestions"],
            grammar_errors=analysis.get("grammar_errors"),
            vocabulary_suggestions=analysis.get("vocabulary_suggestions"),
            ai_model=analysis["model"]
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        # Return submission with feedback
        result = WritingSubmissionWithFeedback(
            id=new_submission.id,
            user_id=new_submission.user_id,
            task_type=new_submission.task_type,
            prompt=new_submission.prompt,
            user_essay=new_submission.user_essay,
            word_count=new_submission.word_count,
            submitted_at=new_submission.submitted_at,
            has_feedback=True,
            feedback=WritingFeedbackResponse(
                id=feedback.id,
                submission_id=feedback.submission_id,
                overall_score=float(feedback.overall_score),
                task_achievement=float(feedback.task_achievement),
                coherence_cohesion=float(feedback.coherence_cohesion),
                lexical_resource=float(feedback.lexical_resource),
                grammatical_range=float(feedback.grammatical_range),
                strengths=feedback.strengths,
                weaknesses=feedback.weaknesses,
                suggestions=feedback.suggestions,
                grammar_errors=feedback.grammar_errors,
                vocabulary_suggestions=feedback.vocabulary_suggestions,
                ai_model=feedback.ai_model,
                generated_at=feedback.generated_at
            )
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Essay submission error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit essay: {str(e)}"
        )

@router.get("/submissions", response_model=List[WritingSubmissionResponse])
async def get_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all writing submissions for the current user
    """
    submissions = db.query(WritingSubmission).filter(
        WritingSubmission.user_id == current_user.id
    ).order_by(WritingSubmission.submitted_at.desc()).all()
    
    # Add has_feedback flag
    result = []
    for sub in submissions:
        result.append(WritingSubmissionResponse(
            id=sub.id,
            user_id=sub.user_id,
            task_type=sub.task_type,
            prompt=sub.prompt,
            user_essay=sub.user_essay,
            word_count=sub.word_count,
            submitted_at=sub.submitted_at,
            has_feedback=sub.feedback is not None
        ))
    
    return result

@router.get("/submissions/{submission_id}", response_model=WritingSubmissionWithFeedback)
async def get_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific submission with its feedback
    """
    submission = db.query(WritingSubmission).filter(
        WritingSubmission.id == submission_id,
        WritingSubmission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    result = WritingSubmissionWithFeedback(
        id=submission.id,
        user_id=submission.user_id,
        task_type=submission.task_type,
        prompt=submission.prompt,
        user_essay=submission.user_essay,
        word_count=submission.word_count,
        submitted_at=submission.submitted_at,
        has_feedback=submission.feedback is not None
    )
    
    if submission.feedback:
        result.feedback = WritingFeedbackResponse(
            id=submission.feedback.id,
            submission_id=submission.feedback.submission_id,
            overall_score=float(submission.feedback.overall_score),
            task_achievement=float(submission.feedback.task_achievement),
            coherence_cohesion=float(submission.feedback.coherence_cohesion),
            lexical_resource=float(submission.feedback.lexical_resource),
            grammatical_range=float(submission.feedback.grammatical_range),
            strengths=submission.feedback.strengths,
            weaknesses=submission.feedback.weaknesses,
            suggestions=submission.feedback.suggestions,
            grammar_errors=submission.feedback.grammar_errors,
            vocabulary_suggestions=submission.feedback.vocabulary_suggestions,
            ai_model=submission.feedback.ai_model,
            generated_at=submission.feedback.generated_at
        )
    
    return result

@router.delete("/submissions/{submission_id}")
async def delete_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a writing submission and its feedback
    """
    submission = db.query(WritingSubmission).filter(
        WritingSubmission.id == submission_id,
        WritingSubmission.user_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    db.delete(submission)
    db.commit()
    
    return {"message": "Submission deleted successfully"}
