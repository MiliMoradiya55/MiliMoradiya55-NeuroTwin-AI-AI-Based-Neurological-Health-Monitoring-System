# scripts/seed_data.py
"""
NeuroTwin AI - Database Seeding Script
Populates SQLite database with demo accounts and 12-week longitudinal assessment data.
"""
import os
import sys

# Ensure backend path is included
BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, BACKEND_DIR)

from app.database import get_db_connection
from app.services.auth_service import get_password_hash

def seed_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Demo Users
    users = [
        ("Arthur Vance", "patient@neurotwin.ai", get_password_hash("password123"), "patient", 58, "Male"),
        ("Dr. Sarah Chen", "doctor@neurotwin.ai", get_password_hash("password123"), "doctor", 42, "Female"),
        ("Clara Vance", "family@neurotwin.ai", get_password_hash("password123"), "family", 29, "Female"),
        ("System Admin", "admin@neurotwin.ai", get_password_hash("password123"), "admin", 35, "Other")
    ]
    
    for name, email, pw_hash, role, age, gender in users:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO users (name, email, password_hash, role, age, gender) VALUES (?, ?, ?, ?, ?, ?)",
                (name, email, pw_hash, role, age, gender)
            )
            print(f"✅ Created user: {email} ({role})")
            
    conn.commit()
    conn.close()
    print("🎉 Database seeding complete!")

if __name__ == "__main__":
    seed_database()
