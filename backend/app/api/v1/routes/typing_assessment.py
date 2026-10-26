# backend/app/api/v1/routes/typing_assessment.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
import numpy as np

from app.database import get_db
from app.models.typing import TypingAssessment
from app.models.user import User
from app.models.twin import DigitalTwin
from app.services.auth_service import get_current_user_id
from app.services.assessment_aggregator import create_combined_assessment

router = APIRouter(prefix="/typing", tags=["Typing Assessment"])


# ==================== PYDANTIC MODELS ====================
class Keystroke(BaseModel):
    hold_time: float
    latency: float = 0
    flight_time: Optional[float] = 0
    hand: str = "R"
    direction: str = "S"


class TypingAssessmentCreate(BaseModel):
    keystrokes: List[Keystroke]
    sample_text: Optional[str] = None
    text_typed: Optional[str] = None

    # Frontend-computed features (all optional)
    hold_time_mean: Optional[float] = None
    hold_time_std: Optional[float] = None
    hold_time_min: Optional[float] = None
    hold_time_max: Optional[float] = None
    latency_mean: Optional[float] = None
    latency_std: Optional[float] = None
    latency_min: Optional[float] = None
    latency_max: Optional[float] = None
    flight_time_mean: Optional[float] = None
    flight_time_std: Optional[float] = None
    flight_time_min: Optional[float] = None
    flight_time_max: Optional[float] = None
    key_press_variance: Optional[float] = None
    rhythm_variance: Optional[float] = None
    backspace_frequency: Optional[float] = None
    consistency_score: Optional[float] = None


# ==================== SCORING TARGETS ====================
WPM_TARGET = 45.0
CONSISTENCY_TARGET = 85.0
ERROR_TARGET = 0.05


# ==================== RULE-BASED SCORING ====================
def compute_typing_score(features: dict, wpm_actual: float = 0.0) -> tuple:
    """
    Rule-based typing health score (0-100).
    Uses clinically-inspired weighted formula from typing research.
    """

    # ---- WPM Score ----
    effective_wpm = wpm_actual if wpm_actual > 0 else features.get('typing_speed', 0)
    wpm_score = min(100.0, (effective_wpm / WPM_TARGET) * 100) if effective_wpm > 0 else 50.0

    # ---- Consistency Score (already 0-100) ----
    consistency = features.get('consistency_score', 50.0)

    # ---- Error Penalty ----
    error_rate = features.get('error_rate', 0.0)
    error_score = max(0.0, 100.0 - (error_rate * 500))

    # ---- Weighted Composite ----
    raw_score = (
        wpm_score * 0.35 +
        consistency * 0.45 +
        error_score * 0.20
    )

    # ---- Small bonus for very high speed ----
    if effective_wpm >= 60:
        raw_score = min(100.0, raw_score + 5)
    elif effective_wpm >= 50:
        raw_score = min(100.0, raw_score + 2)

    score = max(0.0, min(100.0, raw_score))

    # ---- Status ----
    if score >= 90:
        status_text = "Optimal"
    elif score >= 80:
        status_text = "Good"
    elif score >= 70:
        status_text = "Monitor"
    else:
        status_text = "Action Required"

    return round(score, 1), status_text


