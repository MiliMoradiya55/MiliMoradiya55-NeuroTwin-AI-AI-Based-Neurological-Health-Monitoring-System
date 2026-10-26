# backend/app/services/assessment_aggregator.py

from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.assessment import Assessment
from app.models.twin import DigitalTwin
from app.models.voice import VoiceAssessment
from app.models.tremor import TremorAssessment
from app.models.memory import MemoryAssessment
from app.models.typing import TypingAssessment
from app.models.face import FaceAssessment


def _today_start() -> datetime:
    """
    Return today's 00:00 UTC.
    (Change to IST version below if needed.)
    """
    now = datetime.utcnow()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def create_combined_assessment(
    db: Session,
    user_id: int,
    module_name: str = None,
    module_score: float = 0,
):
    """
    UPSERT combined assessment for today.
    - If a combined row exists for today → update its module scores.
    - Otherwise → create a new row.
    Always recomputes brain_health_score from valid module scores.
    """
    try:
        print(f"🔄 Upserting combined assessment for user {user_id} (module={module_name})")

        # ---------- Twin ----------
        twin = db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
        if not twin:
            twin = DigitalTwin(
                user_id=user_id,
                name=f"Twin_{user_id}",
                is_active=True,
                baseline_created_at=datetime.utcnow(),
            )
            db.add(twin)
            db.commit()
            db.refresh(twin)

        # ---------- Latest module scores ----------
        latest_voice = (
            db.query(VoiceAssessment)
            .filter(VoiceAssessment.user_id == user_id)
            .order_by(VoiceAssessment.completed_at.desc())
            .first()
        )
        latest_memory = (
            db.query(MemoryAssessment)
            .filter(MemoryAssessment.user_id == user_id)
            .order_by(MemoryAssessment.completed_at.desc())
            .first()
        )
        latest_tremor = (
            db.query(TremorAssessment)
            .filter(TremorAssessment.user_id == user_id)
            .order_by(TremorAssessment.completed_at.desc())
            .first()
        )
        latest_typing = (
            db.query(TypingAssessment)
            .filter(TypingAssessment.user_id == user_id)
            .order_by(TypingAssessment.completed_at.desc())
            .first()
        )
        latest_face = (
            db.query(FaceAssessment)
            .filter(FaceAssessment.user_id == user_id)
            .order_by(FaceAssessment.completed_at.desc())
            .first()
        )

        voice_score = latest_voice.score if latest_voice else 0
        memory_score = latest_memory.score if latest_memory else 0
        tremor_score = latest_tremor.score if latest_tremor else 0
        typing_score = latest_typing.score if latest_typing else 0
        face_score = latest_face.score if latest_face else 0

        scores = [voice_score, memory_score, tremor_score, typing_score, face_score]
        valid_scores = [s for s in scores if s and s > 0]

        if not valid_scores:
            print("⚠️ No valid scores yet, skipping")
            return None

        brain_health_score = round(sum(valid_scores) / len(valid_scores), 1)

        # ---------- UPSERT ----------
        today = _today_start()

        assessment = (
            db.query(Assessment)
            .filter(
                Assessment.user_id == user_id,
                Assessment.completed_at >= today,
            )
            .order_by(Assessment.completed_at.desc())
            .first()
        )

        if assessment:
            # ---------- UPDATE ----------
            print(f"📝 Updating existing combined row ID {assessment.id}")

            prev_assessment = (
                db.query(Assessment)
                .filter(
                    Assessment.user_id == user_id,
                    Assessment.completed_at < today,
                )
                .order_by(Assessment.completed_at.desc())
                .first()
            )
            previous_score = prev_assessment.brain_health_score if prev_assessment else 0

            assessment.voice_score = voice_score
            assessment.memory_score = memory_score
            assessment.tremor_score = tremor_score
            assessment.typing_score = typing_score
            assessment.face_score = face_score
            assessment.brain_health_score = brain_health_score
            assessment.previous_score = previous_score
            assessment.change = (
                round(brain_health_score - previous_score, 1) if previous_score > 0 else 0
            )
            assessment.completed_at = datetime.utcnow()
            assessment.status = "completed"

            db.commit()
            db.refresh(assessment)

            print(f"✅ Updated combined row ID {assessment.id}, Score: {brain_health_score}")
            return assessment

        else:
            # ---------- CREATE ----------
            print("➕ Creating new combined row for today")

            prev_assessment = (
                db.query(Assessment)
                .filter(Assessment.user_id == user_id)
                .order_by(Assessment.completed_at.desc())
                .first()
            )
            previous_score = prev_assessment.brain_health_score if prev_assessment else 0
            change = brain_health_score - previous_score if previous_score > 0 else 0

            assessment = Assessment(
                user_id=user_id,
                twin_id=twin.id,
                voice_score=voice_score,
                memory_score=memory_score,
                tremor_score=tremor_score,
                typing_score=typing_score,
                face_score=face_score,
                brain_health_score=brain_health_score,
                previous_score=previous_score,
                change=round(change, 1),
                week_number=datetime.utcnow().isocalendar()[1],
                status="completed",
                completed_at=datetime.utcnow(),
            )

            db.add(assessment)
            db.commit()
            db.refresh(assessment)

            print(f"✅ Created combined row ID {assessment.id}, Score: {brain_health_score}")
            return assessment

    except Exception as e:
        print(f"❌ Error in create_combined_assessment: {e}")
        db.rollback()
        return None