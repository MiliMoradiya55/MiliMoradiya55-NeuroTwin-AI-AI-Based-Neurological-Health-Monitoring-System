# backend/app/models/voice.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class VoiceAssessment(Base):
    __tablename__ = "voice_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"), nullable=True)
    
    # Audio file
    recording_path = Column(String, nullable=True)
    duration = Column(Float, nullable=True)
    
    # Voice features
    pitch = Column(Float, nullable=True)
    pitch_baseline = Column(Float, nullable=True)
    jitter = Column(Float, nullable=True)
    jitter_baseline = Column(Float, nullable=True)
    shimmer = Column(Float, nullable=True)
    shimmer_baseline = Column(Float, nullable=True)
    hnr = Column(Float, nullable=True)
    hnr_baseline = Column(Float, nullable=True)
    voice_tremor = Column(Float, nullable=True)
    voice_tremor_baseline = Column(Float, nullable=True)
    speech_rate = Column(Float, nullable=True)
    speech_rate_baseline = Column(Float, nullable=True)
    
    # Scores
    score = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    status = Column(String, default="completed")
    
    # Timestamps
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ===== RELATIONSHIPS =====
    user = relationship("User", back_populates="voice_assessments")
    twin = relationship("DigitalTwin", back_populates="voice_assessments")  # ← ADD THIS