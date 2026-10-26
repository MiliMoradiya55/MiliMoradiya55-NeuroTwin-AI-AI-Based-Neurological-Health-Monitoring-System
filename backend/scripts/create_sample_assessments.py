# backend/scripts/create_sample_assessments.py
import sqlite3
from datetime import datetime, timedelta
import random
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def create_sample_assessments():
    """Create sample assessment data for testing"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'neurotwin.db')
    
    if not os.path.exists(db_path):
        print("❌ Database not found!")
        print("   Please run the backend first: uvicorn app.main:app --reload --port 8000")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("❌ Users table not found!")
        print("   Please register a user first.")
        return
    
    # Check if user exists
    cursor.execute("SELECT id, name, email FROM users LIMIT 1")
    user = cursor.fetchone()
    
    if not user:
        print("❌ No user found!")
        print("   Please register first via: http://localhost:3000/register")
        return
    
    user_id, user_name, user_email = user
    print(f"✅ Found user: {user_name} ({user_email}) - ID: {user_id}")
    
    # Check if assessments already exist
    cursor.execute("SELECT COUNT(*) FROM assessments WHERE user_id = ?", (user_id,))
    count = cursor.fetchone()[0]
    
    if count > 0:
        print(f"✅ Assessments already exist for user {user_name} ({count} assessments)")
        conn.close()
        return
    
    # Create assessment table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            assessment_type VARCHAR(50) NOT NULL,
            score FLOAT DEFAULT 0,
            accuracy FLOAT DEFAULT 0,
            metrics TEXT DEFAULT '{}',
            status VARCHAR(20) DEFAULT 'pending',
            completed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    
    # Create sample assessments
    assessment_types = ['voice', 'memory', 'tremor', 'typing']
    base_date = datetime.now() - timedelta(days=30)
    
    assessments = []
    for i in range(8):
        date = base_date + timedelta(days=i * 4)
        score = random.randint(75, 92)
        accuracy = random.randint(80, 98)
        a_type = assessment_types[i % 4]
        
        assessments.append((
            user_id,
            a_type,
            score,
            accuracy,
            '{}',
            'completed',
            date.isoformat(),
            datetime.now().isoformat()
        ))
    
    cursor.executemany("""
        INSERT INTO assessments 
        (user_id, assessment_type, score, accuracy, metrics, status, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, assessments)
    
    conn.commit()
    conn.close()
    
    print(f"✅ Created {len(assessments)} sample assessments for user {user_name}")
    print("   Assessment types: voice, memory, tremor, typing")
    print("   Scores range: 75-92")
    print("   You can now view your dashboard!")

if __name__ == "__main__":
    create_sample_assessments()