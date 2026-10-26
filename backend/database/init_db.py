# backend/database/init_db.py
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import (
    User, DigitalTwin, VoiceAssessment, TremorAssessment,
    MemoryAssessment, TypingAssessment, FaceAssessment,
    Assessment, WeeklyTrend, Notification
)

def init_database():
    """Create all tables"""
    print("🔄 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print("📁 Database file: neurotwin.db")

if __name__ == "__main__":
    init_database()