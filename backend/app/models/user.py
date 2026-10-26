# backend/app/models/user.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, nullable=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    role = Column(String(20), default="patient")
    
    # Profile
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)      # ✅ Make sure this exists
    address = Column(String, nullable=True)    # ✅ Make sure this exists
    
    # Medical
    medical_history = Column(Text, nullable=True)
    lifestyle_data = Column(Text, nullable=True)
    
    # Account
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    digital_twin = relationship("DigitalTwin", back_populates="user", uselist=False)
    voice_assessments = relationship("VoiceAssessment", back_populates="user", cascade="all, delete-orphan")
    tremor_assessments = relationship("TremorAssessment", back_populates="user", cascade="all, delete-orphan")
    memory_assessments = relationship("MemoryAssessment", back_populates="user", cascade="all, delete-orphan")
    typing_assessments = relationship("TypingAssessment", back_populates="user", cascade="all, delete-orphan")
    face_assessments = relationship("FaceAssessment", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")  # ✅ NEW

    def to_dict(self):
        return {
            "id": self.id,
            "uuid": self.uuid,
            "name": self.name,
            "email": self.email,
            "age": self.age,
            "gender": self.gender,
            "role": self.role,
            "avatar": self.avatar,
            "phone": self.phone,        # ✅ MUST include this
            "address": self.address,    # ✅ MUST include this
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }