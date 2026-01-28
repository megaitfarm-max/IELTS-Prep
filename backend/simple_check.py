#!/usr/bin/env python3
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import SessionLocal
    from sqlalchemy import text
    
    print("✅ Successfully imported app.core.database")
    
    db = SessionLocal()
    
    # Check table exists
    result = db.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lesson_progress')"))
    exists = result.scalar()
    
    print(f"\nTable 'lesson_progress' exists: {exists}")
    
    if exists:
        # Get count
        result = db.execute(text('SELECT COUNT(*) FROM lesson_progress'))
        count = result.scalar()
        print(f"Records in table: {count}")
        
        if count > 0:
            # Show all data
            result = db.execute(text('SELECT * FROM lesson_progress ORDER BY completed_at DESC'))
            rows = result.fetchall()
            print(f"\n{'='*80}")
            print("LESSON PROGRESS DATA:")
            print(f"{'='*80}\n")
            
            for row in rows:
                print(f"ID: {row[0]}")
                print(f"User ID: {row[1]}")
                print(f"Lesson ID: {row[2]}")
                print(f"Module: {row[3]}")
                print(f"Completed: {row[4]}")
                print(f"Completed At: {row[5]}")
                print("-" * 80)
    else:
        print("\n❌ Table does not exist yet")
        print("Creating table now...")
        
        create_sql = """
        CREATE TABLE lesson_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            lesson_id VARCHAR NOT NULL,
            module VARCHAR NOT NULL,
            completed BOOLEAN DEFAULT TRUE,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        """
        
        db.execute(text(create_sql))
        db.commit()
        print("✅ Table created successfully!")
    
    db.close()
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print(f"\nCurrent sys.path:")
    for p in sys.path:
        print(f"  - {p}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
