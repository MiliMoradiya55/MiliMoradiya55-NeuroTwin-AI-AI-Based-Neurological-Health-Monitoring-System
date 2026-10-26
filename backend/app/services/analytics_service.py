from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json
from app.models.assessment import Assessment, AssessmentType
from app.models.twin import DigitalTwin

class AnalyticsService:
    @staticmethod
    def get_patient_analytics(db: Session, patient_id: int) -> Dict[str, Any]:
        """Calculate overall brain health trends for a digital twin."""
        twin = db.query(DigitalTwin).filter(DigitalTwin.user_id == patient_id).first()
        if not twin:
            return {"error": "Digital twin not found for this patient"}

        # Get assessments from the last 6 months
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        assessments = db.query(Assessment).filter(
            Assessment.user_id == patient_id,
            Assessment.created_at >= six_months_ago
        ).order_by(Assessment.created_at.asc()).all()

        if not assessments:
            return {
                "overall_health_score": 0.0,
                "trends": [],
                "recent_insights": ["Not enough data to generate analytics."]
            }

        # Calculate moving average and trendline
        trend_data = []
        cumulative_score = 0
        
        for idx, a in enumerate(assessments):
            cumulative_score += a.score
            moving_avg = round(cumulative_score / (idx + 1), 2)
            trend_data.append({
                "date": a.created_at.isoformat(),
                "score": a.score,
                "moving_average": moving_avg,
                "type": a.type.value
            })

        latest_score = assessments[-1].score
        first_score = assessments[0].score
        progression = round(latest_score - first_score, 2)

        insights = []
        if progression > 5:
            insights.append("Shows significant improvement over the last 6 months.")
        elif progression < -5:
            insights.append("Slight decline in cognitive metrics observed. Follow-up recommended.")
        else:
            insights.append("Brain health metrics appear stable.")

        return {
            "twin_id": twin.id,
            "overall_health_score": twin.health_score,
            "progression": progression,
            "trends": trend_data,
            "recent_insights": insights
        }

    @staticmethod
    def generate_population_stats(db: Session) -> Dict[str, Any]:
        """Aggregate anonymous statistics across all users."""
        total_assessments = db.query(Assessment).count()
        avg_score = db.query(Assessment).with_entities(Assessment.score).all()
        
        if not avg_score:
            return {"average_score": 0, "total_assessments": 0}
            
        scores = [s[0] for s in avg_score if s[0] is not None]
        avg = sum(scores) / len(scores) if scores else 0
        
        return {
            "average_population_score": round(avg, 2),
            "total_assessments": total_assessments
        }
