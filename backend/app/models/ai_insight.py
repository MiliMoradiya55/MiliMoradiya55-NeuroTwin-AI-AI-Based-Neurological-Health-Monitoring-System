# backend/app/models/ai_insight.py
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=True)
    
    insight_type = Column(String, nullable=True)
    insight_text = Column(Text, nullable=True)
    severity = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    
    recommendation = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)
    
    is_read = Column(Boolean, default=False)
    is_actioned = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)