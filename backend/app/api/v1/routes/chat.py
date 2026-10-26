# backend/app/api/v1/routes/chat.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import numpy as np

from app.database import get_db
from app.models.chat import ChatRequest, ChatResponse
from app.models.user import User
from app.models.assessment import Assessment
from app.models.voice import VoiceAssessment
from app.models.tremor import TremorAssessment
from app.models.memory import MemoryAssessment
from app.models.typing import TypingAssessment
from app.models.face import FaceAssessment
from app.services.ai_service import AIService
from app.services.auth_service import get_current_user_id

# ===== NEW: XAI imports for SHAP / rule-based explanations =====
from app.services.shap_service import get_shap_service
from app.api.v1.routes.timeline import (
    _extract_face_attributions,
    _extract_memory_attributions,
    _build_rule_based_explanation,
    _extract_features,
)

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat"])

# Singleton AI service
ai_service = AIService()


# ============================================================
# MODULE EXPLANATIONS (static knowledge for AI)
# ============================================================
MODULE_EXPLANATIONS = {
    "voice": {
        "name": "Voice Analysis",
        "measures": "vocal pitch, jitter, shimmer, harmonic-to-noise ratio, and speech rate",
        "what_it_means": "Voice patterns can reflect neurological stability. Jitter and shimmer measure vocal fold stability.",
        "high_score": "Stable, clear voice with consistent pitch",
        "low_score": "Possible vocal tremor, instability, or hoarseness",
        "healthy_range": "60-100 (scores below 40 warrant attention)",
    },
    "memory": {
        "name": "Memory Recall",
        "measures": "short-term recall, sequence accuracy, and reaction time",
        "what_it_means": "Memory tests track cognitive function and early signs of cognitive decline.",
        "high_score": "Sharp recall and fast processing",
        "low_score": "Possible cognitive fatigue or attention issues",
        "healthy_range": "60-100",
    },
    "tremor": {
        "name": "Hand Tremor",
        "measures": "tremor frequency, amplitude, and hand stability",
        "what_it_means": "Tremor analysis detects fine motor control, useful in Parkinson's screening.",
        "high_score": "Stable hand control, minimal oscillation",
        "low_score": "Possible resting or action tremor",
        "healthy_range": "70-100",
    },
    "typing": {
        "name": "Typing Pattern",
        "measures": "typing speed, accuracy, keystroke latency, and rhythm consistency",
        "what_it_means": "Typing rhythm reflects motor coordination and cognitive-motor coupling.",
        "high_score": "Consistent rhythm and speed",
        "low_score": "Irregular typing rhythm, possible motor fatigue",
        "healthy_range": "60-100",
    },
    "face": {
        "name": "Facial Expression",
        "measures": "smile intensity, facial symmetry, blink rate, and micro-expressions",
        "what_it_means": "Facial symmetry and expression are markers of neurological health.",
        "high_score": "Symmetrical, expressive face",
        "low_score": "Reduced expression or asymmetry",
        "healthy_range": "70-100",
    },
}


# ============================================================
# HELPERS: Build rich context for the AI
# ============================================================
def _avg(scores: List[float]) -> float:
    """Safe average of a list of scores"""
    valid = [s for s in scores if s and s > 0]
    return round(sum(valid) / len(valid), 1) if valid else 0.0


