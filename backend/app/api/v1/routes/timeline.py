# backend/app/api/v1/routes/timeline.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from collections import OrderedDict
import numpy as np
import os
import logging

from app.database import get_db
from app.models.assessment import Assessment
from app.models.voice import VoiceAssessment
from app.models.tremor import TremorAssessment
from app.models.memory import MemoryAssessment
from app.models.typing import TypingAssessment
from app.models.face import FaceAssessment
from app.models.twin import DigitalTwin
from app.services.auth_service import get_current_user_id
from app.services.shap_service import get_shap_service

logger = logging.getLogger(_name_)

router = APIRouter(prefix="/timeline", tags=["Timeline"])


# ============================================================
# HELPER FUNCTIONS - SINGLE SOURCE OF TRUTH
# ============================================================
def _get_latest_score(db: Session, model, user_id: int, score_field: str = "score") -> float:
    """Get the latest (most recent) single score for a module"""
    record = db.query(model).filter(
        model.user_id == user_id,
        getattr(model, score_field).isnot(None)
    ).order_by(model.completed_at.desc()).first()
    if record:
        score = getattr(record, score_field)
        return float(score) if score and score > 0 else 0.0
    return 0.0


def _get_baseline_score(db: Session, model, user_id: int, score_field: str = "score") -> float:
    """Get the baseline (average) score for a specific module"""
    records = db.query(model).filter(
        model.user_id == user_id,
        getattr(model, score_field).isnot(None)
    ).all()
    scores = [
        float(getattr(r, score_field))
        for r in records
        if getattr(r, score_field) and getattr(r, score_field) > 0
    ]
    return round(sum(scores) / len(scores), 1) if scores else 0.0


def _calculate_streak(db: Session, user_id: int) -> int:
    """Calculate current streak of consecutive days with at least one assessment"""
    dates = set()
    
    # Check all 5 modules for assessment dates
    for model in [VoiceAssessment, MemoryAssessment, TremorAssessment, TypingAssessment, FaceAssessment]:
        records = db.query(model.completed_at).filter(
            model.user_id == user_id,
            model.completed_at.isnot(None)
        ).all()
        for r in records:
            if r.completed_at:
                dates.add(r.completed_at.date())
                
    if not dates:
        return 0

    streak = 0
    current_date = datetime.utcnow().date()

    # Check backwards from today
    for i in range(365):
        check_date = current_date - timedelta(days=i)
        if check_date in dates:
            streak += 1
        else:
            # If they haven't done one today yet, allow the streak to count from yesterday
            if i == 0:
                continue
            break

    return streak


def _calculate_brain_health(db: Session, user_id: int) -> dict:
    """
    Single source of truth for Brain Health calculation.
    Uses LATEST single score per module (NOT daily average).
    """
    latest_scores = {
        "voice": _get_latest_score(db, VoiceAssessment, user_id),
        "memory": _get_latest_score(db, MemoryAssessment, user_id),
        "tremor": _get_latest_score(db, TremorAssessment, user_id),
        "typing": _get_latest_score(db, TypingAssessment, user_id),
        "face": _get_latest_score(db, FaceAssessment, user_id),
    }

    baseline_scores = {
        "voice": _get_baseline_score(db, VoiceAssessment, user_id),
        "memory": _get_baseline_score(db, MemoryAssessment, user_id),
        "tremor": _get_baseline_score(db, TremorAssessment, user_id),
        "typing": _get_baseline_score(db, TypingAssessment, user_id),
        "face": _get_baseline_score(db, FaceAssessment, user_id),
    }

    valid_latest = [v for v in latest_scores.values() if v > 0]
    valid_baseline = [v for v in baseline_scores.values() if v > 0]

    brain_health = round(sum(valid_latest) / len(valid_latest), 1) if valid_latest else 0.0
    baseline_health = round(sum(valid_baseline) / len(valid_baseline), 1) if valid_baseline else 0.0

    change_percent = 0.0
    if baseline_health > 0:
        change_percent = round((brain_health - baseline_health) / baseline_health * 100, 1)

    # Calculate real streak
    streak = _calculate_streak(db, user_id)

    return {
        "brain_health_score": brain_health,
        "baseline_brain_health": baseline_health,
        "modules": latest_scores,
        "baseline": baseline_scores,
        "change_percent": change_percent,
        "change_points": round(brain_health - baseline_health, 1),
        "highest_score": max(valid_latest) if valid_latest else 0.0,
        "lowest_score": min(valid_latest) if valid_latest else 0.0,
        "streak": streak,
    }


