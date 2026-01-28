"""
Create youtube_videos and user_video_progress tables
"""
import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings

def create_tables():
    """Create video-related tables."""
    engine = create_engine(settings.DATABASE_URL)
    
    # Create youtube_videos table
    create_youtube_videos = text("""
        CREATE TABLE IF NOT EXISTS youtube_videos (
            id SERIAL PRIMARY KEY,
            title VARCHAR NOT NULL,
            description TEXT,
            youtube_id VARCHAR NOT NULL,
            duration_seconds INTEGER NOT NULL,
            module VARCHAR NOT NULL,
            video_type VARCHAR NOT NULL,
            thumbnail_url VARCHAR,
            difficulty VARCHAR,
            tags TEXT[],
            order_index INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    # Create user_video_progress table
    create_user_video_progress = text("""
        CREATE TABLE IF NOT EXISTS user_video_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            video_id INTEGER NOT NULL REFERENCES youtube_videos(id),
            watched_percentage NUMERIC(5,2) DEFAULT 0,
            last_position_seconds INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, video_id)
        )
    """)
    
    # Insert sample videos
    insert_videos = text("""
        INSERT INTO youtube_videos (title, description, youtube_id, duration_seconds, module, video_type, difficulty, tags, order_index)
        VALUES 
        -- Long Videos (5 minutes each)
        ('Reading Strategies Deep Dive', 'Master advanced reading techniques for IELTS success', 'dQw4w9WgXcQ', 300, 'reading', 'long', 'intermediate', ARRAY['strategies', 'tips', 'reading'], 1),
        ('Listening Techniques Masterclass', 'Comprehensive guide to ace the IELTS listening section', 'dQw4w9WgXcQ', 300, 'listening', 'long', 'intermediate', ARRAY['listening', 'techniques', 'tips'], 2),
        ('Writing Task 1 Complete Guide', 'Everything you need to know about IELTS Writing Task 1', 'dQw4w9WgXcQ', 300, 'writing', 'long', 'advanced', ARRAY['writing', 'task1', 'guide'], 3),
        ('Writing Task 2 Complete Guide', 'Master IELTS Writing Task 2 with expert strategies', 'dQw4w9WgXcQ', 300, 'writing', 'long', 'advanced', ARRAY['writing', 'task2', 'essay'], 4),
        ('Speaking Confidence Builder', 'Build confidence and fluency for IELTS speaking test', 'dQw4w9WgXcQ', 300, 'speaking', 'long', 'intermediate', ARRAY['speaking', 'confidence', 'fluency'], 5),
        
        -- Short Videos (<1 minute)
        ('Quick Tip: Time Management', 'Master time management in IELTS exam', 'dQw4w9WgXcQ', 45, 'tips', 'short', 'beginner', ARRAY['tips', 'time', 'quick'], 6),
        ('Quick Tip: Handling Nervousness', 'Stay calm and confident during your test', 'dQw4w9WgXcQ', 50, 'tips', 'short', 'beginner', ARRAY['tips', 'nervousness', 'quick'], 7),
        ('Quick Tip: Common Mistakes', 'Avoid these common IELTS mistakes', 'dQw4w9WgXcQ', 55, 'tips', 'short', 'beginner', ARRAY['tips', 'mistakes', 'quick'], 8),
        ('Quick Tip: Vocabulary Boosters', 'Essential vocabulary for higher band scores', 'dQw4w9WgXcQ', 48, 'tips', 'short', 'beginner', ARRAY['tips', 'vocabulary', 'quick'], 9),
        ('Quick Tip: Test Day Checklist', 'Everything you need on test day', 'dQw4w9WgXcQ', 52, 'tips', 'short', 'beginner', ARRAY['tips', 'checklist', 'quick'], 10)
        ON CONFLICT DO NOTHING
    """)
    
    with engine.connect() as conn:
        print("Creating youtube_videos table...")
        conn.execute(create_youtube_videos)
        conn.commit()
        
        print("Creating user_video_progress table...")
        conn.execute(create_user_video_progress)
        conn.commit()
        
        print("Inserting sample videos...")
        conn.execute(insert_videos)
        conn.commit()
        
        # Verify
        result = conn.execute(text("SELECT COUNT(*) FROM youtube_videos"))
        count = result.scalar()
        print(f"\n✅ Tables created successfully!")
        print(f"📹 Total videos in database: {count}")
        
        result = conn.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_video_progress')"))
        exists = result.scalar()
        print(f"✅ user_video_progress table exists: {exists}")

if __name__ == "__main__":
    create_tables()
