# # backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/neurotwin")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    from app.models import (
        User, 
        DigitalTwin,
        VoiceAssessment,
        TremorAssessment,
        MemoryAssessment,
        TypingAssessment,
        FaceAssessment,
        Assessment,
        WeeklyTrend,
        AIInsight,
        Notification,
        Feedback
    )
    Base.metadata.create_all(bind=engine)

    print("✅ Database initialized successfully with PostgreSQL!")



