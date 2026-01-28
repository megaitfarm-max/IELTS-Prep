#!/usr/bin/env python3
"""
Script to create or update admin user from environment variables.
Usage: python create_admin.py
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

def create_or_update_admin():
    """Create or update admin user from .env configuration."""
    
    # Get configuration from environment
    admin_email = os.getenv("ADMIN_EMAIL")
    database_url = os.getenv("DATABASE_URL")
    
    if not admin_email:
        print("❌ ADMIN_EMAIL not found in .env file!")
        return False
    
    if not database_url:
        print("❌ DATABASE_URL not found in .env file!")
        return False
    
    # Get admin password from user input
    admin_password = input(f"Enter password for admin user ({admin_email}): ")
    
    if not admin_password:
        print("❌ Password cannot be empty!")
        return False
    
    try:
        # Hash the password
        hashed_password = get_password_hash(admin_password)
        
        # Connect to database
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if user exists
            result = conn.execute(
                text("SELECT id, email FROM users WHERE email = :email"),
                {"email": admin_email}
            )
            existing_user = result.fetchone()
            
            if existing_user:
                # Update existing user
                print(f"Updating existing user: {admin_email}")
                conn.execute(
                    text("""
                        UPDATE users 
                        SET hashed_password = :password, 
                            is_admin = TRUE, 
                            is_active = TRUE 
                        WHERE email = :email
                    """),
                    {"email": admin_email, "password": hashed_password}
                )
            else:
                # Create new user
                print(f"Creating new admin user: {admin_email}")
                conn.execute(
                    text("""
                        INSERT INTO users (email, hashed_password, full_name, is_admin, is_active, target_band_score)
                        VALUES (:email, :password, :full_name, TRUE, TRUE, 7)
                    """),
                    {
                        "email": admin_email, 
                        "password": hashed_password,
                        "full_name": admin_email.split('@')[0].title()
                    }
                )
            
            # Remove admin from all other users
            conn.execute(
                text("UPDATE users SET is_admin = FALSE WHERE email != :email"),
                {"email": admin_email}
            )
            
            conn.commit()
            
            # Fetch and display admin user
            result = conn.execute(
                text("SELECT id, email, full_name, is_admin, is_active FROM users WHERE email = :email"),
                {"email": admin_email}
            )
            user = result.fetchone()
            
            if user:
                print(f"\n✅ Admin user configured successfully!")
                print(f"\n{'='*50}")
                print(f"Admin User Details:")
                print(f"{'='*50}")
                print(f"  ID:        {user[0]}")
                print(f"  Email:     {user[1]}")
                print(f"  Full Name: {user[2]}")
                print(f"  Is Admin:  {user[3]}")
                print(f"  Is Active: {user[4]}")
                print(f"{'='*50}")
                print(f"\n✨ All other users have been removed from admin role.")
                print(f"✨ You can now login with these credentials to access the admin panel.")
            
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("="*50)
    print("Admin User Configuration")
    print("="*50)
    print(f"Admin email from .env: {os.getenv('ADMIN_EMAIL')}")
    print("="*50)
    print()
    create_or_update_admin()
