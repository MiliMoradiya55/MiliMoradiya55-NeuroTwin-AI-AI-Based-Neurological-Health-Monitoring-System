# backend/app/models/__init__.py

from .user import User
from .twin import DigitalTwin
from .voice import VoiceAssessment
from .tremor import TremorAssessment
from .memory import MemoryAssessment
from .typing import TypingAssessment
from .face import FaceAssessment
from .assessment import Assessment
from .weekly_trend import WeeklyTrend
from .ai_insight import AIInsight
from .notification import Notification
from .feedback import Feedback          # ✅ NEW

__all__ = [
    "User",
    "DigitalTwin",
    "VoiceAssessment",
    "TremorAssessment",
    "MemoryAssessment",
    "TypingAssessment",
    "FaceAssessment",
    "Assessment",
    "WeeklyTrend",
    "AIInsight",
    "Notification",
    "Feedback",                          # ✅ NEW
]