#!/usr/bin/env python3
"""
Script to set a user as admin in the database.
Usage: python set_admin.py
"""
import sqlite3
import os

def set_admin_user(email: str, db_path: str = "ielts_prep.db"):
    """Set user with given email as admin."""
    
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Update user to set is_admin = 1 (TRUE)
        cursor.execute(
            "UPDATE users SET is_admin = 1 WHERE email = ?",
            (email,)
        )
        
        if cursor.rowcount == 0:
            print(f"❌ User with email {email} not found!")
            conn.close()
            return False
        
        conn.commit()
        
        # Fetch and display user details
        cursor.execute(
            "SELECT id, email, full_name, is_admin, is_active FROM users WHERE email = ?",
            (email,)
        )
        user = cursor.fetchone()
        
        if user:
            print(f"✅ User {email} has been set as admin!")
            print(f"User details:")
            print(f"  - ID: {user[0]}")
            print(f"  - Email: {user[1]}")
            print(f"  - Full Name: {user[2]}")
            print(f"  - Is Admin: {bool(user[3])}")
            print(f"  - Is Active: {bool(user[4])}")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    ADMIN_EMAIL = "npdimagine@gmail.com"
    print(f"Setting {ADMIN_EMAIL} as admin...")
    set_admin_user(ADMIN_EMAIL)
