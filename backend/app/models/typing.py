# backend/app/models/typing.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class TypingAssessment(Base):
    __tablename__ = "typing_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    twin_id = Column(Integer, ForeignKey("digital_twins.id"), nullable=True)

    # ===== EXISTING FEATURES (unchanged) =====
    wpm = Column(Float, nullable=True)
    wpm_baseline = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    accuracy_baseline = Column(Float, nullable=True)
    error_rate = Column(Float, nullable=True)
    error_rate_baseline = Column(Float, nullable=True)
    backspace_count = Column(Integer, nullable=True)
    total_keystrokes = Column(Integer, nullable=True)
    key_interval_mean = Column(Float, nullable=True)
    key_interval_std = Column(Float, nullable=True)
    rhythm_consistency = Column(Float, nullable=True)
    rhythm_consistency_baseline = Column(Float, nullable=True)

    # ===== Hold time features =====
    hold_time_mean = Column(Float, nullable=True)
    hold_time_std = Column(Float, nullable=True)
    hold_time_min = Column(Float, nullable=True)
    hold_time_max = Column(Float, nullable=True)

    # ===== Latency features =====
    latency_mean = Column(Float, nullable=True)
    latency_std = Column(Float, nullable=True)
    latency_min = Column(Float, nullable=True)
    latency_max = Column(Float, nullable=True)

    # ===== Flight time features =====
    flight_time_mean = Column(Float, nullable=True)
    flight_time_std = Column(Float, nullable=True)
    flight_time_min = Column(Float, nullable=True)
    flight_time_max = Column(Float, nullable=True)

    # ===== Statistical features =====
    key_press_variance = Column(Float, nullable=True)
    rhythm_variance = Column(Float, nullable=True)
    backspace_frequency = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)

    # ===== Text fields =====
    text_typed = Column(Text, nullable=True)
    sample_text = Column(Text, nullable=True)

    # ===== Status & timestamps =====
    score = Column(Float, nullable=True)
    risk_score = Column(Float, nullable=True)
    status = Column(String, default="completed")
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ===== Relationships =====
    user = relationship("User", back_populates="typing_assessments")
    twin = relationship("DigitalTwin", back_populates="typing_assessments")