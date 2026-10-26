# backend/app/services/assessment_service.py
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssessmentService:
    """Complete Assessment Service with Dynamic Timeline"""

    def __init__(self, db: Session):
        self.db = db

    def save_assessment(self, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save user assessment and update all metrics"""
        try:
            from app.models.assessment import Assessment
            from app.models.twin import DigitalTwin, TwinAssessment

            # Save main assessment
            assessment = Assessment(
                user_id=user_id,
                assessment_type=data.get('type', 'voice'),
                score=data.get('score', 0),
                accuracy=data.get('accuracy', 0),
                metrics=json.dumps(data.get('metrics', {})),
                status='completed',
                completed_at=datetime.utcnow()
            )
            self.db.add(assessment)
            self.db.commit()
            self.db.refresh(assessment)

            # Update Digital Twin
            twin = self.db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
            if twin:
                twin_assessment = TwinAssessment(
                    twin_id=twin.id,
                    assessment_type=data.get('type', 'voice'),
                    score=data.get('score', 0),
                    metrics=json.dumps(data.get('metrics', {})),
                    deviation=0.0,
                    status='normal',
                    created_at=datetime.utcnow()
                )
                self.db.add(twin_assessment)
                self.db.commit()

            # Update user's brain health score
            self._update_brain_health_score(user_id)

            return {
                'status': 'success',
                'assessment_id': assessment.id,
                'message': 'Assessment saved successfully'
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving assessment: {str(e)}")
            raise

    def _update_brain_health_score(self, user_id: int):
        """Update user's overall brain health score"""
        try:
            from app.models.assessment import Assessment
            from app.models.twin import DigitalTwin

            # Calculate average score from last 5 assessments
            assessments = self.db.query(Assessment).filter(
                Assessment.user_id == user_id,
                Assessment.status == 'completed'
            ).order_by(desc(Assessment.completed_at)).limit(5).all()

            if assessments:
                avg_score = sum(a.score for a in assessments) / len(assessments)
                
                # Update digital twin
                twin = self.db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
                if twin:
                    twin.current_metrics = {
                        'brain_health_score': round(avg_score, 1),
                        'last_updated': datetime.utcnow().isoformat(),
                        'total_assessments': len(assessments)
                    }
                    self.db.commit()

        except Exception as e:
            logger.error(f"Error updating brain health score: {str(e)}")

    def get_user_assessments(self, user_id: int, limit: int = 100) -> List[Dict]:
        """Get user's complete assessment history"""
        try:
            from app.models.assessment import Assessment
            
            assessments = self.db.query(Assessment).filter(
                Assessment.user_id == user_id,
                Assessment.status == 'completed'
            ).order_by(Assessment.completed_at.desc()).limit(limit).all()

            return [
                {
                    'id': a.id,
                    'type': a.assessment_type,
                    'score': a.score,
                    'accuracy': a.accuracy,
                    'metrics': json.loads(a.metrics) if a.metrics else {},
                    'status': a.status,
                    'completed_at': a.completed_at.isoformat()
                }
                for a in assessments
            ]

        except Exception as e:
            logger.error(f"Error getting assessments: {str(e)}")
            return []

    def get_timeline_data(self, user_id: int, period: str = 'weekly') -> Dict:
        """Get dynamic timeline data based on user assessments"""
        try:
            from app.models.assessment import Assessment
            
            # Get all assessments ordered by date
            assessments = self.db.query(Assessment).filter(
                Assessment.user_id == user_id,
                Assessment.status == 'completed'
            ).order_by(Assessment.completed_at).all()

            if not assessments:
                return self._get_empty_timeline()

            # Group by period
            if period == 'weekly':
                return self._group_by_week(assessments)
            elif period == 'monthly':
                return self._group_by_month(assessments)
            elif period == 'yearly':
                return self._group_by_year(assessments)
            else:
                return self._group_by_week(assessments)

        except Exception as e:
            logger.error(f"Error getting timeline: {str(e)}")
            return self._get_empty_timeline()

    def _group_by_week(self, assessments: List) -> Dict:
        """Group assessments by week"""
        weekly_data = {}
        for assessment in assessments:
            week_key = assessment.completed_at.strftime('%Y-W%W')
            if week_key not in weekly_data:
                weekly_data[week_key] = {
                    'label': f"Week {assessment.completed_at.strftime('%W')}",
                    'scores': [],
                    'voice_scores': [],
                    'memory_scores': [],
                    'tremor_scores': [],
                    'typing_scores': [],
                    'date': assessment.completed_at.isoformat()
                }
            weekly_data[week_key]['scores'].append(assessment.score)
            
            # Categorize by type
            if assessment.assessment_type == 'voice':
                weekly_data[week_key]['voice_scores'].append(assessment.score)
            elif assessment.assessment_type == 'memory':
                weekly_data[week_key]['memory_scores'].append(assessment.score)
            elif assessment.assessment_type == 'tremor':
                weekly_data[week_key]['tremor_scores'].append(assessment.score)
            elif assessment.assessment_type == 'typing':
                weekly_data[week_key]['typing_scores'].append(assessment.score)

        return self._format_timeline_data(weekly_data)

    def _group_by_month(self, assessments: List) -> Dict:
        """Group assessments by month"""
        monthly_data = {}
        for assessment in assessments:
            month_key = assessment.completed_at.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'label': assessment.completed_at.strftime('%b %Y'),
                    'scores': [],
                    'voice_scores': [],
                    'memory_scores': [],
                    'tremor_scores': [],
                    'typing_scores': [],
                    'date': assessment.completed_at.isoformat()
                }
            monthly_data[month_key]['scores'].append(assessment.score)
            
            if assessment.assessment_type == 'voice':
                monthly_data[month_key]['voice_scores'].append(assessment.score)
            elif assessment.assessment_type == 'memory':
                monthly_data[month_key]['memory_scores'].append(assessment.score)
            elif assessment.assessment_type == 'tremor':
                monthly_data[month_key]['tremor_scores'].append(assessment.score)
            elif assessment.assessment_type == 'typing':
                monthly_data[month_key]['typing_scores'].append(assessment.score)

        return self._format_timeline_data(monthly_data)

    def _group_by_year(self, assessments: List) -> Dict:
        """Group assessments by year"""
        yearly_data = {}
        for assessment in assessments:
            year_key = assessment.completed_at.strftime('%Y')
            if year_key not in yearly_data:
                yearly_data[year_key] = {
                    'label': assessment.completed_at.strftime('%Y'),
                    'scores': [],
                    'voice_scores': [],
                    'memory_scores': [],
                    'tremor_scores': [],
                    'typing_scores': [],
                    'date': assessment.completed_at.isoformat()
                }
            yearly_data[year_key]['scores'].append(assessment.score)
            
            if assessment.assessment_type == 'voice':
                yearly_data[year_key]['voice_scores'].append(assessment.score)
            elif assessment.assessment_type == 'memory':
                yearly_data[year_key]['memory_scores'].append(assessment.score)
            elif assessment.assessment_type == 'tremor':
                yearly_data[year_key]['tremor_scores'].append(assessment.score)
            elif assessment.assessment_type == 'typing':
                yearly_data[year_key]['typing_scores'].append(assessment.score)

        return self._format_timeline_data(yearly_data)

    def _format_timeline_data(self, grouped_data: Dict) -> Dict:
        """Format data for chart display"""
        labels = []
        scores = []
        voice_scores = []
        memory_scores = []
        tremor_scores = []
        typing_scores = []
        dates = []

        for key in sorted(grouped_data.keys()):
            data = grouped_data[key]
            labels.append(data['label'])
            dates.append(data['date'])
            
            # Calculate averages
            avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
            scores.append(round(avg_score, 1))
            
            avg_voice = sum(data['voice_scores']) / len(data['voice_scores']) if data['voice_scores'] else 0
            voice_scores.append(round(avg_voice, 1))
            
            avg_memory = sum(data['memory_scores']) / len(data['memory_scores']) if data['memory_scores'] else 0
            memory_scores.append(round(avg_memory, 1))
            
            avg_tremor = sum(data['tremor_scores']) / len(data['tremor_scores']) if data['tremor_scores'] else 0
            tremor_scores.append(round(avg_tremor, 1))
            
            avg_typing = sum(data['typing_scores']) / len(data['typing_scores']) if data['typing_scores'] else 0
            typing_scores.append(round(avg_typing, 1))

        return {
            'labels': labels,
            'scores': scores,
            'voice_scores': voice_scores,
            'memory_scores': memory_scores,
            'tremor_scores': tremor_scores,
            'typing_scores': typing_scores,
            'dates': dates,
            'total_assessments': sum(len(d['scores']) for d in grouped_data.values()),
            'average_score': round(sum(scores) / len(scores), 1) if scores else 0,
            'highest_score': max(scores) if scores else 0,
            'lowest_score': min(scores) if scores else 0,
            'current_score': scores[-1] if scores else 0,
            'previous_score': scores[-2] if len(scores) > 1 else scores[-1] if scores else 0
        }

    def _get_empty_timeline(self) -> Dict:
        """Return empty timeline data"""
        return {
            'labels': [],
            'scores': [],
            'voice_scores': [],
            'memory_scores': [],
            'tremor_scores': [],
            'typing_scores': [],
            'dates': [],
            'total_assessments': 0,
            'average_score': 0,
            'highest_score': 0,
            'lowest_score': 0,
            'current_score': 0,
            'previous_score': 0,
            'message': 'No assessments found'
        }

    def get_dashboard_data(self, user_id: int) -> Dict:
        """Get complete dashboard data for user"""
        try:
            from app.models.assessment import Assessment
            from app.models.twin import DigitalTwin

            # Get all assessments
            assessments = self.db.query(Assessment).filter(
                Assessment.user_id == user_id,
                Assessment.status == 'completed'
            ).order_by(Assessment.completed_at.desc()).all()

            # Get digital twin
            twin = self.db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()

            # Calculate metrics
            total_assessments = len(assessments)
            current_score = 0
            previous_score = 0
            change = 0

            if assessments:
                current_score = assessments[0].score if assessments else 0
                previous_score = assessments[1].score if len(assessments) > 1 else current_score
                change = current_score - previous_score

            # Calculate streak
            streak = self._calculate_streak(assessments)

            return {
                'status': 'success',
                'data': {
                    'brain_health_score': current_score,
                    'previous_score': previous_score,
                    'change': round(change, 1),
                    'total_assessments': total_assessments,
                    'streak': streak,
                    'highest_score': max([a.score for a in assessments]) if assessments else 0,
                    'lowest_score': min([a.score for a in assessments]) if assessments else 0,
                    'twin': twin.to_dict() if twin else None,
                    'last_assessment': assessments[0].completed_at.isoformat() if assessments else None
                }
            }

        except Exception as e:
            logger.error(f"Error getting dashboard data: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def _calculate_streak(self, assessments: List) -> int:
        """Calculate current streak of completed assessments"""
        if not assessments:
            return 0

        streak = 0
        today = datetime.utcnow().date()
        
        # Check if assessments are consecutive
        for i, assessment in enumerate(assessments):
            assessment_date = assessment.completed_at.date()
            # If this is the first assessment, check if it's today or yesterday
            if i == 0:
                if (today - assessment_date).days <= 1:
                    streak = 1
                else:
                    break
            else:
                # Check if assessments are consecutive days
                prev_date = assessments[i-1].completed_at.date()
                if (prev_date - assessment_date).days == 1:
                    streak += 1
                else:
                    break

        return streak