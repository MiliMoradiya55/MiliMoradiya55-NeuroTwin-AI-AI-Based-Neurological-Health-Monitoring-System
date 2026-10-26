# backend/scripts/fix_database.py
import sqlite3
import os

def fix_database():
    """Add missing columns to assessments table"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'neurotwin.db')
    
    if not os.path.exists(db_path):
        print("❌ Database not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check columns in assessments table
    cursor.execute("PRAGMA table_info(assessments)")
    columns = [col[1] for col in cursor.fetchall()]
    
    print(f"📊 Current columns: {columns}")
    
    # Add missing columns
    missing_columns = []
    
    if 'metrics' not in columns:
        cursor.execute("ALTER TABLE assessments ADD COLUMN metrics TEXT DEFAULT '{}'")
        missing_columns.append('metrics')
    
    if 'status' not in columns:
        cursor.execute("ALTER TABLE assessments ADD COLUMN status TEXT DEFAULT 'pending'")
        missing_columns.append('status')
    
    if 'completed_at' not in columns:
        cursor.execute("ALTER TABLE assessments ADD COLUMN completed_at DATETIME")
        missing_columns.append('completed_at')
    
    if 'created_at' not in columns:
        cursor.execute("ALTER TABLE assessments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        missing_columns.append('created_at')
    
    conn.commit()
    conn.close()
    
    if missing_columns:
        print(f"✅ Added missing columns: {missing_columns}")
    else:
        print("✅ All columns already exist")

if __name__ == "__main__":
    fix_database()