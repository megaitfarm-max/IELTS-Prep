from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.lesson import Lesson, ModuleType
from app.schemas.lesson import LessonResponse, LessonDetail

router = APIRouter()


@router.get("/", response_model=List[LessonResponse])
async def get_lessons(
    module_type: ModuleType = None,
    db: Session = Depends(get_db),
):
    """Get all lessons, optionally filtered by module type."""
    query = db.query(Lesson)
    if module_type:
        query = query.filter(Lesson.module_type == module_type)
    lessons = query.order_by(Lesson.order_index).all()
    return lessons


@router.get("/{lesson_id}", response_model=LessonDetail)
async def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Get lesson by ID with full details."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.get("/module/{module_type}", response_model=List[LessonResponse])
async def get_lessons_by_module(
    module_type: ModuleType,
    db: Session = Depends(get_db),
):
    """Get all lessons for a specific module."""
    lessons = (
        db.query(Lesson)
        .filter(Lesson.module_type == module_type)
        .order_by(Lesson.order_index)
        .all()
    )
    return lessons
