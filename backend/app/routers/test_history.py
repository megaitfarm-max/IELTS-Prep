from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.test_history import TestHistory
from pydantic import BaseModel

router = APIRouter()

class TestResultSubmission(BaseModel):
    user_id: int
    overall_band_score: float
    listening_score: float
    reading_score: float
    writing_score: float
    speaking_score: float
    listening_correct: int
    listening_total: int
    reading_correct: int
    reading_total: int
    writing_task1_words: int
    writing_task2_words: int
    speaking_responses: int
    question_details: list  # All question-by-question data
    modules_completed: list
    question_sources: dict
    total_time_seconds: int
    module_times: dict
    question_type_accuracy: dict
    topic_performance: dict

@router.get("/")
async def get_all_test_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get test history for current user ONLY"""
    tests = db.query(TestHistory).filter(
        TestHistory.user_id == current_user.id
    ).order_by(
        TestHistory.test_date.desc()
    ).limit(limit).all()
    
    return [
        {
            "id": test.id,
            "user_id": test.user_id,
            "test_date": test.test_date.isoformat(),
            "overall_score": test.overall_band_score,
            "module_scores": {
                "listening": {"bandScore": test.listening_score, "band_score": test.listening_score},
                "reading": {"bandScore": test.reading_score, "band_score": test.reading_score},
                "writing": {"bandScore": test.writing_score, "band_score": test.writing_score},
                "speaking": {"bandScore": test.speaking_score, "band_score": test.speaking_score}
            },
            "time_spent": test.total_time_seconds,
            "completed": test.completed,
            "question_details": test.question_details or []
        }
        for test in tests
    ]

@router.post("/save")
async def save_test_history(
    test_data: TestResultSubmission,
    db: Session = Depends(get_db)
):
    """Save complete test history to database for personalization"""
    try:
        # Create test history record
        test_history = TestHistory(
            user_id=test_data.user_id,
            overall_band_score=test_data.overall_band_score,
            listening_score=test_data.listening_score,
            reading_score=test_data.reading_score,
            writing_score=test_data.writing_score,
            speaking_score=test_data.speaking_score,
            listening_correct=test_data.listening_correct,
            listening_total=test_data.listening_total,
            reading_correct=test_data.reading_correct,
            reading_total=test_data.reading_total,
            writing_task1_words=test_data.writing_task1_words,
            writing_task2_words=test_data.writing_task2_words,
            speaking_responses=test_data.speaking_responses,
            question_details=test_data.question_details,
            modules_completed=test_data.modules_completed,
            question_sources=test_data.question_sources,
            total_time_seconds=test_data.total_time_seconds,
            module_times=test_data.module_times,
            question_type_accuracy=test_data.question_type_accuracy,
            topic_performance=test_data.topic_performance,
            completed=True
        )
        
        db.add(test_history)
        db.commit()
        db.refresh(test_history)
        
        return {
            "success": True,
            "test_id": test_history.id,
            "message": "Test history saved successfully"
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save test history: {str(e)}")

@router.get("/user/{user_id}")
async def get_user_test_history(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get all test history for a user"""
    tests = db.query(TestHistory).filter(
        TestHistory.user_id == user_id
    ).order_by(TestHistory.test_date.desc()).limit(limit).all()
    
    return {
        "tests": [
            {
                "id": test.id,
                "test_date": test.test_date.isoformat(),
                "overall_score": test.overall_band_score,
                "listening_score": test.listening_score,
                "reading_score": test.reading_score,
                "writing_score": test.writing_score,
                "speaking_score": test.speaking_score,
                "total_time": test.total_time_seconds
            }
            for test in tests
        ]
    }

@router.get("/analysis/{user_id}")
async def get_personalized_analysis(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get personalized analysis based on test history"""
    tests = db.query(TestHistory).filter(
        TestHistory.user_id == user_id
    ).order_by(TestHistory.test_date.desc()).limit(5).all()
    
    if not tests:
        return {"message": "No test history found"}
    
    # Calculate trends
    avg_listening = sum(t.listening_score for t in tests) / len(tests)
    avg_reading = sum(t.reading_score for t in tests) / len(tests)
    avg_writing = sum(t.writing_score for t in tests) / len(tests)
    avg_speaking = sum(t.speaking_score for t in tests) / len(tests)
    
    # Find weak question types
    weak_types = {}
    for test in tests:
        if test.question_type_accuracy:
            for qtype, accuracy in test.question_type_accuracy.items():
                if qtype not in weak_types:
                    weak_types[qtype] = []
                weak_types[qtype].append(accuracy)
    
    weak_areas = {
        qtype: sum(accs) / len(accs) 
        for qtype, accs in weak_types.items()
    }
    
    # Sort to find weakest
    weakest_types = sorted(weak_areas.items(), key=lambda x: x[1])[:3]
    
    return {
        "total_tests": len(tests),
        "average_scores": {
            "listening": round(avg_listening, 1),
            "reading": round(avg_reading, 1),
            "writing": round(avg_writing, 1),
            "speaking": round(avg_speaking, 1)
        },
        "weakest_question_types": [
            {"type": qtype, "accuracy": round(acc * 100, 1)}
            for qtype, acc in weakest_types
        ],
        "recent_trend": {
            "improving": tests[0].overall_band_score > tests[-1].overall_band_score if len(tests) > 1 else None,
            "latest_score": tests[0].overall_band_score,
            "first_score": tests[-1].overall_band_score
        },
        "recommendations": [
            f"Focus on {qtype} questions (current accuracy: {round(acc*100, 1)}%)"
            for qtype, acc in weakest_types
        ]
    }

@router.get("/detailed/{test_id}")
async def get_detailed_test(
    test_id: int,
    db: Session = Depends(get_db)
):
    """Get complete detailed breakdown of a specific test"""
    test = db.query(TestHistory).filter(TestHistory.id == test_id).first()
    
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    return {
        "id": test.id,
        "test_date": test.test_date.isoformat(),
        "scores": {
            "overall": test.overall_band_score,
            "listening": test.listening_score,
            "reading": test.reading_score,
            "writing": test.writing_score,
            "speaking": test.speaking_score
        },
        "detailed_performance": {
            "listening": {
                "correct": test.listening_correct,
                "total": test.listening_total,
                "percentage": round((test.listening_correct / test.listening_total * 100), 1) if test.listening_total > 0 else 0
            },
            "reading": {
                "correct": test.reading_correct,
                "total": test.reading_total,
                "percentage": round((test.reading_correct / test.reading_total * 100), 1) if test.reading_total > 0 else 0
            }
        },
        "question_details": test.question_details,
        "question_sources": test.question_sources,
        "time_analysis": {
            "total_seconds": test.total_time_seconds,
            "module_times": test.module_times
        },
        "question_type_accuracy": test.question_type_accuracy
    }
