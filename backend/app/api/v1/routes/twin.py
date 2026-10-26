from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.twin_service import TwinService
from app.api.dependencies.database import get_db

router = APIRouter()

@router.get("/profile")
async def get_digital_twin(user_id: int = 1, db: Session = Depends(get_db)):
    profile = TwinService.get_digital_twin_profile(db, user_id)
    return profile