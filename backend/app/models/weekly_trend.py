# backend/app/models/weekly_trend.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database import Base

class WeeklyTrend(Base):
    __tablename__ = "weekly_trends"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    
    avg_voice_score = Column(Float, nullable=True)
    avg_tremor_score = Column(Float, nullable=True)
    avg_memory_score = Column(Float, nullable=True)
    avg_typing_score = Column(Float, nullable=True)
    avg_face_score = Column(Float, nullable=True)
    avg_brain_health_score = Column(Float, nullable=True)
    
    trend_direction = Column(String, nullable=True)
    deviation_percentage = Column(Float, nullable=True)
    assessments_count = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)