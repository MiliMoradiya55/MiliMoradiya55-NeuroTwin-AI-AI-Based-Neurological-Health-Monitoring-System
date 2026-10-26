# backend/app/api/v1/routes/dashboard.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json

from app.database import get_db
from app.models.user import User
from app.models.twin import DigitalTwin
from app.models.voice import VoiceAssessment
from app.models.tremor import TremorAssessment
from app.models.memory import MemoryAssessment
from app.models.typing import TypingAssessment
from app.models.face import FaceAssessment
from app.models.assessment import Assessment
from app.services.auth_service import get_current_user_id, get_current_user

# ✅ FIXED: Changed prefix from "/timeline" to "/dashboard"
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/status/{user_id}", response_model=None)
async def get_assessment_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Check if user has completed any assessments"""
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        assessment_count = db.query(func.count(Assessment.id)).filter(
            Assessment.user_id == user_id
        ).scalar() or 0

        voice_count = db.query(func.count(VoiceAssessment.id)).filter(
            VoiceAssessment.user_id == user_id
        ).scalar() or 0

        memory_count = db.query(func.count(MemoryAssessment.id)).filter(
            MemoryAssessment.user_id == user_id
        ).scalar() or 0

        tremor_count = db.query(func.count(TremorAssessment.id)).filter(
            TremorAssessment.user_id == user_id
        ).scalar() or 0

        typing_count = db.query(func.count(TypingAssessment.id)).filter(
            TypingAssessment.user_id == user_id
        ).scalar() or 0

        face_count = db.query(func.count(FaceAssessment.id)).filter(
            FaceAssessment.user_id == user_id
        ).scalar() or 0

        total_count = assessment_count + voice_count + memory_count + tremor_count + typing_count + face_count
        has_assessments = total_count > 0

        return {
            "status": "success",
            "data": {
                "has_assessments": has_assessments,
                "assessment_count": total_count,
                "modules_completed": {
                    "voice": voice_count > 0,
                    "memory": memory_count > 0,
                    "tremor": tremor_count > 0,
                    "typing": typing_count > 0,
                    "face": face_count > 0
                }
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get assessment status: {str(e)}"
        )


# ✅ FIXED: This is the ONLY dashboard endpoint in this file
@router.get("/overview/{user_id}", response_model=None)
async def get_dashboard_overview(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get dashboard overview data for a user"""
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        twin = db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
        if not twin:
            twin = DigitalTwin(
                user_id=user_id,
                name=f"Twin_{user_id}",
                is_active=True,
                baseline_created_at=datetime.utcnow()
            )
            db.add(twin)
            db.commit()
            db.refresh(twin)

        assessments = db.query(Assessment).filter(
            Assessment.user_id == user_id
        ).order_by(Assessment.completed_at.desc()).all()

        latest_voice = db.query(VoiceAssessment).filter(VoiceAssessment.user_id == user_id).order_by(VoiceAssessment.completed_at.desc()).first()
        latest_memory = db.query(MemoryAssessment).filter(MemoryAssessment.user_id == user_id).order_by(MemoryAssessment.completed_at.desc()).first()
        latest_tremor = db.query(TremorAssessment).filter(TremorAssessment.user_id == user_id).order_by(TremorAssessment.completed_at.desc()).first()
        latest_typing = db.query(TypingAssessment).filter(TypingAssessment.user_id == user_id).order_by(TypingAssessment.completed_at.desc()).first()
        latest_face = db.query(FaceAssessment).filter(FaceAssessment.user_id == user_id).order_by(FaceAssessment.completed_at.desc()).first()

        total_assessments = len(assessments)

        modules = {
            "voice": latest_voice.score if latest_voice else 0,
            "memory": latest_memory.score if latest_memory else 0,
            "tremor": latest_tremor.score if latest_tremor else 0,
            "typing": latest_typing.score if latest_typing else 0,
            "face": latest_face.score if latest_face else 0,
            "reaction": 0
        }

        if assessments:
            latest = assessments[0]
            brain_health_score = latest.brain_health_score or 0
            previous_score = assessments[1].brain_health_score if len(assessments) > 1 and assessments[1].brain_health_score else 0
            change = brain_health_score - previous_score if previous_score > 0 else 0
            last_assessment = latest.completed_at.isoformat() if latest.completed_at else None
        else:
            module_scores = list(modules.values())[:5]
            valid_scores = [s for s in module_scores if s > 0]
            brain_health_score = round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0
            previous_score = 0
            change = 0
            last_assessment = None

        scores = [a.brain_health_score for a in assessments if a.brain_health_score is not None]
        highest_score = max(scores) if scores else 0
        lowest_score = min(scores) if scores else 0

        streak = calculate_streak(assessments) if assessments else 0

        return {
            "status": "success",
            "data": {
                "brain_health_score": brain_health_score,
                "previous_score": previous_score,
                "change": round(change, 1),
                "total_assessments": total_assessments,
                "streak": streak,
                "highest_score": highest_score,
                "lowest_score": lowest_score,
                "last_assessment": last_assessment,
                "modules": modules
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard data: {str(e)}"
        )


# ===== HELPER FUNCTIONS =====
def calculate_streak(assessments) -> int:
    """Calculate current streak of consecutive days with assessments"""
    if not assessments:
        return 0

    streak = 0
    current_date = datetime.utcnow().date()

    assessment_dates = set()
    for a in assessments:
        if a.completed_at:
            assessment_dates.add(a.completed_at.date())

    for i in range(30):
        check_date = current_date - timedelta(days=i)
        if check_date in assessment_dates:
            streak += 1
        else:
            break

    return streak