# backend/app/api/v1/routes/feedback.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.feedback import Feedback
from app.models.assessment import Assessment
from app.services.auth_service import get_current_user_id

router = APIRouter(prefix="/feedback", tags=["Feedback"])


# ============================================================
# WEEK BOUNDARY HELPERS
# ============================================================
def _week_start(dt: datetime) -> datetime:
    """Return Monday 00:00 of the week containing dt"""
    return dt.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=dt.weekday())


def _week_end(dt: datetime) -> datetime:
    """Return Sunday 23:59:59 of the week containing dt"""
    return _week_start(dt) + timedelta(days=7)


# ============================================================
# REQUEST MODELS
# ============================================================
class FeedbackSubmit(BaseModel):
    overall_rating: Optional[int] = None
    accuracy_rating: Optional[int] = None
    ease_rating: Optional[int] = None
    speed_rating: Optional[int] = None
    design_rating: Optional[int] = None
    value_rating: Optional[int] = None

    overall_experience: Optional[str] = None
    worked_well: Optional[str] = None
    needs_improvement: Optional[str] = None
    impact_health: Optional[str] = None
    impact_more: Optional[str] = None
    health_change: Optional[str] = None
    change_more: Optional[str] = None
    recommend_option: Optional[str] = None
    recommend_reason: Optional[str] = None
    valuable_learned: Optional[str] = None
    continue_using: Optional[str] = None
    feature_requests: Optional[str] = None
    bug_reports: Optional[str] = None
    uploaded_files: Optional[List[str]] = None
    positive_tags: Optional[List[str]] = None
    improvement_tags: Optional[List[str]] = None


