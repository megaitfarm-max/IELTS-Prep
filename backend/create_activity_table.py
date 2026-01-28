import sys
sys.path.insert(0, '/Volumes/algsoch/english/backend')

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Creating user_activity table...")
    
    create_sql = """
    CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        activity_type VARCHAR NOT NULL,
        module VARCHAR,
        lesson_id VARCHAR,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """
    
    db.execute(text(create_sql))
    db.commit()
    print("✅ user_activity table created successfully!")
    
    # Check if it exists
    result = db.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity')"))
    exists = result.scalar()
    print(f"Table exists: {exists}")
    
except Exception as e:
    print(f'Error: {e}')
    db.rollback()
finally:
    db.close()
