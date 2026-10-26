# backend/app/models/twin.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class DigitalTwin(Base):
    __tablename__ = "digital_twins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String, default="My Digital Twin")
    version = Column(String, default="1.0.0")
    
    baseline_data = Column(Text, nullable=True)
    baseline_created_at = Column(DateTime, nullable=True)
    current_metrics = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    confidence_score = Column(Float, default=0.0)
    
    # ===== RELATIONSHIPS =====
    user = relationship("User", back_populates="digital_twin")
    
    # Voice assessments
    voice_assessments = relationship("VoiceAssessment", back_populates="twin", cascade="all, delete-orphan")
    
    # ===== ADD: Tremor assessments =====
    tremor_assessments = relationship("TremorAssessment", back_populates="twin", cascade="all, delete-orphan")
    
    # Memory assessments
    memory_assessments = relationship("MemoryAssessment", back_populates="twin", cascade="all, delete-orphan")
    
    # Typing assessments
    typing_assessments = relationship("TypingAssessment", back_populates="twin", cascade="all, delete-orphan")
    
    # Face assessments
    face_assessments = relationship("FaceAssessment", back_populates="twin", cascade="all, delete-orphan")
    
    # Overall assessments
    assessments = relationship("Assessment", back_populates="twin", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "version": self.version,
            "baseline_data": self.baseline_data,
            "baseline_created_at": self.baseline_created_at.isoformat() if self.baseline_created_at else None,
            "current_metrics": self.current_metrics,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "is_active": self.is_active,
            "confidence_score": self.confidence_score
        }