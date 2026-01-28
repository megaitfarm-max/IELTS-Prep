from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1 import auth, users, lessons, progress, ai, voice, question_generation
from app.routers import test_history, password_reset
from app.routes import lesson_progress, admin, lesson_attempts, videos, chatbot, writing, speaking


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting IELTS Prep Platform API...")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI-Powered IELTS Preparation Platform API",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(password_reset.router, prefix="/api/v1", tags=["Password Reset"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(lessons.router, prefix="/api/v1/lessons", tags=["Lessons"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["Progress"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice"])
app.include_router(question_generation.router, prefix="/api/v1/questions", tags=["Questions"])
app.include_router(test_history.router, prefix="/api/v1/test-history", tags=["Test History"])
app.include_router(lesson_progress.router, prefix="/api/v1/lesson-progress", tags=["Lesson Progress"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(lesson_attempts.router, prefix="/api/v1/lesson-attempts", tags=["Lesson Attempts"])
app.include_router(videos.router, prefix="/api/v1/videos", tags=["Videos"])
app.include_router(chatbot.router)
app.include_router(writing.router)
app.include_router(speaking.router)


@app.get("/")
async def root():
    return {
        "message": "IELTS Prep Platform API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
