import sys
sys.path.insert(0, '/Volumes/algsoch/english/backend')

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("=" * 80)
    print("USER ACTIVITY TABLE:")
    print("=" * 80)
    
    result = db.execute(text('SELECT * FROM user_activity ORDER BY created_at DESC'))
    activities = result.fetchall()
    
    if activities:
        print(f'\n✅ Found {len(activities)} activity records:\n')
        for activity in activities:
            print(f'ID: {activity[0]}')
            print(f'User ID: {activity[1]}')
            print(f'Activity Type: {activity[2]}')
            print(f'Module: {activity[3]}')
            print(f'Lesson ID: {activity[4]}')
            print(f'Details: {activity[5]}')
            print(f'Created At: {activity[6]}')
            print('-' * 80)
    else:
        print('\n⚠️ No user activity data found yet')
        
except Exception as e:
    print(f'Error: {e}')
finally:
    db.close()
