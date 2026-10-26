# backend/app/api/v1/routes/reports.py

from fastapi import APIRouter, Response, HTTPException, status, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime
from typing import List, Optional

from app.database import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.models.voice import VoiceAssessment
from app.models.tremor import TremorAssessment
from app.models.memory import MemoryAssessment
from app.models.typing import TypingAssessment
from app.models.face import FaceAssessment
from app.services.twin_service import TwinService
from app.services.auth_service import get_current_user_id
from reports.pdf.report_generator import ReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/generate")
async def generate_report(
    user_id: int = 1,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Generate a clinical report for a user"""
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user has any assessments
        assessments = db.query(Assessment).filter(
            Assessment.user_id == user_id
        ).count()
        
        if assessments == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No assessments found. Please complete at least one assessment to generate a report."
            )
        
        # Get twin data
        twin_service = TwinService(db)
        twin = twin_service.get_or_create_twin(user_id)
        
        # Get latest assessment
        latest_assessment = db.query(Assessment).filter(
            Assessment.user_id == user_id
        ).order_by(Assessment.completed_at.desc()).first()
        
        # Get module scores
        latest_voice = db.query(VoiceAssessment).filter(
            VoiceAssessment.user_id == user_id
        ).order_by(VoiceAssessment.completed_at.desc()).first()
        
        latest_tremor = db.query(TremorAssessment).filter(
            TremorAssessment.user_id == user_id
        ).order_by(TremorAssessment.completed_at.desc()).first()
        
        latest_memory = db.query(MemoryAssessment).filter(
            MemoryAssessment.user_id == user_id
        ).order_by(MemoryAssessment.completed_at.desc()).first()
        
        latest_typing = db.query(TypingAssessment).filter(
            TypingAssessment.user_id == user_id
        ).order_by(TypingAssessment.completed_at.desc()).first()
        
        latest_face = db.query(FaceAssessment).filter(
            FaceAssessment.user_id == user_id
        ).order_by(FaceAssessment.completed_at.desc()).first()
        
        # Prepare data for report
        report_data = {
            "patient_name": user.name,
            "patient_id": f"NT-{str(user_id).pad_start(4, '0')}",
            "twin_data": twin,
            "latest_score": latest_assessment.brain_health_score if latest_assessment else 0,
            "assessments_count": assessments,
            "generated_at": datetime.utcnow().isoformat(),
            "module_scores": {
                "voice": latest_voice.score if latest_voice else 0,
                "memory": latest_memory.score if latest_memory else 0,
                "tremor": latest_tremor.score if latest_tremor else 0,
                "typing": latest_typing.score if latest_typing else 0,
                "face": latest_face.score if latest_face else 0
            }
        }
        
        # Generate PDF
        output_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            "uploads", "reports"
        )
        os.makedirs(output_dir, exist_ok=True)
        
        pdf_path = os.path.join(
            output_dir, 
            f"clinical_report_user_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        )
        
        ReportGenerator.generate_pdf_report(
            patient_name=user.name,
            patient_id=f"NT-{str(user_id).pad_start(4, '0')}",
            twin_data=report_data,
            output_path=pdf_path
        )
        
        return FileResponse(
            path=pdf_path,
            filename=f"NeuroTwin_Clinical_Report_NT{str(user_id).pad_start(4, '0')}.pdf",
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Report generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/list")
async def list_reports(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """List all reports for a user"""
    try:
        # Use current user if no user_id provided
        if user_id is None:
            user_id = current_user_id
        
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user has any assessments
        assessments = db.query(Assessment).filter(
            Assessment.user_id == user_id
        ).order_by(Assessment.completed_at.desc()).all()
        
        if not assessments:
            return {
                "status": "success",
                "has_assessments": False,
                "message": "No assessments found. Complete your first assessment to generate reports.",
                "reports": [],
                "count": 0
            }
        
        # Generate report list from actual assessments
        reports = []
        for idx, assessment in enumerate(assessments):
            # Generate report ID from assessment ID
            report_id = f"REP-{assessment.id:04d}"
            
            # Generate report title based on date
            if assessment.completed_at:
                date_str = assessment.completed_at.strftime("%Y-%m-%d")
                if idx == 0:
                    title = "Latest Clinical Assessment"
                elif idx < 3:
                    title = f"Follow-up Assessment - {date_str}"
                else:
                    title = f"Assessment - {date_str}"
            else:
                title = f"Assessment #{idx + 1}"
            
            reports.append({
                "id": report_id,
                "assessment_id": assessment.id,
                "title": title,
                "date": assessment.completed_at.strftime("%Y-%m-%d") if assessment.completed_at else datetime.utcnow().strftime("%Y-%m-%d"),
                "score": assessment.brain_health_score or 0,
                "status": "Ready" if assessment.brain_health_score is not None else "Pending",
                "module_scores": {
                    "voice": assessment.voice_score or 0,
                    "memory": assessment.memory_score or 0,
                    "tremor": assessment.tremor_score or 0,
                    "typing": assessment.typing_score or 0,
                    "face": assessment.face_score or 0
                }
            })
        
        return {
            "status": "success",
            "has_assessments": True,
            "reports": reports,
            "count": len(reports),
            "total_assessments": len(assessments)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"List reports error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list reports: {str(e)}"
        )


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Get a specific report by ID"""
    try:
        # Parse report_id to get assessment_id
        if not report_id.startswith("REP-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid report ID format. Expected format: REP-XXXX"
            )
        
        assessment_id = int(report_id.split("-")[1])
        
        assessment = db.query(Assessment).filter(
            Assessment.id == assessment_id,
            Assessment.user_id == current_user_id
        ).first()
        
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Get user
        user = db.query(User).filter(User.id == current_user_id).first()
        
        return {
            "status": "success",
            "report": {
                "id": report_id,
                "assessment_id": assessment.id,
                "title": f"Clinical Assessment - {assessment.completed_at.strftime('%Y-%m-%d') if assessment.completed_at else 'Latest'}",
                "date": assessment.completed_at.strftime("%Y-%m-%d") if assessment.completed_at else datetime.utcnow().strftime("%Y-%m-%d"),
                "score": assessment.brain_health_score or 0,
                "module_scores": {
                    "voice": assessment.voice_score or 0,
                    "memory": assessment.memory_score or 0,
                    "tremor": assessment.tremor_score or 0,
                    "typing": assessment.typing_score or 0,
                    "face": assessment.face_score or 0
                },
                "patient_name": user.name if user else "Unknown",
                "patient_id": f"NT-{str(current_user_id).pad_start(4, '0')}"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get report: {str(e)}"
        )


@router.get("/status/{user_id}")
async def get_report_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """Check if user has assessments for report generation"""
    try:
        if user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )
        
        assessments = db.query(Assessment).filter(
            Assessment.user_id == user_id
        ).count()
        
        has_assessments = assessments > 0
        
        return {
            "status": "success",
            "has_assessments": has_assessments,
            "assessment_count": assessments,
            "message": "Complete your first assessment to generate reports" if not has_assessments else f"{assessments} assessments available"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Report status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get report status: {str(e)}"
        )