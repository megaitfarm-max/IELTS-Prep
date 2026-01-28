import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def create_speaking_tables():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Create speaking_sessions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS speaking_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                part_number INTEGER NOT NULL CHECK (part_number IN (1, 2, 3)),
                topic TEXT NOT NULL,
                prompt_text TEXT NOT NULL,
                audio_url TEXT,
                transcription TEXT,
                duration_seconds INTEGER,
                word_count INTEGER,
                speaking_rate DECIMAL(5, 2),
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        
        # Create speaking_feedback table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS speaking_feedback (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL UNIQUE REFERENCES speaking_sessions(id) ON DELETE CASCADE,
                overall_score DECIMAL(3, 1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 9),
                fluency_coherence DECIMAL(3, 1) NOT NULL CHECK (fluency_coherence >= 0 AND fluency_coherence <= 9),
                lexical_resource DECIMAL(3, 1) NOT NULL CHECK (lexical_resource >= 0 AND lexical_resource <= 9),
                grammatical_range DECIMAL(3, 1) NOT NULL CHECK (grammatical_range >= 0 AND grammatical_range <= 9),
                pronunciation DECIMAL(3, 1) NOT NULL CHECK (pronunciation >= 0 AND pronunciation >= 0 AND pronunciation <= 9),
                strengths TEXT[] NOT NULL,
                weaknesses TEXT[] NOT NULL,
                suggestions TEXT[] NOT NULL,
                filler_words JSONB,
                grammar_errors JSONB,
                vocabulary_analysis JSONB,
                ai_model VARCHAR(100) NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES speaking_sessions(id)
            );
        """)
        
        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user 
            ON speaking_sessions(user_id);
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_speaking_sessions_date 
            ON speaking_sessions(started_at);
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_speaking_feedback_session 
            ON speaking_feedback(session_id);
        """)
        
        conn.commit()
        print("✅ Speaking practice tables created successfully!")
        print("   - speaking_sessions (stores recordings and transcriptions)")
        print("   - speaking_feedback (stores AI analysis with IELTS band scores)")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        if conn:
            conn.rollback()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_speaking_tables()
