# backend/app/api/v1/routes/voice.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime

from app.database import get_db
from app.services.voice_service import VoiceService
from app.services.auth_service import get_current_user_id
from app.services.assessment_aggregator import create_combined_assessment

router = APIRouter(prefix="/voice", tags=["Voice Assessment"])

UPLOAD_DIR = "uploads/voice"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/assess", response_model=None)
async def assess_voice(
    audio: UploadFile = File(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        if not audio.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = os.path.splitext(audio.filename)[1].lower()
        filename = f"voice_{user_id}_{timestamp}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        service = VoiceService(db)
        result = service.create_assessment(
            user_id=user_id,
            audio_path=filepath
        )
        
        if result and not result.get('error'):
            voice_score = result.get('score', 0)
            combined = create_combined_assessment(db, user_id, "voice", voice_score)
            if combined:
                result['combined_assessment_id'] = combined.id
        
        return {
            "status": "success",
            "message": "Voice assessment completed",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Voice assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))