# ==================== ROUTES ====================
@router.post("/assess", response_model=None)
async def assess_typing(
    data: TypingAssessmentCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Assess typing pattern and save results."""
    try:
        print(f"\n{'='*70}")
        print(f"📝 Analyzing typing for user: {user_id}")
        print(f"{'='*70}")

        keystrokes = [k.dict() for k in data.keystrokes]

        if len(keystrokes) < 5:
            raise HTTPException(
                status_code=400,
                detail="Insufficient keystrokes. Please type at least 5 keys."
            )

        # ===== TRUST FRONTEND FEATURES =====
        features = {
            'hold_time_mean': data.hold_time_mean or 0.0,
            'hold_time_std': data.hold_time_std or 0.0,
            'hold_time_min': data.hold_time_min or 0.0,
            'hold_time_max': data.hold_time_max or 0.0,
            'latency_mean': data.latency_mean or 0.0,
            'latency_std': data.latency_std or 0.0,
            'latency_min': data.latency_min or 0.0,
            'latency_max': data.latency_max or 0.0,
            'flight_time_mean': data.flight_time_mean or 0.0,
            'flight_time_std': data.flight_time_std or 0.0,
            'flight_time_min': data.flight_time_min or 0.0,
            'flight_time_max': data.flight_time_max or 0.0,
            'key_press_variance': data.key_press_variance or 0.0,
            'rhythm_variance': data.rhythm_variance or 0.0,
            'backspace_frequency': data.backspace_frequency or 0.0,
            'consistency_score': data.consistency_score or 50.0,
            'error_rate': data.backspace_frequency or 0.0,
            'typing_speed': 0.0,  # computed below
        }

        print(f"  Features: hold={features['hold_time_mean']:.2f}, "
              f"lat={features['latency_mean']:.2f}, "
              f"flight={features['flight_time_mean']:.2f}, "
              f"consistency={features['consistency_score']:.2f}, "
              f"rhythm_var={features['rhythm_variance']:.2f}")

        # ===== Compute WPM =====
        wpm = 0.0
        if data.text_typed and len(data.text_typed.strip()) > 0:
            words_typed = len(data.text_typed.strip().split())

            if features['flight_time_mean'] > 0 and len(keystrokes) > 1:
                total_time_ms = features['flight_time_mean'] * (len(keystrokes) - 1)
            elif features['latency_mean'] > 0:
                total_time_ms = features['latency_mean'] * len(keystrokes)
            else:
                total_time_ms = len(keystrokes) * 200

            minutes = total_time_ms / 60000
            wpm = words_typed / minutes if minutes > 0 else 0

        if wpm <= 0:
            wpm = 30.0

        wpm = max(10.0, min(120.0, wpm))
        features['typing_speed'] = wpm

        print(f"  WPM: {wpm:.2f}")

        # ===== Compute score =====
        score, status_text = compute_typing_score(features, wpm_actual=wpm)
        risk_score = 1.0 - (score / 100.0)

        print(f"  Score: {score}/100, Status: {status_text}")

        # ===== Twin =====
        twin = db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
        if not twin:
            twin = DigitalTwin(
                user_id=user_id,
                name=f"Twin_{user_id}",
                is_active=True
            )
            db.add(twin)
            db.commit()
            db.refresh(twin)

        backspace_count = sum(1 for k in keystrokes if k.get('direction') == 'B')

        # ===== Save assessment =====
        assessment = TypingAssessment(
            user_id=user_id,
            twin_id=twin.id,

            score=float(score),
            risk_score=float(risk_score),
            status=status_text,
            wpm=float(wpm),
            accuracy=float(features['consistency_score']),
            error_rate=float(features['error_rate']),
            backspace_count=int(backspace_count),
            total_keystrokes=int(len(keystrokes)),
            key_interval_mean=float(features['latency_mean']),
            key_interval_std=float(features['latency_std']),
            rhythm_consistency=float(features['consistency_score']),
            text_typed=data.text_typed,
            sample_text=data.sample_text,

            hold_time_mean=float(features['hold_time_mean']),
            hold_time_std=float(features['hold_time_std']),
            hold_time_min=float(features['hold_time_min']),
            hold_time_max=float(features['hold_time_max']),
            latency_mean=float(features['latency_mean']),
            latency_std=float(features['latency_std']),
            latency_min=float(features['latency_min']),
            latency_max=float(features['latency_max']),
            flight_time_mean=float(features['flight_time_mean']),
            flight_time_std=float(features['flight_time_std']),
            flight_time_min=float(features['flight_time_min']),
            flight_time_max=float(features['flight_time_max']),
            key_press_variance=float(features['key_press_variance']),
            rhythm_variance=float(features['rhythm_variance']),
            backspace_frequency=float(features['backspace_frequency']),
            consistency_score=float(features['consistency_score']),

            completed_at=datetime.utcnow()
        )

        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        print(f"✅ Saved: ID={assessment.id}, Score={score}/100, RhythmVar={features['rhythm_variance']}")
        print(f"{'='*70}\n")

        # ===== Combined assessment =====
        combined = None
        try:
            combined = create_combined_assessment(db, user_id, "typing", float(score))
            if combined:
                print(f"  ✅ Combined assessment: ID {combined.id}")
        except Exception as comb_err:
            print(f"  ⚠️ Combined assessment failed: {comb_err}")

        return {
            "status": "success",
            "message": "Typing assessment completed",
            "data": {
                "assessment_id": assessment.id,
                "score": assessment.score,
                "risk_score": assessment.risk_score,
                "status": assessment.status,
                "metrics": {
                    "typing_speed": assessment.wpm,
                    "consistency": assessment.accuracy,
                    "error_rate": assessment.error_rate,
                    "key_latency": assessment.key_interval_mean,
                    "rhythm_variance": assessment.rhythm_variance
                },
                "combined_assessment_id": combined.id if combined else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assess typing: {str(e)}"
        )


@router.get("/history/{user_id}", response_model=None)
async def get_typing_history(
    user_id: int,
    limit: int = 10,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get typing assessment history."""
    try:
        assessments = db.query(TypingAssessment).filter(
            TypingAssessment.user_id == user_id
        ).order_by(TypingAssessment.completed_at.desc()).limit(limit).all()

        return {
            "status": "success",
            "count": len(assessments),
            "data": [
                {
                    "id": a.id,
                    "score": a.score,
                    "risk_score": a.risk_score,
                    "status": a.status,
                    "wpm": a.wpm,
                    "accuracy": a.accuracy,
                    "completed_at": a.completed_at.isoformat() if a.completed_at else None
                }
                for a in assessments
            ]
        }
    except Exception as e:
        print(f"❌ Error fetching typing history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest", response_model=None)
async def get_latest_typing(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get latest typing assessment for current user."""
    try:
        assessment = db.query(TypingAssessment).filter(
            TypingAssessment.user_id == user_id
        ).order_by(TypingAssessment.completed_at.desc()).first()

        if not assessment:
            return {"status": "success", "data": None, "message": "No typing assessment found"}

        return {
            "status": "success",
            "data": {
                "id": assessment.id,
                "score": assessment.score,
                "risk_score": assessment.risk_score,
                "status": assessment.status,
                "wpm": assessment.wpm,
                "accuracy": assessment.accuracy,
                "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None
            }
        }
    except Exception as e:
        print(f"❌ Error fetching latest typing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trend/{user_id}", response_model=None)
async def get_typing_trend(
    user_id: int,
    weeks: int = 12,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get typing trend over weeks."""
    try:
        from sqlalchemy import func

        weekly_scores = db.query(
            func.strftime('%Y-%W', TypingAssessment.completed_at).label('week'),
            func.avg(TypingAssessment.score).label('avg_score'),
            func.count(TypingAssessment.id).label('count')
        ).filter(
            TypingAssessment.user_id == user_id
        ).group_by(
            func.strftime('%Y-%W', TypingAssessment.completed_at)
        ).order_by(
            func.strftime('%Y-%W', TypingAssessment.completed_at).desc()
        ).limit(weeks).all()

        scores = [round(w.avg_score, 1) for w in weekly_scores[::-1]]
        labels = [w.week for w in weekly_scores[::-1]]

        return {
            "status": "success",
            "data": {
                "weeks": len(scores),
                "labels": labels,
                "scores": scores,
                "counts": [w.count for w in weekly_scores[::-1]]
            }
        }
    except Exception as e:
        print(f"❌ Error fetching typing trend: {e}")
        return {
            "status": "success",
            "data": {"weeks": 0, "labels": [], "scores": [], "counts": []}
        }