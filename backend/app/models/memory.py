# backend/app/models/memory.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class MemoryAssessment(Base):
    __tablename__ = "memory_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"), nullable=True)

    # Test details
    test_type = Column(String, nullable=False, default="word_recall")
    difficulty = Column(String, default="medium")
    
    # Results
    correct_count = Column(Integer, nullable=True)
    total_count = Column(Integer, nullable=True)
    accuracy = Column(Float, nullable=True)
    score = Column(Float, nullable=True)
    
    # Timing
    avg_reaction_time = Column(Float, nullable=True)
    total_time = Column(Float, nullable=True)
    
    # Memory metrics
    memory_level = Column(String, nullable=True)
    memory_quotient = Column(Float, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    # Status
    status = Column(String, default="completed")
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="memory_assessments")
    twin = relationship("DigitalTwin", back_populates="memory_assessments")