# ============================================================
# 1. CHECK STATUS BEFORE ASSESSMENT
# ============================================================
@router.get("/status/{user_id}", response_model=None)
async def get_feedback_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Check the user's week status:
      - How many assessments this week
      - Whether feedback is required for the next assessment
      - Whether feedback has already been submitted this week

    Returns a `state` field for the frontend UX:
      - "free_first"  : user has done 0 assessments this week → 1st is free
      - "free_second" : user has done 1 assessment this week → 2nd is free
      - "gate"        : user has done 2+ assessments, no feedback → feedback required
      - "free"        : user has done 2+ assessments AND feedback submitted → unlimited
    """
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        now = datetime.utcnow()
        week_start = _week_start(now)
        week_end = _week_end(now)

        # Count assessments this week
        assessment_count = (
            db.query(Assessment)
            .filter(
                Assessment.user_id == user_id,
                Assessment.completed_at >= week_start,
                Assessment.completed_at < week_end,
            )
            .count()
        )

        # Check if feedback already submitted this week
        feedback_record = (
            db.query(Feedback)
            .filter(
                Feedback.user_id == user_id,
                Feedback.week_start_date >= week_start,
                Feedback.week_start_date < week_end,
            )
            .order_by(Feedback.submitted_at.desc())
            .first()
        )

        feedback_submitted = feedback_record is not None

        # ------------------------------------------------------------
        # Determine state & UX hint
        # ------------------------------------------------------------
        if assessment_count < 2:
            state = "free_first" if assessment_count == 0 else "free_second"
            requires_feedback = False
            can_take = True
            message = (
                "You can complete your first assessment of the week."
                if assessment_count == 0
                else "You have 1 free assessment remaining this week. After the next one, feedback will be required."
            )
        elif not feedback_submitted:
            state = "gate"
            requires_feedback = True
            can_take = False
            message = (
                "You've completed 2 assessments this week. "
                "Please share your feedback before continuing to the next assessment."
            )
        else:
            state = "free"
            requires_feedback = False
            can_take = True
            message = "Feedback received. You can continue with unlimited assessments this week."

        return {
            "status": "success",
            "data": {
                "week_start": week_start.isoformat(),
                "week_end": week_end.isoformat(),
                "state": state,
                "assessment_count_this_week": assessment_count,
                "feedback_submitted": feedback_submitted,
                "feedback_id": feedback_record.id if feedback_record else None,
                "next_assessment_requires_feedback": requires_feedback,
                "can_take_assessment": can_take,
                "message": message,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Feedback status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 2. GET CONTEXT FOR THE FEEDBACK FORM
# ============================================================
@router.get("/context/{user_id}", response_model=None)
async def get_feedback_context(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Returns the user's two most recent assessments this week
    plus comparison metrics so the feedback form can display
    'impact', 'experience', and 'comparison' info.
    """
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        now = datetime.utcnow()
        week_start = _week_start(now)
        week_end = _week_end(now)

        recent = (
            db.query(Assessment)
            .filter(
                Assessment.user_id == user_id,
                Assessment.completed_at >= week_start,
                Assessment.completed_at < week_end,
            )
            .order_by(Assessment.completed_at.desc())
            .limit(2)
            .all()
        )

        def to_dict(a: Assessment) -> dict:
            return {
                "id": a.id,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                "brain_health_score": a.brain_health_score or 0,
                "voice_score": a.voice_score or 0,
                "memory_score": a.memory_score or 0,
                "tremor_score": a.tremor_score or 0,
                "typing_score": a.typing_score or 0,
                "face_score": a.face_score or 0,
            }

        if len(recent) == 0:
            return {
                "status": "success",
                "data": {
                    "assessment_1": None,
                    "assessment_2": None,
                    "comparison": None,
                },
            }

        a1 = to_dict(recent[0])
        a2 = to_dict(recent[1]) if len(recent) > 1 else None

        comparison = None
        if a2:
            comparison = {
                "brain_health_change": round(a1["brain_health_score"] - a2["brain_health_score"], 1),
                "voice_change": round(a1["voice_score"] - a2["voice_score"], 1),
                "memory_change": round(a1["memory_score"] - a2["memory_score"], 1),
                "tremor_change": round(a1["tremor_score"] - a2["tremor_score"], 1),
                "typing_change": round(a1["typing_score"] - a2["typing_score"], 1),
                "face_change": round(a1["face_score"] - a2["face_score"], 1),
                "overall_trend": (
                    "improving" if a1["brain_health_score"] > a2["brain_health_score"]
                    else "declining" if a1["brain_health_score"] < a2["brain_health_score"]
                    else "stable"
                ),
            }

        return {
            "status": "success",
            "data": {
                "assessment_1": a1,
                "assessment_2": a2,
                "comparison": comparison,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Feedback context error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 3. SUBMIT FEEDBACK
# ============================================================
@router.post("/submit/{user_id}", response_model=None)
async def submit_feedback(
    user_id: int,
    payload: FeedbackSubmit,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """Store user feedback for the current week."""
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        now = datetime.utcnow()
        week_start = _week_start(now)
        week_end = _week_end(now)

        # Prevent duplicate feedback per week
        existing = (
            db.query(Feedback)
            .filter(
                Feedback.user_id == user_id,
                Feedback.week_start_date >= week_start,
                Feedback.week_start_date < week_end,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Feedback already submitted for this week.",
            )

        # Grab last 2 assessments for context snapshot
        recent = (
            db.query(Assessment)
            .filter(
                Assessment.user_id == user_id,
                Assessment.completed_at >= week_start,
                Assessment.completed_at < week_end,
            )
            .order_by(Assessment.completed_at.desc())
            .limit(2)
            .all()
        )

        a1_id = recent[0].id if len(recent) > 0 else None
        a2_id = recent[1].id if len(recent) > 1 else None

        a1_scores = None
        a2_scores = None
        if a1_id:
            a = recent[0]
            a1_scores = {
                "brain_health": a.brain_health_score,
                "voice": a.voice_score,
                "memory": a.memory_score,
                "tremor": a.tremor_score,
                "typing": a.typing_score,
                "face": a.face_score,
            }
        if a2_id:
            a = recent[1]
            a2_scores = {
                "brain_health": a.brain_health_score,
                "voice": a.voice_score,
                "memory": a.memory_score,
                "tremor": a.tremor_score,
                "typing": a.typing_score,
                "face": a.face_score,
            }

        record = Feedback(
            user_id=user_id,
            week_start_date=week_start,
            assessment_count_before_feedback=len(recent),
            overall_rating=payload.overall_rating,
            accuracy_rating=payload.accuracy_rating,
            ease_rating=payload.ease_rating,
            speed_rating=payload.speed_rating,
            design_rating=payload.design_rating,
            value_rating=payload.value_rating,
            overall_experience=payload.overall_experience,
            worked_well=payload.worked_well,
            needs_improvement=payload.needs_improvement,
            impact_health=payload.impact_health,
            impact_more=payload.impact_more,
            health_change=payload.health_change,
            change_more=payload.change_more,
            recommend_option=payload.recommend_option,
            recommend_reason=payload.recommend_reason,
            valuable_learned=payload.valuable_learned,
            continue_using=payload.continue_using,
            feature_requests=payload.feature_requests,
            bug_reports=payload.bug_reports,
            uploaded_files=payload.uploaded_files or [],
            positive_tags=payload.positive_tags or [],
            improvement_tags=payload.improvement_tags or [],
            assessment_1_id=a1_id,
            assessment_2_id=a2_id,
            assessment_1_scores=a1_scores,
            assessment_2_scores=a2_scores,
            submitted_at=now,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "status": "success",
            "message": "Feedback stored successfully.",
            "data": {"feedback_id": record.id},
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Feedback submit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))