import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def create_chatbot_tables():
    """Create chatbot tables for AI assistant functionality."""
    db = SessionLocal()
    
    try:
        print("Creating chat_conversations table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                conversation_id UUID DEFAULT gen_random_uuid() UNIQUE,
                title VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        print("Creating chat_messages table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                conversation_id UUID REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                response TEXT NOT NULL,
                ai_model VARCHAR(50) DEFAULT 'gpt-4',
                tokens_used INTEGER,
                response_time_ms INTEGER,
                helpful BOOLEAN DEFAULT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        
        print("Creating indexes...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_conversations_user 
            ON chat_conversations(user_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_messages_conversation 
            ON chat_messages(conversation_id)
        """))
        
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_messages_created 
            ON chat_messages(created_at DESC)
        """))
        
        db.commit()
        print("\n✅ Chatbot tables created successfully!")
        
        # Verify tables exist
        result = db.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('chat_conversations', 'chat_messages')
        """))
        tables = [row[0] for row in result]
        print(f"\n📋 Tables created: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_chatbot_tables()
