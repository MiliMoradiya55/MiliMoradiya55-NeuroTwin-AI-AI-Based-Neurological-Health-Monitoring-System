# backend/app/models/feedback.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Which week this feedback is for (so it applies per week)
    week_start_date = Column(DateTime, nullable=False)   # Monday of the week
    assessment_count_before_feedback = Column(Integer, default=2)

    # Rating mode fields
    overall_rating = Column(Integer, nullable=True)      # 1-5 stars
    accuracy_rating = Column(Integer, nullable=True)
    ease_rating = Column(Integer, nullable=True)
    speed_rating = Column(Integer, nullable=True)
    design_rating = Column(Integer, nullable=True)
    value_rating = Column(Integer, nullable=True)

    # Detailed mode fields
    overall_experience = Column(Text, nullable=True)
    worked_well = Column(Text, nullable=True)
    needs_improvement = Column(Text, nullable=True)

    # Impact on health
    impact_health = Column(String, nullable=True)         # significantly | somewhat | not_sure | no
    impact_more = Column(Text, nullable=True)

    # Compared to before
    health_change = Column(String, nullable=True)         # improved | slightly_improved | no_change | worsened
    change_more = Column(Text, nullable=True)

    # Recommendation
    recommend_option = Column(String, nullable=True)      # definitely_yes | probably_yes | ...
    recommend_reason = Column(Text, nullable=True)

    # What changed for you
    valuable_learned = Column(Text, nullable=True)

    # Continue using
    continue_using = Column(String, nullable=True)        # yes_definitely | yes_probably | ...

    # Feature requests / bugs
    feature_requests = Column(Text, nullable=True)
    bug_reports = Column(Text, nullable=True)

    # Uploaded files (store file names as JSON array)
    uploaded_files = Column(JSON, nullable=True)

    # Quick tags (JSON array of strings)
    positive_tags = Column(JSON, nullable=True)
    improvement_tags = Column(JSON, nullable=True)

    # Snapshot of the two prior assessments for context
    assessment_1_id = Column(Integer, nullable=True)
    assessment_2_id = Column(Integer, nullable=True)
    assessment_1_scores = Column(JSON, nullable=True)
    assessment_2_scores = Column(JSON, nullable=True)

    # Metadata
    submitted_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="feedbacks")