# backend/app/api/v1/routes/ai_chat.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from llm.chatbot import ClinicalAIChatbot
from app.services.twin_service import TwinService

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: Optional[int] = 1
    query: str

@router.post("/query")
async def chat_query(req: ChatRequest):
    twin = TwinService.get_digital_twin_profile(req.user_id or 1)
    patient_context = {
        "brain_health_score": twin["brain_health_score"],
        "recent_changes": ["Typing rhythm latency +13%", "Voice pitch stability -4.2%"]
    }
    
    resp = ClinicalAIChatbot.generate_response(req.query, patient_context)
    return resp