def _trend_label(scores: List[float]) -> str:
    """Describe the trend direction"""
    valid = [s for s in scores if s and s > 0]
    if len(valid) < 2:
        return "insufficient data"

    first_half = valid[: len(valid) // 2]
    second_half = valid[len(valid) // 2 :]
    first_avg = sum(first_half) / len(first_half)
    second_avg = sum(second_half) / len(second_half)

    diff_pct = ((second_avg - first_avg) / first_avg * 100) if first_avg else 0

    if diff_pct > 5:
        return f"improving (+{diff_pct:.1f}%)"
    elif diff_pct < -5:
        return f"declining ({diff_pct:.1f}%)"
    else:
        return "stable"


# ===== NEW: Build SHAP / rule-based explanations per module =====
def _build_xai_explanations(user_id: int, db: Session) -> Dict[str, Any]:
    """
    Fetch SHAP / rule-based explanations for each module.
    This is what enables the AI to answer 'why' questions with real feature attributions.
    """
    explanations: Dict[str, Any] = {}

    model_map = {
        "voice": VoiceAssessment,
        "tremor": TremorAssessment,
        "memory": MemoryAssessment,
        "typing": TypingAssessment,
        "face": FaceAssessment,
    }

    for module, ModelClass in model_map.items():
        try:
            latest = (
                db.query(ModelClass)
                .filter(ModelClass.user_id == user_id)
                .order_by(ModelClass.completed_at.desc())
                .first()
            )
            if not latest:
                continue

            # Rule-based modules (face, memory)
            if module == "face":
                attr = _extract_face_attributions(latest)
                expl = _build_rule_based_explanation("face", attr)
            elif module == "memory":
                attr = _extract_memory_attributions(latest)
                expl = _build_rule_based_explanation("memory", attr)
            else:
                # SHAP modules (voice, tremor, typing)
                X_input = _extract_features(latest, module)
                if not X_input:
                    continue
                X_arr = np.array(X_input, dtype=np.float32).reshape(1, -1)
                shap_service = get_shap_service()
                expl = shap_service.explain(module, X_arr)

            top_pos = expl.get("top_positive", [])[:3]
            top_neg = expl.get("top_negative", [])[:3]

            if not top_pos and not top_neg:
                continue

            explanations[module] = {
                "method": expl.get("method", "unknown"),
                "top_positive": [
                    {
                        "feature": f["feature"],
                        "value": f.get("value"),
                        "contribution": round(f["shap_value"], 4),
                        "reason": f.get("reason", ""),
                    }
                    for f in top_pos
                ],
                "top_negative": [
                    {
                        "feature": f["feature"],
                        "value": f.get("value"),
                        "contribution": round(f["shap_value"], 4),
                        "reason": f.get("reason", ""),
                    }
                    for f in top_neg
                ],
            }
        except Exception as e:
            logger.warning(f"XAI build failed for {module}: {e}")
            continue

    return explanations


def _build_rich_context(user_id: int, db: Session) -> Dict[str, Any]:
    """Build a comprehensive context object for the AI"""
    context: Dict[str, Any] = {}

    # ===== 1. USER INFO =====
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        context["user"] = {
            "name": user.name,
            "age": user.age,
            "gender": user.gender,
        }

    # ===== 2. FETCH ALL ASSESSMENTS =====
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Get all assessments sorted by date
    all_assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == user_id)
        .order_by(Assessment.completed_at.asc())
        .all()
    )

    total_count = len(all_assessments)
    context["total_assessments"] = total_count

    if total_count == 0:
        context["has_data"] = False
        return context

    context["has_data"] = True

    # ===== 3. LATEST SCORES =====
    latest = all_assessments[-1]
    previous = all_assessments[-2] if total_count > 1 else None

    context["latest_assessment"] = {
        "date": latest.completed_at.isoformat() if latest.completed_at else None,
        "days_ago": (now - latest.completed_at).days if latest.completed_at else 0,
        "brain_health_score": round(latest.brain_health_score or 0, 1),
        "modules": {
            "voice": round(latest.voice_score or 0, 1),
            "memory": round(latest.memory_score or 0, 1),
            "tremor": round(latest.tremor_score or 0, 1),
            "typing": round(latest.typing_score or 0, 1),
            "face": round(latest.face_score or 0, 1),
        },
    }

    # ===== 4. PREVIOUS ASSESSMENT (for change detection) =====
    if previous:
        context["previous_assessment"] = {
            "date": previous.completed_at.isoformat() if previous.completed_at else None,
            "brain_health_score": round(previous.brain_health_score or 0, 1),
            "change_from_previous": round(
                (latest.brain_health_score or 0) - (previous.brain_health_score or 0), 1
            ),
        }

    # ===== 5. MODULE TRENDS (across all assessments) =====
    module_keys = ["voice", "memory", "tremor", "typing", "face"]
    module_trends: Dict[str, Any] = {}

    for key in module_keys:
        field = f"{key}_score"
        all_scores = [
            getattr(a, field, 0) or 0 for a in all_assessments if getattr(a, field, 0)
        ]
        # Last 7 assessments for local trend
        recent_scores = all_scores[-7:]

        # Latest vs baseline
        baseline = _avg(all_scores)
        latest_val = all_scores[-1] if all_scores else 0

        module_trends[key] = {
            "latest": round(latest_val, 1),
            "baseline": baseline,
            "delta_from_baseline": round(latest_val - baseline, 1),
            "delta_pct_from_baseline": (
                round(((latest_val - baseline) / baseline) * 100, 1)
                if baseline
                else 0
            ),
            "trend_direction": _trend_label(all_scores),
            "recent_avg": _avg(recent_scores),
            "all_time_avg": baseline,
            "highest": round(max(all_scores), 1) if all_scores else 0,
            "lowest": round(min(all_scores), 1) if all_scores else 0,
            "data_points": len(all_scores),
        }

    context["module_trends"] = module_trends

    # ===== 6. WEEKLY COMPARISON (this week vs last week) =====
    this_week = [a for a in all_assessments if a.completed_at and a.completed_at >= week_ago]
    last_week_start = week_ago - timedelta(days=7)
    last_week = [
        a
        for a in all_assessments
        if a.completed_at
        and last_week_start <= a.completed_at < week_ago
    ]

    context["weekly_comparison"] = {
        "this_week_count": len(this_week),
        "this_week_avg": _avg([a.brain_health_score or 0 for a in this_week]),
        "last_week_count": len(last_week),
        "last_week_avg": _avg([a.brain_health_score or 0 for a in last_week]),
        "change": round(
            _avg([a.brain_health_score or 0 for a in this_week])
            - _avg([a.brain_health_score or 0 for a in last_week]),
            1,
        ),
    }

    # ===== 7. MONTHLY COMPARISON (this month vs last month) =====
    this_month = [a for a in all_assessments if a.completed_at and a.completed_at >= month_ago]
    last_month_start = month_ago - timedelta(days=30)
    last_month = [
        a
        for a in all_assessments
        if a.completed_at
        and last_month_start <= a.completed_at < month_ago
    ]

    context["monthly_comparison"] = {
        "this_month_count": len(this_month),
        "this_month_avg": _avg([a.brain_health_score or 0 for a in this_month]),
        "last_month_count": len(last_month),
        "last_month_avg": _avg([a.brain_health_score or 0 for a in last_month]),
        "change": round(
            _avg([a.brain_health_score or 0 for a in this_month])
            - _avg([a.brain_health_score or 0 for a in last_month]),
            1,
        ),
    }

    # ===== 8. MODULE EXPLANATIONS (static knowledge) =====
    context["module_explanations"] = MODULE_EXPLANATIONS

    # ===== 9. OVERALL HEALTH STATUS =====
    overall_score = latest.brain_health_score or 0
    if overall_score >= 80:
        status = "optimal"
        status_desc = "Excellent cognitive and motor health"
    elif overall_score >= 70:
        status = "good"
        status_desc = "Above average — continue monitoring"
    elif overall_score >= 60:
        status = "moderate"
        status_desc = "Within range but watch for changes"
    elif overall_score >= 40:
        status = "attention"
        status_desc = "Some modules show below-average readings"
    else:
        status = "low"
        status_desc = "Multiple modules show low scores — clinical review recommended"

    context["overall_status"] = {
        "score": round(overall_score, 1),
        "level": status,
        "description": status_desc,
    }

    # ===== 10. STREAK (consecutive assessment days) =====
    unique_dates = sorted(
        set(a.completed_at.date() for a in all_assessments if a.completed_at),
        reverse=True,
    )
    streak = 0
    check_date = now.date()
    for d in unique_dates:
        if d == check_date or d == check_date - timedelta(days=1):
            streak += 1
            check_date = d
        else:
            break

    context["streak_days"] = streak

    # ===== 11. NEW: XAI EXPLANATIONS (SHAP + rule-based) =====
    context["xai_explanations"] = _build_xai_explanations(user_id, db)

    return context


