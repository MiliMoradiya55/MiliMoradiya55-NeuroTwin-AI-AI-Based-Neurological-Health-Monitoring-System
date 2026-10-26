# backend/app/models/chat.py

from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"


class ChatResponse(BaseModel):
    text: str
    suggestions: List[str] = []
    source: str = "gemini"


class ClearHistoryResponse(BaseModel):
    status: str = "success"
    message: str = "Chat history cleared"