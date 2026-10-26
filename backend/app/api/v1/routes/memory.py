# backend/app/api/v1/routes/memory.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.memory import MemoryAssessment
from app.models.twin import DigitalTwin
from app.services.auth_service import get_current_user_id
from app.services.assessment_aggregator import create_combined_assessment

router = APIRouter(prefix="/memory", tags=["Memory Assessment"])


class MemoryAssessmentCreate(BaseModel):
    score: float
    accuracy: float
    correct_count: int
    total_count: int
    avg_reaction_time: float
    total_time: float
    memory_level: str
    memory_quotient: float
    recommendation: str


@router.post("/assess", response_model=None)
async def create_memory_assessment(
    data: MemoryAssessmentCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    try:
        print(f"📝 Saving memory assessment for user: {user_id}")
        
        twin = db.query(DigitalTwin).filter(
            DigitalTwin.user_id == user_id
        ).first()
        
        if not twin:
            twin = DigitalTwin(
                user_id=user_id,
                name=f"Twin_{user_id}",
                is_active=True
            )
            db.add(twin)
            db.commit()
            db.refresh(twin)
        
        assessment = MemoryAssessment(
            user_id=user_id,
            twin_id=twin.id,
            test_type="word_recall",
            difficulty="medium",
            correct_count=data.correct_count,
            total_count=data.total_count,
            accuracy=data.accuracy,
            score=data.score,
            avg_reaction_time=data.avg_reaction_time,
            total_time=data.total_time,
            memory_level=data.memory_level,
            memory_quotient=data.memory_quotient,
            recommendation=data.recommendation,
            status="completed",
            completed_at=datetime.utcnow()
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        print(f"✅ Memory assessment saved with ID: {assessment.id}")
        
        # Create combined assessment
        combined = create_combined_assessment(db, user_id, "memory", data.score)
        
        return {
            "status": "success",
            "message": "Memory assessment saved successfully",
            "data": {
                "assessment_id": assessment.id,
                "score": assessment.score,
                "memory_level": assessment.memory_level,
                "combined_assessment_id": combined.id if combined else None
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error saving memory assessment: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save memory assessment: {str(e)}"
        )