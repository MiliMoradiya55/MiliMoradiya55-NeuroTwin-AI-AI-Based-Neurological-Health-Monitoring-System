# backend/app/schemas/assessment.py
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AssessmentRequest(BaseModel):
    type: str
    metrics: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None

class AssessmentResponse(BaseModel):
    id: int
    user_id: int
    type: str
    status: str
    score: Optional[float]
    accuracy: Optional[float]
    confidence: Optional[float]
    metrics: Optional[Dict[str, Any]]
    assessment_date: Optional[str]
    ai_analysis: Optional[Dict[str, Any]]
    
class VoiceAssessmentRequest(BaseModel):
    user_id: int
    audio_file: str

class MemoryAssessmentRequest(BaseModel):
    user_id: int
    memory_type: str
    score: float
    accuracy: float
    correct_count: int
    total_count: int
    avg_reaction_time: float
    total_time: float