# backend/app/models/face.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class FaceAssessment(Base):
    __tablename__ = "face_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"), nullable=True)
    
    # Image/Video
    image_path = Column(String, nullable=True)
    video_path = Column(String, nullable=True)
    
    # ===== ADD: Emotion column =====
    emotion = Column(String, nullable=True)  # ← ADD THIS
    
    # Facial Features
    smile_intensity = Column(Float, nullable=True)
    facial_symmetry = Column(Float, nullable=True)
    blink_rate = Column(Float, nullable=True)
    eye_movement = Column(Float, nullable=True)
    facial_muscle_activity = Column(Float, nullable=True)
    
    # Scores
    score = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    status = Column(String, default="completed")
    
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="face_assessments")
    twin = relationship("DigitalTwin", back_populates="face_assessments")