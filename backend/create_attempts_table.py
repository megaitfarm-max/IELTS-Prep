import sys
sys.path.insert(0, '/Volumes/algsoch/english/backend')

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Creating lesson_attempts table...")
    
    create_sql = """
    CREATE TABLE IF NOT EXISTS lesson_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        lesson_id VARCHAR NOT NULL,
        module VARCHAR NOT NULL,
        exercises_attempted INTEGER DEFAULT 0,
        exercises_correct INTEGER DEFAULT 0,
        exercises_total INTEGER DEFAULT 0,
        user_answers TEXT,
        exercise_results TEXT,
        time_spent_seconds INTEGER DEFAULT 0,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_completed BOOLEAN DEFAULT FALSE,
        score_percentage INTEGER DEFAULT 0
    )
    """
    
    db.execute(text(create_sql))
    db.commit()
    print("✅ lesson_attempts table created successfully!")
    
    # Check if it exists
    result = db.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lesson_attempts')"))
    exists = result.scalar()
    print(f"Table exists: {exists}")
    
except Exception as e:
    print(f'Error: {e}')
    db.rollback()
finally:
    db.close()
