# backend/app/models/assessment.py

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"), nullable=True)
    
    voice_score = Column(Float, nullable=True)
    tremor_score = Column(Float, nullable=True)
    memory_score = Column(Float, nullable=True)
    typing_score = Column(Float, nullable=True)
    face_score = Column(Float, nullable=True)
    
    brain_health_score = Column(Float, nullable=True)
    previous_score = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    
    week_number = Column(Integer, nullable=True)
    status = Column(String, default="completed")
    
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ===== RELATIONSHIPS =====
    user = relationship("User", back_populates="assessments")
    twin = relationship("DigitalTwin", back_populates="assessments")  # ← ADD THIS