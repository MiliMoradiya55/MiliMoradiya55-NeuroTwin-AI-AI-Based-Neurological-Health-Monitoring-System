from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
from app.models.assessment import Assessment
from app.models.user import User
from app.models.twin import DigitalTwin

class ReportService:
    @staticmethod
    def generate_clinical_report(db: Session, patient_id: int) -> Dict[str, Any]:
        """Generate a comprehensive clinical report summarizing the patient's data."""
        user = db.query(User).filter(User.id == patient_id).first()
        twin = db.query(DigitalTwin).filter(DigitalTwin.user_id == patient_id).first()
        
        if not user or not twin:
            return {"error": "Patient or Digital Twin not found."}

        # Fetch all assessments for this patient
        assessments = db.query(Assessment).filter(Assessment.user_id == patient_id).order_by(Assessment.created_at.desc()).all()
        
        # Categorize assessments
        voice_assessments = [a for a in assessments if a.type.value == "voice"]
        tremor_assessments = [a for a in assessments if a.type.value == "tremor"]
        cognitive_assessments = [a for a in assessments if a.type.value in ["cognitive", "typing", "memory"]]

        report = {
            "patient_info": {
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "report_generated_at": datetime.utcnow().isoformat()
            },
            "digital_twin_summary": {
                "current_health_score": twin.health_score,
                "last_updated": twin.updated_at.isoformat() if twin.updated_at else twin.created_at.isoformat()
            },
            "assessment_summary": {
                "total_assessments": len(assessments),
                "voice_average_score": ReportService._calculate_average(voice_assessments),
                "tremor_average_score": ReportService._calculate_average(tremor_assessments),
                "cognitive_average_score": ReportService._calculate_average(cognitive_assessments),
            },
            "recent_assessments": [
                {
                    "id": a.id,
                    "type": a.type.value,
                    "score": a.score,
                    "date": a.created_at.isoformat(),
                    "findings": a.result_data.get("recommendation", "No specific findings.") if a.result_data else "N/A"
                } for a in assessments[:5]  # Top 5 most recent
            ],
            "clinical_recommendation": ReportService._generate_recommendation(twin.health_score)
        }
        
        return report

    @staticmethod
    def _calculate_average(assessments: List[Assessment]) -> float:
        if not assessments:
            return 0.0
        total = sum(a.score for a in assessments if a.score is not None)
        return round(total / len(assessments), 2)

    @staticmethod
    def _generate_recommendation(health_score: float) -> str:
        if health_score >= 90:
            return "Patient is exhibiting optimal neurological patterns. Routine follow-up recommended."
        elif health_score >= 70:
            return "Patient exhibits mild variations. Recommend monitoring through bi-weekly assessments."
        else:
            return "Patient metrics show significant deviation from baseline. Urgent clinical review is strongly advised."
