# backend/scripts/update_schema.py
import sqlite3
import os

def update_database():
    """Add missing columns to users table"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'neurotwin.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    # Add missing columns
    if 'avatar' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar TEXT")
        print("✅ Added avatar column")
    
    if 'phone' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        print("✅ Added phone column")
    
    if 'address' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN address TEXT")
        print("✅ Added address column")
    
    if 'medical_history' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN medical_history TEXT")
        print("✅ Added medical_history column")
    
    if 'lifestyle_data' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN lifestyle_data TEXT")
        print("✅ Added lifestyle_data column")
    
    conn.commit()
    conn.close()
    print("✅ Database updated successfully!")

if __name__ == "__main__":
    update_database()