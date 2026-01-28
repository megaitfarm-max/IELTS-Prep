import sys
sys.path.insert(0, '/Volumes/algsoch/english/backend')

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # Check users table
    print("=" * 60)
    print("USERS TABLE:")
    print("=" * 60)
    result = db.execute(text('SELECT id, email, full_name, is_active, created_at FROM users ORDER BY created_at DESC'))
    users = result.fetchall()
    
    if users:
        print(f'\n✅ Found {len(users)} users:\n')
        for user in users:
            print(f'ID: {user[0]}')
            print(f'Email: {user[1]}')
            print(f'Name: {user[2]}')
            print(f'Active: {user[3]}')
            print(f'Created: {user[4]}')
            print('-' * 60)
    else:
        print('No users found')
    
    # Check lesson_progress table
    print("\n" + "=" * 60)
    print("LESSON PROGRESS TABLE:")
    print("=" * 60)
    result = db.execute(text('SELECT * FROM lesson_progress ORDER BY completed_at DESC'))
    progress = result.fetchall()
    
    if progress:
        print(f'\n✅ Found {len(progress)} lesson progress records:\n')
        for p in progress:
            print(f'ID: {p[0]}, User ID: {p[1]}, Lesson: {p[2]}, Module: {p[3]}, Completed: {p[4]}, Time: {p[5]}')
    else:
        print('\n⚠️ No lesson progress data found yet')
        
except Exception as e:
    print(f'Error: {e}')
finally:
    db.close()
