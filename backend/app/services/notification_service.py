from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "system") -> Notification:
        """Create a new in-app notification for a user."""
        new_notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.add(new_notification)
        db.commit()
        db.refresh(new_notification)
        return new_notification

    @staticmethod
    def get_user_notifications(db: Session, user_id: int, limit: int = 20) -> List[Notification]:
        """Fetch unread and recent notifications for a user."""
        return db.query(Notification)\
                 .filter(Notification.user_id == user_id)\
                 .order_by(Notification.created_at.desc())\
                 .limit(limit)\
                 .all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
        """Mark a specific notification as read."""
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            db.refresh(notification)
            
        return notification

    @staticmethod
    def dispatch_assessment_reminder(db: Session, user_id: int) -> Notification:
        """Helper to send a specific reminder to take a daily/weekly assessment."""
        return NotificationService.create_notification(
            db=db,
            user_id=user_id,
            title="Assessment Reminder",
            message="It's time for your next neurological assessment to keep your Digital Twin up to date.",
            type="reminder"
        )