# ============================================================
# RULE-BASED ATTRIBUTION HELPERS (Face & Memory)
# ============================================================
def _extract_face_attributions(assessment) -> list:
    """
    Rule-based attribution for the Face module.
    Mirrors the weighted formula in face_service.calculate_score().
    """
    attributions = []

    # --- Emotion contribution ---
    emotion = (assessment.emotion or 'neutral').lower()
    if emotion == 'happy':
        emotion_score = 20.0
        reason = "Positive emotional expression detected"
    elif emotion == 'neutral':
        emotion_score = 10.0
        reason = "Neutral, stable expression"
    elif emotion in ('sad', 'fear'):
        emotion_score = -5.0
        reason = "Negative emotional indicators present"
    elif emotion == 'angry':
        emotion_score = -10.0
        reason = "Elevated negative affect detected"
    elif emotion == 'surprise':
        emotion_score = 0.0
        reason = "Surprise expression (neutral weighting)"
    else:
        emotion_score = 0.0
        reason = "Emotion detected"

    attributions.append({
        "feature": "emotion",
        "value": emotion,
        "shap_value": round(emotion_score, 3),
        "abs_shap": abs(round(emotion_score, 3)),
        "direction": "positive" if emotion_score >= 0 else "negative",
        "reason": reason,
    })

    # --- Smile intensity ---
    smile = float(assessment.smile_intensity or 0)
    if smile > 0.6:
        smile_score = 10.0
        smile_reason = f"Strong smile intensity ({smile:.2f})"
    elif smile > 0.3:
        smile_score = 5.0
        smile_reason = f"Moderate smile intensity ({smile:.2f})"
    else:
        smile_score = 0.0
        smile_reason = f"Low smile intensity ({smile:.2f})"

    attributions.append({
        "feature": "smile_intensity",
        "value": round(smile, 3),
        "shap_value": round(smile_score, 3),
        "abs_shap": abs(round(smile_score, 3)),
        "direction": "positive" if smile_score >= 0 else "negative",
        "reason": smile_reason,
    })

    # --- Facial symmetry ---
    symmetry = float(assessment.facial_symmetry or 50)
    if symmetry > 85:
        sym_score = 10.0
        sym_reason = f"Excellent facial symmetry ({symmetry:.1f})"
    elif symmetry > 70:
        sym_score = 5.0
        sym_reason = f"Good facial symmetry ({symmetry:.1f})"
    elif symmetry < 60:
        sym_score = -5.0
        sym_reason = f"Reduced facial symmetry ({symmetry:.1f})"
    else:
        sym_score = 0.0
        sym_reason = f"Facial symmetry in normal range ({symmetry:.1f})"

    attributions.append({
        "feature": "facial_symmetry",
        "value": round(symmetry, 2),
        "shap_value": round(sym_score, 3),
        "abs_shap": abs(round(sym_score, 3)),
        "direction": "positive" if sym_score >= 0 else "negative",
        "reason": sym_reason,
    })

    # --- Blink rate ---
    blink = float(assessment.blink_rate or 16)
    if 14 <= blink <= 22:
        blink_score = 5.0
        blink_reason = f"Blink rate in healthy range ({blink:.1f}/min)"
    elif blink < 10 or blink > 30:
        blink_score = -5.0
        blink_reason = f"Atypical blink rate ({blink:.1f}/min)"
    else:
        blink_score = 0.0
        blink_reason = f"Blink rate slightly outside ideal range ({blink:.1f}/min)"

    attributions.append({
        "feature": "blink_rate",
        "value": round(blink, 1),
        "shap_value": round(blink_score, 3),
        "abs_shap": abs(round(blink_score, 3)),
        "direction": "positive" if blink_score >= 0 else "negative",
        "reason": blink_reason,
    })

    # --- Facial muscle activity ---
    muscle = float(assessment.facial_muscle_activity or 50)
    if muscle > 70:
        muscle_score = 5.0
        muscle_reason = f"Active facial muscle engagement ({muscle:.1f})"
    else:
        muscle_score = 0.0
        muscle_reason = f"Facial muscle activity at {muscle:.1f}"

    attributions.append({
        "feature": "facial_muscle_activity",
        "value": round(muscle, 2),
        "shap_value": round(muscle_score, 3),
        "abs_shap": abs(round(muscle_score, 3)),
        "direction": "positive" if muscle_score >= 0 else "negative",
        "reason": muscle_reason,
    })

    # --- Eye movement ---
    eye_movement = float(assessment.eye_movement or 0)
    if eye_movement > 60:
        eye_score = 3.0
        eye_reason = f"Healthy eye movement activity ({eye_movement:.1f})"
    else:
        eye_score = 0.0
        eye_reason = f"Eye movement at {eye_movement:.1f}"

    attributions.append({
        "feature": "eye_movement",
        "value": round(eye_movement, 2),
        "shap_value": round(eye_score, 3),
        "abs_shap": abs(round(eye_score, 3)),
        "direction": "positive" if eye_score >= 0 else "negative",
        "reason": eye_reason,
    })

    attributions.sort(key=lambda x: x["abs_shap"], reverse=True)
    return attributions


