"""
Create Writing Feedback Tables for Phase 3
Stores essay submissions and AI-generated feedback with IELTS band scores
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def create_tables():
    with engine.connect() as conn:
        print("Creating writing_submissions table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS writing_submissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                task_type VARCHAR(10) NOT NULL CHECK (task_type IN ('task1', 'task2')),
                prompt TEXT NOT NULL,
                user_essay TEXT NOT NULL,
                word_count INTEGER NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        print("Creating writing_feedback table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS writing_feedback (
                id SERIAL PRIMARY KEY,
                submission_id INTEGER REFERENCES writing_submissions(id) ON DELETE CASCADE,
                overall_score DECIMAL(3,1) CHECK (overall_score >= 0 AND overall_score <= 9),
                task_achievement DECIMAL(3,1) CHECK (task_achievement >= 0 AND task_achievement <= 9),
                coherence_cohesion DECIMAL(3,1) CHECK (coherence_cohesion >= 0 AND coherence_cohesion <= 9),
                lexical_resource DECIMAL(3,1) CHECK (lexical_resource >= 0 AND lexical_resource <= 9),
                grammatical_range DECIMAL(3,1) CHECK (grammatical_range >= 0 AND grammatical_range <= 9),
                
                strengths TEXT[],
                weaknesses TEXT[],
                suggestions TEXT[],
                grammar_errors JSONB,
                vocabulary_suggestions JSONB,
                
                ai_model VARCHAR(50) DEFAULT 'llama-3.3-70b-versatile',
                generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        print("Creating indexes...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_submissions_user 
            ON writing_submissions(user_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_feedback_submission 
            ON writing_feedback(submission_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_submissions_date 
            ON writing_submissions(submitted_at DESC)
        """))
        
        conn.commit()
        print("\n✅ Writing feedback tables created successfully!")
        
        # Verify tables
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('writing_submissions', 'writing_feedback')
        """))
        
        tables = [row[0] for row in result]
        print(f"\n📋 Tables created: {', '.join(tables)}")

if __name__ == "__main__":
    create_tables()
