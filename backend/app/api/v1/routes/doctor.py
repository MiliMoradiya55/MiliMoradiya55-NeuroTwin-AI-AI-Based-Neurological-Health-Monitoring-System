# backend/app/api/v1/routes/doctor.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/patients")
async def get_doctor_patients(doctor_id: int = 1):
    return {
        "doctor": {
            "name": "Dr. Sarah Chen",
            "specialization": "Neurology & Neuro-cognition",
            "hospital": "Metropolitan Medical Center"
        },
        "patients": [
            {
                "id": 1,
                "name": "Arthur Vance",
                "patient_id": "NT-8829",
                "age": 58,
                "gender": "Male",
                "brain_health_score": 89.0,
                "risk_status": "Minor Variance",
                "last_assessment": "2026-08-01",
                "primary_indicator": "Typing rhythm variance +13%"
            },
            {
                "id": 2,
                "name": "Eleanor Rostova",
                "patient_id": "NT-9104",
                "age": 64,
                "gender": "Female",
                "brain_health_score": 94.2,
                "risk_status": "Optimal Resilience",
                "last_assessment": "2026-08-02",
                "primary_indicator": "Stable baseline"
            },
            {
                "id": 3,
                "name": "Marcus Sterling",
                "patient_id": "NT-7412",
                "age": 71,
                "gender": "Male",
                "brain_health_score": 76.5,
                "risk_status": "Action Recommended",
                "last_assessment": "2026-07-29",
                "primary_indicator": "Voice tremor +18%, gait slowdown"
            }
        ]
    }

@router.get("/patient/{patient_id}")
async def get_patient_detail(patient_id: int):
    return {
        "patient_info": {
            "id": patient_id,
            "name": "Arthur Vance",
            "patient_id": "NT-8829",
            "age": 58,
            "gender": "Male",
            "enrolled_weeks": 12,
            "baseline_status": "Calibrated (4 Weeks)"
        },
        "brain_health_score": 89.0,
        "xai_summary": "keystroke timing shows a 13% increase in latency with mild speech hesitation.",
        "weekly_scores": [92.0, 91.5, 91.0, 90.5, 89.8, 90.2, 89.5, 88.9, 89.4, 89.1, 88.7, 89.0]
    }
