from app.database import SessionLocal, engine
from sqlalchemy import text

db = SessionLocal()
try:
    # Check if table exists
    result = db.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lesson_progress')"))
    exists = result.scalar()
    print(f'Table exists: {exists}')
    
    if exists:
        # Get all data from lesson_progress table
        result = db.execute(text('SELECT * FROM lesson_progress'))
        rows = result.fetchall()
        
        if rows:
            print(f'\n✅ Found {len(rows)} records in lesson_progress:\n')
            for row in rows:
                print(f'ID: {row[0]}, User: {row[1]}, Lesson: {row[2]}, Module: {row[3]}, Completed: {row[4]}, Time: {row[5]}')
        else:
            print('\n⚠️ Table exists but no data found')
    else:
        print('\n❌ Table does not exist - creating it now...')
        db.execute(text('''
            CREATE TABLE lesson_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                lesson_id VARCHAR NOT NULL,
                module VARCHAR NOT NULL,
                completed BOOLEAN DEFAULT TRUE,
                completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        '''))
        db.commit()
        print('✅ Table created successfully!')
        
except Exception as e:
    print(f'Error: {e}')
    db.rollback()
finally:
    db.close()
