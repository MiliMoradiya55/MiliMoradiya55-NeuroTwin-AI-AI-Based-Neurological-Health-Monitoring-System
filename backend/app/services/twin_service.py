# backend/app/services/twin_service.py
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.twin import DigitalTwin
from app.models.user import User

class TwinService:
    """Digital Twin Service for NeuroTwin AI"""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_twin(self, user_id: int) -> DigitalTwin:
        """Get or create digital twin for user"""
        twin = self.db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
        if not twin:
            twin = DigitalTwin(
                user_id=user_id,
                name=f"Twin_{user_id}",
                baseline_data="{}",
                is_active=True,
                confidence_score=0.0
            )
            self.db.add(twin)
            self.db.commit()
            self.db.refresh(twin)
        return twin

    def update_baseline(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update baseline metrics for user's digital twin"""
        twin = self.get_or_create_twin(user_id)
        twin.baseline_data = str(data)
        twin.baseline_created_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(twin)
        return twin.to_dict()

    def update_metrics(self, user_id: int, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Update current metrics for user's digital twin"""
        twin = self.get_or_create_twin(user_id)
        twin.current_metrics = str(metrics)
        twin.last_updated = datetime.utcnow()
        self.db.commit()
        self.db.refresh(twin)
        return twin.to_dict()

    def get_twin_data(self, user_id: int) -> Dict[str, Any]:
        """Get complete digital twin data for user"""
        twin = self.get_or_create_twin(user_id)
        
        return {
            "twin": twin.to_dict() if twin else None
        }