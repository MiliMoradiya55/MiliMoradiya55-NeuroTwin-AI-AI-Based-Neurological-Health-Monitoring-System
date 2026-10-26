# backend/app/models/tremor.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TremorAssessment(Base):
    __tablename__ = "tremor_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"), nullable=True)
    
    # Video/Image
    video_path = Column(String, nullable=True)
    image_path = Column(String, nullable=True)
    
    # Clinical Features
    tremor_frequency = Column(Float, nullable=True)      # Hz
    tremor_amplitude = Column(Float, nullable=True)      # mm
    hand_stability = Column(Float, nullable=True)        # 0-100
    jerk = Column(Float, nullable=True)                  # m/s³
    variance = Column(Float, nullable=True)              # mm²
    range_movement = Column(Float, nullable=True)        # mm
    wrist_stability = Column(Float, nullable=True)       # 0-100
    wrist_movement = Column(Float, nullable=True)        # mm
    
    # Scores
    score = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    label = Column(String, nullable=True)                # Normal/Mild/Severe
    status = Column(String, default="completed")
    
    # Timestamps
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ===== RELATIONSHIPS =====
    user = relationship("User", back_populates="tremor_assessments")
    twin = relationship("DigitalTwin", back_populates="tremor_assessments")