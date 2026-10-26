# backend/app/api/v1/routes/family.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/overview")
async def get_family_overview(family_id: int = 1):
    return {
        "family_member": "Clara Vance (Daughter)",
        "monitored_patient": {
            "name": "Arthur Vance",
            "patient_id": "NT-8829",
            "relationship": "Father",
            "current_score": 89,
            "status": "Stable",
            "assessment_streak": "12 Consecutive Weeks",
            "last_completed": "Yesterday at 10:15 AM"
        },
        "weekly_completion": [
            {"week": "Week 9", "completed": True},
            {"week": "Week 10", "completed": True},
            {"week": "Week 11", "completed": True},
            {"week": "Week 12", "completed": True}
        ],
        "alerts": [
            {
                "id": "A-1",
                "date": "2026-08-01",
                "level": "info",
                "title": "Weekly Assessment Completed",
                "message": "Arthur completed the weekly 5-module assessment on time. All core markers remain within stable thresholds."
            }
        ]
    }