# ============================================================
# ROUTES
# ============================================================
@router.get("/health")
async def chat_health():
    """Health check for the AI chat service"""
    return {
        "status": "healthy",
        "gemini_ready": ai_service.is_ready,
        "model": getattr(ai_service, "model_name", "unknown"),
    }


@router.get("/context/{user_id}")
async def get_chat_context(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    🆕 DEBUG endpoint: returns exactly what context is being sent to the AI.
    Useful for testing / verifying the rich context.
    """
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Permission denied")

    context = _build_rich_context(user_id, db)
    return {"status": "success", "context": context}


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
):
    """
    Send a message to the AI assistant.
    Automatically includes rich context: trends, comparisons, module explanations.
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        language = (request.language or "en").lower()

        # Build rich context
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        rich_context = _build_rich_context(current_user_id, db)

        logger.info(
            f"📊 Rich context built for user {current_user_id}: "
            f"{rich_context.get('total_assessments', 0)} assessments, "
            f"overall={rich_context.get('overall_status', {}).get('level', 'n/a')}, "
            f"xai_modules={list(rich_context.get('xai_explanations', {}).keys())}"
        )

        # Get AI response
        result = await ai_service.get_ai_response(
            message=request.message,
            context=rich_context,
            user=user,
            language=language,
        )

        return ChatResponse(
            text=result["text"],
            suggestions=result.get("suggestions", []),
            source=result.get("source", "gemini"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        return ChatResponse(
            text="I'm having a small technical issue. Please try again in a moment.",
            suggestions=[],
            source="error",
        )


@router.post("/clear-history")
async def clear_history(
    current_user_id: int = Depends(get_current_user_id),
):
    """Clear the AI's conversation memory"""
    try:
        ai_service.clear_history()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        logger.error(f"Clear history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))