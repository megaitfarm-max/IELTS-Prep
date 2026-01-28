"""Initial database setup script."""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def create_database():
    """Create the database if it doesn't exist."""
    # Connect to PostgreSQL server (without database name)
    base_url = settings.DATABASE_URL.rsplit('/', 1)[0]
    db_name = settings.DATABASE_URL.rsplit('/', 1)[1]
    
    engine = create_engine(f"{base_url}/postgres", isolation_level="AUTOCOMMIT")
    
    with engine.connect() as conn:
        # Check if database exists
        result = conn.execute(
            text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'")
        )
        exists = result.scalar()
        
        if not exists:
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"✅ Database '{db_name}' created successfully!")
        else:
            print(f"ℹ️  Database '{db_name}' already exists.")
    
    engine.dispose()

def create_tables():
    """Create all tables."""
    from app.core.database import engine, Base
    from app.models.user import User
    from app.models.lesson import Lesson
    from app.models.progress import Progress
    from app.models.test_history import TestHistory
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

def seed_sample_data():
    """Add some sample lessons."""
    from app.core.database import SessionLocal
    from app.models.lesson import Lesson, ModuleType
    
    db = SessionLocal()
    
    try:
        # Check if lessons already exist
        existing = db.query(Lesson).first()
        if existing:
            print("ℹ️  Sample data already exists.")
            return
        
        sample_lessons = [
            Lesson(
                title="Introduction to IELTS Reading",
                module_type=ModuleType.READING,
                difficulty="beginner",
                content="Learn the basics of IELTS reading test structure and question types.",
                duration_minutes=30,
                order_index=1
            ),
            Lesson(
                title="IELTS Listening Format Overview",
                module_type=ModuleType.LISTENING,
                difficulty="beginner",
                content="Understand the four sections of the IELTS listening test.",
                duration_minutes=25,
                order_index=1
            ),
            Lesson(
                title="Writing Task 1: Introduction",
                module_type=ModuleType.WRITING,
                difficulty="beginner",
                content="Learn how to describe graphs, charts, and diagrams.",
                duration_minutes=30,
                order_index=1
            ),
            Lesson(
                title="Speaking Test Format",
                module_type=ModuleType.SPEAKING,
                difficulty="beginner",
                content="Overview of the three parts of the IELTS speaking test.",
                duration_minutes=20,
                order_index=1
            ),
        ]
        
        db.add_all(sample_lessons)
        db.commit()
        print("✅ Sample lessons added successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting database initialization...")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    
    try:
        create_database()
        create_tables()
        seed_sample_data()
        print("\n✅ Database setup completed successfully!")
    except Exception as e:
        print(f"\n❌ Database setup failed: {e}")
        sys.exit(1)
