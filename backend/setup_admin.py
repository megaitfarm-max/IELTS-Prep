#!/usr/bin/env python3
"""
Script to create or update admin user.
Usage: python create_admin_simple.py
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.security import get_password_hash
from sqlalchemy import create_engine, text

# Configuration
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "algsoch@gmail.com")
ADMIN_PASSWORD = "Algsoch7065@"
DATABASE_URL = os.getenv("DATABASE_URL")

def create_or_update_admin():
    """Create or update admin user."""
    
    print(f"Setting up admin user: {ADMIN_EMAIL}")
    
    try:
        # Hash the password
        hashed_password = get_password_hash(ADMIN_PASSWORD)
        
        # Connect to database
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if user exists
            result = conn.execute(
                text("SELECT id, email FROM users WHERE email = :email"),
                {"email": ADMIN_EMAIL}
            )
            existing_user = result.fetchone()
            
            if existing_user:
                # Update existing user
                print(f"Updating existing user: {ADMIN_EMAIL}")
                conn.execute(
                    text("""
                        UPDATE users 
                        SET hashed_password = :password, 
                            is_admin = TRUE, 
                            is_active = TRUE 
                        WHERE email = :email
                    """),
                    {"email": ADMIN_EMAIL, "password": hashed_password}
                )
            else:
                # Create new user
                print(f"Creating new admin user: {ADMIN_EMAIL}")
                conn.execute(
                    text("""
                        INSERT INTO users (email, hashed_password, full_name, is_admin, is_active, target_band_score)
                        VALUES (:email, :password, :full_name, TRUE, TRUE, 7)
                    """),
                    {
                        "email": ADMIN_EMAIL, 
                        "password": hashed_password,
                        "full_name": "Algsoch Admin"
                    }
                )
            
            # Remove admin from all other users
            conn.execute(
                text("UPDATE users SET is_admin = FALSE WHERE email != :email"),
                {"email": ADMIN_EMAIL}
            )
            
            conn.commit()
            
            # Fetch and display admin user
            result = conn.execute(
                text("SELECT id, email, full_name, is_admin, is_active FROM users WHERE email = :email"),
                {"email": ADMIN_EMAIL}
            )
            user = result.fetchone()
            
            if user:
                print(f"\n✅ Admin user configured successfully!")
                print(f"\n{'='*60}")
                print(f"Admin User Details:")
                print(f"{'='*60}")
                print(f"  ID:        {user[0]}")
                print(f"  Email:     {user[1]}")
                print(f"  Password:  {ADMIN_PASSWORD}")
                print(f"  Full Name: {user[2]}")
                print(f"  Is Admin:  {user[3]}")
                print(f"  Is Active: {user[4]}")
                print(f"{'='*60}")
                print(f"\n✨ All other users removed from admin role.")
                print(f"✨ Login with: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    create_or_update_admin()