def _extract_memory_attributions(assessment) -> list:
    """
    Rule-based attribution for the Memory module.
    """
    attributions = []

    # --- Recall accuracy ---
    accuracy = float(assessment.accuracy or 0)
    if accuracy >= 90:
        acc_score = 30.0
        acc_reason = f"Excellent recall accuracy ({accuracy:.1f}%)"
    elif accuracy >= 75:
        acc_score = 20.0
        acc_reason = f"Strong recall accuracy ({accuracy:.1f}%)"
    elif accuracy >= 50:
        acc_score = 10.0
        acc_reason = f"Moderate recall accuracy ({accuracy:.1f}%)"
    else:
        acc_score = 0.0
        acc_reason = f"Low recall accuracy ({accuracy:.1f}%)"

    attributions.append({
        "feature": "recall_accuracy",
        "value": round(accuracy, 1),
        "shap_value": round(acc_score, 3),
        "abs_shap": abs(round(acc_score, 3)),
        "direction": "positive" if acc_score >= 0 else "negative",
        "reason": acc_reason,
    })

    # --- Reaction time ---
    rt = float(assessment.avg_reaction_time or 0)
    if rt <= 0:
        rt_score = 0.0
        rt_reason = "No reaction time recorded"
    elif rt < 1000:
        rt_score = 15.0
        rt_reason = f"Fast cognitive response ({rt:.0f}ms)"
    elif rt < 2000:
        rt_score = 10.0
        rt_reason = f"Normal reaction time ({rt:.0f}ms)"
    elif rt < 3000:
        rt_score = 5.0
        rt_reason = f"Slightly slower response ({rt:.0f}ms)"
    else:
        rt_score = -5.0
        rt_reason = f"Delayed response time ({rt:.0f}ms)"

    attributions.append({
        "feature": "reaction_time",
        "value": round(rt, 0),
        "shap_value": round(rt_score, 3),
        "abs_shap": abs(round(rt_score, 3)),
        "direction": "positive" if rt_score >= 0 else "negative",
        "reason": rt_reason,
    })

    # --- Test difficulty bonus ---
    difficulty = (assessment.difficulty or 'medium').lower()
    if difficulty == 'hard':
        diff_score = 10.0
        diff_reason = "Completed hard difficulty test"
    elif difficulty == 'medium':
        diff_score = 5.0
        diff_reason = "Completed medium difficulty test"
    else:
        diff_score = 0.0
        diff_reason = "Completed easy difficulty test"

    attributions.append({
        "feature": "test_difficulty",
        "value": difficulty,
        "shap_value": round(diff_score, 3),
        "abs_shap": abs(round(diff_score, 3)),
        "direction": "positive" if diff_score >= 0 else "negative",
        "reason": diff_reason,
    })

    # --- Correct count contribution ---
    correct = int(assessment.correct_count or 0)
    total = int(assessment.total_count or 0)
    if total > 0:
        correct_ratio = correct / total
        if correct_ratio >= 0.9:
            correct_score = 20.0
        elif correct_ratio >= 0.75:
            correct_score = 15.0
        elif correct_ratio >= 0.5:
            correct_score = 8.0
        else:
            correct_score = 0.0
        correct_reason = f"Correctly recalled {correct}/{total} items"
    else:
        correct_score = 0.0
        correct_reason = "Item recall count not recorded"

    attributions.append({
        "feature": "correct_items",
        "value": correct,
        "shap_value": round(correct_score, 3),
        "abs_shap": abs(round(correct_score, 3)),
        "direction": "positive" if correct_score >= 0 else "negative",
        "reason": correct_reason,
    })

    # --- Memory level classification ---
    level = (assessment.memory_level or '').lower()
    if level in ('excellent', 'very good'):
        level_score = 15.0
        level_reason = f"Memory level classified as '{assessment.memory_level}'"
    elif level == 'good':
        level_score = 10.0
        level_reason = f"Memory level classified as '{assessment.memory_level}'"
    elif level == 'average':
        level_score = 5.0
        level_reason = f"Memory level classified as '{assessment.memory_level}'"
    else:
        level_score = 0.0
        level_reason = f"Memory level classified as '{assessment.memory_level or 'Unknown'}'"

    attributions.append({
        "feature": "memory_level",
        "value": level or 'unknown',
        "shap_value": round(level_score, 3),
        "abs_shap": abs(round(level_score, 3)),
        "direction": "positive" if level_score >= 0 else "negative",
        "reason": level_reason,
    })

    attributions.sort(key=lambda x: x["abs_shap"], reverse=True)
    return attributions


def _build_rule_based_explanation(module: str, attributions: list) -> dict:
    """
    Wrap rule-based attributions into the same response shape used
    by the SHAP explainer, so the frontend renders it identically.
    """
    top_positive = [a for a in attributions if a["shap_value"] > 0][:3]
    top_negative = [a for a in attributions if a["shap_value"] < 0][:3]
    total_pos = round(sum(a["shap_value"] for a in attributions if a["shap_value"] > 0), 3)
    total_neg = round(sum(a["shap_value"] for a in attributions if a["shap_value"] < 0), 3)

    return {
        "method": "RuleBasedAttribution",
        "module": module,
        "features": attributions,
        "top_positive": top_positive,
        "top_negative": top_negative,
        "total_positive": total_pos,
        "total_negative": total_neg,
        "note": (
            "Attributions are computed from the module's rule-based scoring "
            "formula. Each value represents the points contributed by that "
            "feature to the total score."
        ),
    }


