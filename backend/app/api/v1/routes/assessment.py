# backend/app/api/v1/routes/assessment.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.services.assessment_service import AssessmentService
from app.services.twin_service import TwinService

router = APIRouter(prefix="/assessment", tags=["Assessment"])

# ============ PYDANTIC MODELS ============

class AssessmentRequest(BaseModel):
    user_id: int
    assessment_type: str
    score: float
    accuracy: float = 0.0
    metrics: Dict[str, Any] = {}

class AssessmentResponse(BaseModel):
    status: str
    message: str
    data: Dict[str, Any]

# ============ ROUTES ============

@router.post("/submit")
async def submit_assessment(
    request: AssessmentRequest,
    db: Session = Depends(get_db)
):
    """Submit an assessment result"""
    try:
        service = AssessmentService(db)
        
        # Save assessment
        result = service.save_assessment(
            user_id=request.user_id,
            assessment_type=request.assessment_type,
            data={
                "score": request.score,
                "accuracy": request.accuracy,
                "metrics": request.metrics
            }
        )
        
        # Update twin service
        twin_service = TwinService(db)
        twin = twin_service.get_or_create_twin(request.user_id)
        twin_service.add_assessment(
            twin_id=twin.id,
            assessment_type=request.assessment_type,
            score=request.score,
            metrics=request.metrics
        )
        
        return {
            "status": "success",
            "message": f"{request.assessment_type} assessment submitted successfully",
            "data": result
        }
        
    except Exception as e:
        print(f"Assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{user_id}")
async def get_assessment_history(
    user_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get assessment history for user"""
    try:
        service = AssessmentService(db)
        history = service.get_assessment_history(user_id, limit)
        
        return {
            "status": "success",
            "data": history
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/brain-health/{user_id}")
async def get_brain_health_score(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get brain health score for user"""
    try:
        service = AssessmentService(db)
        score = service.get_brain_health_score(user_id)
        
        return {
            "status": "success",
            "data": score
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weekly-trends/{user_id}")
async def get_weekly_trends(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get weekly trends for user"""
    try:
        service = AssessmentService(db)
        trends = service.get_weekly_trends(user_id)
        
        return {
            "status": "success",
            "data": trends
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/all/{user_id}")
async def get_all_assessments(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all assessments for user"""
    try:
        service = AssessmentService(db)
        assessments = service.get_user_assessments(user_id)
        
        return {
            "status": "success",
            "data": assessments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))