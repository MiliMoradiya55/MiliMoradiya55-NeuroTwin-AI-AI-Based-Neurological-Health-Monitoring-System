# backend/app/api/v1/routes/admin.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/stats")
async def get_admin_stats():
    return {
        "system_status": "Healthy",
        "active_users": 1420,
        "total_assessments_processed": 18450,
        "digital_twins_calibrated": 1280,
        "ai_models_status": {
            "voice_prosody_v2": "Operational (99.8%)",
            "hand_tremor_vision_v3": "Operational (99.9%)",
            "typing_dynamics_v1": "Operational (100%)",
            "xai_shap_engine": "Operational (99.5%)"
        },
        "role_distribution": {
            "patients": 1120,
            "doctors": 180,
            "family": 110,
            "admins": 10
        }
    }

@router.get("/users")
async def get_admin_users():
    return {
        "users": [
            {"id": 1, "name": "Arthur Vance", "email": "patient@neurotwin.ai", "role": "patient", "status": "Active"},
            {"id": 2, "name": "Dr. Sarah Chen", "email": "doctor@neurotwin.ai", "role": "doctor", "status": "Active"},
            {"id": 3, "name": "Clara Vance", "email": "family@neurotwin.ai", "role": "family", "status": "Active"},
            {"id": 4, "name": "Admin System", "email": "admin@neurotwin.ai", "role": "admin", "status": "Active"}
        ]
    }