# ============================================================
# TEST ENDPOINT
# ============================================================
@router.get("/test-debug")
async def test_debug():
    print("=" * 70)
    print("🔧 TEST DEBUG ENDPOINT CALLED")
    print(f"   Time: {datetime.now().isoformat()}")
    print("=" * 70)
    return {
        "status": "success",
        "message": "Test endpoint working!",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================
# BRAIN HEALTH ENDPOINT
# ============================================================
@router.get("/brain-health/{user_id}", response_model=None)
async def get_brain_health_score(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Single source of truth for Brain Health Score."""
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        result = _calculate_brain_health(db, user_id)

        print("=" * 70)
        print(f"🧠 BRAIN HEALTH ENDPOINT FOR USER {user_id}")
        print(f"  Score: {result['brain_health_score']}")
        print(f"  Baseline: {result['baseline_brain_health']}")
        print(f"  Modules: {result['modules']}")
        print(f"  Streak: {result['streak']} days")
        print("=" * 70)

        return {"status": "success", "data": result}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Brain health error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# DASHBOARD ENDPOINT
# ============================================================
@router.get("/dashboard/{user_id}", response_model=None)
async def get_dashboard_data(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get dashboard overview with consistent baseline & brain health"""
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        print("=" * 70)
        print(f"🔍 DASHBOARD ENDPOINT FOR USER: {user_id}")
        print("=" * 70)

        result = _calculate_brain_health(db, user_id)

        voice_count = db.query(VoiceAssessment).filter(VoiceAssessment.user_id == user_id).count()
        memory_count = db.query(MemoryAssessment).filter(MemoryAssessment.user_id == user_id).count()
        tremor_count = db.query(TremorAssessment).filter(TremorAssessment.user_id == user_id).count()
        typing_count = db.query(TypingAssessment).filter(TypingAssessment.user_id == user_id).count()
        face_count = db.query(FaceAssessment).filter(FaceAssessment.user_id == user_id).count()
        total_assessments = voice_count + memory_count + tremor_count + typing_count + face_count

        latest_date = None
        for model in [VoiceAssessment, MemoryAssessment, TremorAssessment, TypingAssessment, FaceAssessment]:
            last = db.query(model).filter(model.user_id == user_id).order_by(model.completed_at.desc()).first()
            if last and last.completed_at:
                if not latest_date or last.completed_at > latest_date:
                    latest_date = last.completed_at

        last_assessment = latest_date.isoformat() if latest_date else None

        response_data = {
            "brain_health_score": result["brain_health_score"],
            "baseline_brain_health": result["baseline_brain_health"],
            "previous_score": result["baseline_brain_health"],
            "change": result["change_percent"],
            "change_points": result["change_points"],
            "total_assessments": total_assessments,
            "streak": result["streak"],
            "highest_score": result["highest_score"],
            "lowest_score": result["lowest_score"],
            "last_assessment": last_assessment,
            "modules": result["modules"],
            "baseline": result["baseline"],
        }

        print("=" * 70)
        print("🚀 DASHBOARD RESPONSE:")
        print(f"  Brain Health: {response_data['brain_health_score']}")
        print(f"  Baseline: {response_data['baseline_brain_health']}")
        print(f"  Streak: {response_data['streak']} days")
        print(f"  Modules: {response_data['modules']}")
        print("=" * 70)

        return {"status": "success", "data": response_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# RECENT ASSESSMENTS
# ============================================================
@router.get("/assessments/{user_id}", response_model=None)
async def get_user_assessments(
    user_id: int,
    limit: int = 7,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get recent assessments"""
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        voice = db.query(VoiceAssessment).filter(VoiceAssessment.user_id == user_id).order_by(VoiceAssessment.completed_at.desc()).limit(limit).all()
        memory = db.query(MemoryAssessment).filter(MemoryAssessment.user_id == user_id).order_by(MemoryAssessment.completed_at.desc()).limit(limit).all()
        tremor = db.query(TremorAssessment).filter(TremorAssessment.user_id == user_id).order_by(TremorAssessment.completed_at.desc()).limit(limit).all()
        typing = db.query(TypingAssessment).filter(TypingAssessment.user_id == user_id).order_by(TypingAssessment.completed_at.desc()).limit(limit).all()
        face = db.query(FaceAssessment).filter(FaceAssessment.user_id == user_id).order_by(FaceAssessment.completed_at.desc()).limit(limit).all()

        all_assessments = []

        for a in voice:
            all_assessments.append({
                'id': f"voice-{a.id}", 'type': 'voice', 'module': 'Voice',
                'score': a.score or 0, 'accuracy': a.accuracy or 85,
                'completed_at': a.completed_at.isoformat() if a.completed_at else datetime.utcnow().isoformat(),
                'status': 'completed'
            })
        for a in memory:
            all_assessments.append({
                'id': f"memory-{a.id}", 'type': 'memory', 'module': 'Memory',
                'score': a.score or 0, 'accuracy': a.accuracy or 85,
                'completed_at': a.completed_at.isoformat() if a.completed_at else datetime.utcnow().isoformat(),
                'status': 'completed'
            })
        for a in tremor:
            all_assessments.append({
                'id': f"tremor-{a.id}", 'type': 'tremor', 'module': 'Tremor',
                'score': a.score or 0, 'accuracy': a.accuracy or 85,
                'completed_at': a.completed_at.isoformat() if a.completed_at else datetime.utcnow().isoformat(),
                'status': 'completed'
            })
        for a in typing:
            all_assessments.append({
                'id': f"typing-{a.id}", 'type': 'typing', 'module': 'Typing',
                'score': a.score or 0, 'accuracy': a.accuracy or 85,
                'completed_at': a.completed_at.isoformat() if a.completed_at else datetime.utcnow().isoformat(),
                'status': 'completed'
            })
        for a in face:
            all_assessments.append({
                'id': f"face-{a.id}", 'type': 'face', 'module': 'Face',
                'score': a.score or 0, 'accuracy': a.accuracy or 85,
                'completed_at': a.completed_at.isoformat() if a.completed_at else datetime.utcnow().isoformat(),
                'status': 'completed'
            })

        all_assessments.sort(key=lambda x: x['completed_at'], reverse=True)
        all_assessments = all_assessments[:limit]

        return {"status": "success", "assessments": all_assessments, "count": len(all_assessments)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# SMART ADAPTIVE TIMELINE
# ============================================================
@router.get("/data/{user_id}", response_model=None)
async def get_timeline_data(
    user_id: int,
    period: str = "weekly",
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Smart Adaptive Timeline.
    GRAPH: per-period AVERAGES for ALL points (including last).
    CARDS: uses latest_module_scores from this response.
    """
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        # ===== GET ALL ASSESSMENTS =====
        voice = db.query(VoiceAssessment).filter(VoiceAssessment.user_id == user_id).all()
        memory = db.query(MemoryAssessment).filter(MemoryAssessment.user_id == user_id).all()
        tremor = db.query(TremorAssessment).filter(TremorAssessment.user_id == user_id).all()
        typing = db.query(TypingAssessment).filter(TypingAssessment.user_id == user_id).all()
        face = db.query(FaceAssessment).filter(FaceAssessment.user_id == user_id).all()

        all_assessments = []

        for a in voice:
            if a.completed_at:
                all_assessments.append({'completed_at': a.completed_at, 'type': 'voice', 'score': a.score or 0})
        for a in memory:
            if a.completed_at:
                all_assessments.append({'completed_at': a.completed_at, 'type': 'memory', 'score': a.score or 0})
        for a in tremor:
            if a.completed_at:
                all_assessments.append({'completed_at': a.completed_at, 'type': 'tremor', 'score': a.score or 0})
        for a in typing:
            if a.completed_at:
                all_assessments.append({'completed_at': a.completed_at, 'type': 'typing', 'score': a.score or 0})
        for a in face:
            if a.completed_at:
                all_assessments.append({'completed_at': a.completed_at, 'type': 'face', 'score': a.score or 0})

        all_assessments.sort(key=lambda x: x['completed_at'])

        # ===== CONSISTENT BRAIN HEALTH =====
        brain_health_result = _calculate_brain_health(db, user_id)

        # ===== EMPTY DATA =====
        if not all_assessments:
            return {
                "status": "success",
                "data": {
                    "labels": [], "scores": [], "voice_scores": [], "memory_scores": [],
                    "tremor_scores": [], "typing_scores": [], "face_scores": [], "dates": [],
                    "total_assessments": 0, "average_score": 0, "highest_score": 0,
                    "lowest_score": 0, "current_score": 0, "previous_score": 0,
                    "voice_baseline": 0, "memory_baseline": 0, "tremor_baseline": 0,
                    "typing_baseline": 0, "face_baseline": 0,
                    "mode_used": "NO_DATA",
                    "current_brain_health": brain_health_result["brain_health_score"],
                    "baseline_brain_health": brain_health_result["baseline_brain_health"],
                    "change_percent": brain_health_result["change_percent"],
                    "change_points": brain_health_result["change_points"],
                    "latest_module_scores": brain_health_result["modules"],
                    "baseline": brain_health_result["baseline"],
                }
            }

        # ===== KEY REFERENCE DATES =====
        latest_date = all_assessments[-1]['completed_at']
        earliest_date = all_assessments[0]['completed_at']
        now = datetime.utcnow()

        days_since_latest = (now - latest_date).days
        data_span_days = (latest_date - earliest_date).days
        data_span_years = data_span_days / 365

        unique_dates = sorted(set(a['completed_at'].date() for a in all_assessments))

        print("=" * 70)
        print(f"📅 Period: {period}")
        print(f"📅 Latest: {latest_date} | Days since: {days_since_latest}")
        print(f"📅 Data span: {data_span_days} days")
        print(f"📅 Unique dates: {len(unique_dates)} | Total: {len(all_assessments)}")
        print(f"🧠 Brain Health: {brain_health_result['brain_health_score']}")
        print("=" * 70)

        grouped = OrderedDict()
        mode_used = ""

        # ============================================================
        # WEEKLY
        # ============================================================
        if period == "weekly":
            if data_span_days <= 30:
                # ---------- DAY-WISE (recent) ----------
                mode_used = "DAY-WISE (recent)"
                last_7 = unique_dates[-7:] if len(unique_dates) >= 7 else unique_dates

                for d in last_7:
                    day_key = d.strftime("%b %d")
                    grouped[day_key] = {
                        'voice': [], 'memory': [], 'tremor': [], 'typing': [], 'face': [],
                        'all': [], 'sort_key': datetime.combine(d, datetime.min.time()),
                        'date': d
                    }

                for a in all_assessments:
                    if a['completed_at'].date() in last_7:
                        day_key = a['completed_at'].strftime("%b %d")
                        if day_key in grouped:
                            grouped[day_key][a['type']].append(a['score'])
                            grouped[day_key]['all'].append(a['score'])
            else:
                # ---------- WEEK-WISE (older data) ----------
                mode_used = "WEEK-WISE (older data)"

                total_weeks = max(1, (data_span_days // 7) + 1)
                num_weeks = min(total_weeks, 4)

                week_specs = []
                for i in range(num_weeks):
                    weeks_from_latest = num_weeks - 1 - i
                    end_offset = 7 * weeks_from_latest
                    start_offset = end_offset + 7

                    week_specs.append({
                        'label': f"W{i + 1}",
                        'start': latest_date - timedelta(days=start_offset),
                        'end': latest_date - timedelta(days=end_offset),
                        'sort_key': i + 1,
                    })

                for wk in week_specs:
                    grouped[wk['label']] = {
                        'voice': [], 'memory': [], 'tremor': [], 'typing': [], 'face': [],
                        'all': [], 'sort_key': wk['sort_key'],
                        'date': None,
                    }

                for a in all_assessments:
                    a_date = a['completed_at']
                    for wk in week_specs:
                        if wk['start'] < a_date <= wk['end']:
                            grouped[wk['label']][a['type']].append(a['score'])
                            grouped[wk['label']]['all'].append(a['score'])
                            break

        # ============================================================
        # MONTHLY - ONLY MONTHS WITH DATA
        # ============================================================
        elif period == "monthly":
            target_year = latest_date.year
            year_start = datetime(target_year, 1, 1)
            year_end = datetime(target_year + 1, 1, 1)
            filtered = [a for a in all_assessments if year_start <= a['completed_at'] < year_end]

            if not filtered:
                target_year = earliest_date.year
                year_start = datetime(target_year, 1, 1)
                year_end = datetime(target_year + 1, 1, 1)
                filtered = [a for a in all_assessments if year_start <= a['completed_at'] < year_end]

            mode_used = f"MONTH-WISE ({target_year})"

            for a in filtered:
                month_label = a['completed_at'].strftime("%b")
                if month_label not in grouped:
                    grouped[month_label] = {
                        'voice': [], 'memory': [], 'tremor': [], 'typing': [], 'face': [],
                        'all': [], 'sort_key': a['completed_at'].month,
                        'date': None
                    }
                grouped[month_label][a['type']].append(a['score'])
                grouped[month_label]['all'].append(a['score'])

        # ============================================================
        # YEARLY
        # ============================================================
        else:
            if data_span_years >= 1.5:
                mode_used = "YEAR-WISE"
                for a in all_assessments:
                    year_key = a['completed_at'].strftime("%Y")
                    if year_key not in grouped:
                        grouped[year_key] = {
                            'voice': [], 'memory': [], 'tremor': [], 'typing': [], 'face': [],
                            'all': [], 'sort_key': int(year_key),
                            'date': None
                        }
                    grouped[year_key][a['type']].append(a['score'])
                    grouped[year_key]['all'].append(a['score'])
            else:
                target_year = latest_date.year
                year_start = datetime(target_year, 1, 1)
                year_end = datetime(target_year + 1, 1, 1)
                filtered = [a for a in all_assessments if year_start <= a['completed_at'] < year_end]

                mode_used = f"MONTH-WISE ({target_year})"

                for a in filtered:
                    month_label = a['completed_at'].strftime("%b")
                    if month_label not in grouped:
                        grouped[month_label] = {
                            'voice': [], 'memory': [], 'tremor': [], 'typing': [], 'face': [],
                            'all': [], 'sort_key': a['completed_at'].month,
                            'date': None
                        }
                    grouped[month_label][a['type']].append(a['score'])
                    grouped[month_label]['all'].append(a['score'])

        # ===== BUILD CHART DATA =====
        labels = []
        scores = []
        voice_scores = []
        memory_scores = []
        tremor_scores = []
        typing_scores = []
        face_scores = []
        dates = []

        def avg(lst):
            return round(sum(lst) / len(lst), 1) if lst else 0

        sorted_groups = sorted(grouped.items(), key=lambda x: x[1]['sort_key'])

        for label, data in sorted_groups:
            labels.append(label)
            voice_scores.append(avg(data['voice']))
            memory_scores.append(avg(data['memory']))
            tremor_scores.append(avg(data['tremor']))
            typing_scores.append(avg(data['typing']))
            face_scores.append(avg(data['face']))
            scores.append(avg(data['all']))
            dates.append(str(data['sort_key']))

        # ===== BASELINES =====
        all_voice_scores = [a['score'] for a in all_assessments if a['type'] == 'voice' and a['score'] > 0]
        all_memory_scores = [a['score'] for a in all_assessments if a['type'] == 'memory' and a['score'] > 0]
        all_tremor_scores = [a['score'] for a in all_assessments if a['type'] == 'tremor' and a['score'] > 0]
        all_typing_scores = [a['score'] for a in all_assessments if a['type'] == 'typing' and a['score'] > 0]
        all_face_scores = [a['score'] for a in all_assessments if a['type'] == 'face' and a['score'] > 0]

        def calc_baseline(scores_list):
            return round(sum(scores_list) / len(scores_list), 1) if scores_list else 0

        valid_scores = [s for s in scores if s > 0]

        print("=" * 70)
        print(f"📊 MODE: {mode_used}")
        print(f"📊 Labels ({len(labels)}): {labels}")
        print(f"📊 Voice (period avg): {voice_scores}")
        print(f"📊 Memory (period avg): {memory_scores}")
        print(f"📊 Tremor (period avg): {tremor_scores}")
        print(f"📊 Typing (period avg): {typing_scores}")
        print(f"📊 Face (period avg): {face_scores}")
        print(f"📊 Latest module scores (for cards): {brain_health_result['modules']}")
        print("=" * 70)

        return {
            "status": "success",
            "data": {
                "labels": labels,
                "scores": scores,
                "voice_scores": voice_scores,
                "memory_scores": memory_scores,
                "tremor_scores": tremor_scores,
                "typing_scores": typing_scores,
                "face_scores": face_scores,
                "dates": dates,
                "total_assessments": len(all_assessments),
                "average_score": round(sum(valid_scores) / len(valid_scores), 1) if valid_scores else 0,
                "highest_score": max(valid_scores) if valid_scores else 0,
                "lowest_score": min(valid_scores) if valid_scores else 0,
                "current_score": scores[-1] if scores else 0,
                "previous_score": scores[-2] if len(scores) > 1 else 0,
                "voice_baseline": calc_baseline(all_voice_scores),
                "memory_baseline": calc_baseline(all_memory_scores),
                "tremor_baseline": calc_baseline(all_tremor_scores),
                "typing_baseline": calc_baseline(all_typing_scores),
                "face_baseline": calc_baseline(all_face_scores),
                "mode_used": mode_used,
                "current_brain_health": brain_health_result["brain_health_score"],
                "baseline_brain_health": brain_health_result["baseline_brain_health"],
                "change_percent": brain_health_result["change_percent"],
                "change_points": brain_health_result["change_points"],
                "latest_module_scores": brain_health_result["modules"],
                "baseline": brain_health_result["baseline"],
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Timeline error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# STATUS ENDPOINT
# ============================================================
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

        voice_count = db.query(VoiceAssessment).filter(VoiceAssessment.user_id == user_id).count()
        memory_count = db.query(MemoryAssessment).filter(MemoryAssessment.user_id == user_id).count()
        tremor_count = db.query(TremorAssessment).filter(TremorAssessment.user_id == user_id).count()
        typing_count = db.query(TypingAssessment).filter(TypingAssessment.user_id == user_id).count()
        face_count = db.query(FaceAssessment).filter(FaceAssessment.user_id == user_id).count()

        total = voice_count + memory_count + tremor_count + typing_count + face_count
        has_assessments = total > 0

        return {
            "status": "success",
            "data": {
                "has_assessments": has_assessments,
                "assessment_count": total,
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
        print(f"Status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# SHAP / XAI EXPLAINABLE AI ENDPOINT
# ============================================================
@router.get("/shap-explain/{user_id}/{module}", response_model=None)
async def get_shap_explanation(
    user_id: int,
    module: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Get an explanation for the user's latest {module} assessment.

    SHAP-supported (backend computes SHAP): voice | tremor | typing
    Rule-based (backend applies scoring formula): memory | face
    """
    try:
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        module = module.lower()
        valid_modules = ["voice", "tremor", "typing", "memory", "face"]
        if module not in valid_modules:
            raise HTTPException(status_code=400, detail="Invalid module")

        # ===== Load latest assessment =====
        model_map = {
            "voice": VoiceAssessment,
            "tremor": TremorAssessment,
            "memory": MemoryAssessment,
            "typing": TypingAssessment,
            "face": FaceAssessment,
        }
        ModelClass = model_map[module]

        latest = (
            db.query(ModelClass)
            .filter(ModelClass.user_id == user_id)
            .order_by(ModelClass.completed_at.desc())
            .first()
        )

        if not latest:
            return {
                "status": "success",
                "module": module,
                "explanation": {
                    "method": "no_data",
                    "features": [],
                    "reason": "No assessment found",
                },
            }

        # ===== RULE-BASED BRANCHES (Face & Memory) =====
        if module == "face":
            attributions = _extract_face_attributions(latest)
            explanation = _build_rule_based_explanation("face", attributions)
            return {
                "status": "success",
                "module": module,
                "assessment_id": latest.id,
                "assessment_date": latest.completed_at.isoformat() if latest.completed_at else None,
                "explanation": explanation,
            }

        if module == "memory":
            attributions = _extract_memory_attributions(latest)
            explanation = _build_rule_based_explanation("memory", attributions)
            return {
                "status": "success",
                "module": module,
                "assessment_id": latest.id,
                "assessment_date": latest.completed_at.isoformat() if latest.completed_at else None,
                "explanation": explanation,
            }

        # ===== SHAP BRANCHES (Voice, Tremor, Typing) =====
        X_input = _extract_features(latest, module)
        if not X_input:
            return {
                "status": "success",
                "module": module,
                "explanation": {"method": "no_features", "features": []},
            }

        X_input = np.array(X_input, dtype=np.float32).reshape(1, -1)

        logger.info(f"🔍 SHAP {module}: input shape = {X_input.shape}")

        shap_service = get_shap_service()
        explanation = shap_service.explain(module, X_input)

        return {
            "status": "success",
            "module": module,
            "assessment_id": latest.id,
            "assessment_date": latest.completed_at.isoformat() if latest.completed_at else None,
            "explanation": explanation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Explain error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# FEATURE EXTRACTION (ORDER MUST MATCH MODEL TRAINING)
# ============================================================
def _extract_features(assessment, module: str):
    """
    Extract numeric feature vector from DB record.
    ORDER MUST MATCH training features.

    Note: face & memory are handled by rule-based attribution
    and do NOT go through this function anymore.
    """

    if module == "voice":
        return [
            float(getattr(assessment, "pitch_mean", 0) or getattr(assessment, "pitch", 0) or 0),
            float(getattr(assessment, "pitch_std", 0) or 0),
            float(getattr(assessment, "pitch_min", 0) or 0),
            float(getattr(assessment, "pitch_max", 0) or 0),
            float(getattr(assessment, "jitter", 0) or 0),
            float(getattr(assessment, "shimmer", 0) or 0),
            float(getattr(assessment, "hnr", 0) or 0),
            float(getattr(assessment, "voice_tremor", 0) or 0),
            float(getattr(assessment, "speech_rate", 0) or 0),
            float(getattr(assessment, "rms_mean", 0) or 0),
            float(getattr(assessment, "rms_std", 0) or 0),
            float(getattr(assessment, "spectral_centroid_mean", 0) or 0),
            float(getattr(assessment, "spectral_centroid_std", 0) or 0),
            float(getattr(assessment, "mfcc_1_mean", 0) or 0),
            float(getattr(assessment, "mfcc_1_std", 0) or 0),
            float(getattr(assessment, "mfcc_2_mean", 0) or 0),
            float(getattr(assessment, "mfcc_2_std", 0) or 0),
            float(getattr(assessment, "mfcc_3_mean", 0) or 0),
            float(getattr(assessment, "mfcc_3_std", 0) or 0),
            float(getattr(assessment, "mfcc_4_mean", 0) or 0),
            float(getattr(assessment, "mfcc_4_std", 0) or 0),
        ]

    if module == "tremor":
        return [
            float(getattr(assessment, "tremor_frequency", 0) or 0),
            float(getattr(assessment, "tremor_amplitude", 0) or 0),
            float(getattr(assessment, "hand_stability", 0) or 0),
            float(getattr(assessment, "jerk", 0) or 0),
            float(getattr(assessment, "variance", 0) or 0),
            float(getattr(assessment, "range_movement", 0) or 0),
            float(getattr(assessment, "wrist_stability", 0) or 0),
            float(getattr(assessment, "wrist_movement", 0) or 0),
        ]

    if module == "typing":
        return [
            float(getattr(assessment, "hold_time_mean", 0) or 0),
            float(getattr(assessment, "hold_time_std", 0) or 0),
            float(getattr(assessment, "hold_time_min", 0) or 0),
            float(getattr(assessment, "hold_time_max", 0) or 0),
            float(getattr(assessment, "latency_mean", 0) or 0),
            float(getattr(assessment, "latency_std", 0) or 0),
            float(getattr(assessment, "latency_min", 0) or 0),
            float(getattr(assessment, "latency_max", 0) or 0),
            float(getattr(assessment, "flight_time_mean", 0) or 0),
            float(getattr(assessment, "flight_time_std", 0) or 0),
            float(getattr(assessment, "flight_time_min", 0) or 0),
            float(getattr(assessment, "flight_time_max", 0) or 0),
            float(getattr(assessment, "wpm", 0) or 0),
            float(getattr(assessment, "key_press_variance", 0) or 0),
            float(getattr(assessment, "rhythm_variance", 0) or 0),
            float(getattr(assessment, "backspace_frequency", 0) or 0),
            float(getattr(assessment, "error_rate", 0) or 0),
            float(getattr(assessment, "consistency_score", 0) or 0),
        ]

    # Face & Memory are now handled by rule-based attribution — no SHAP features needed.
    return []
