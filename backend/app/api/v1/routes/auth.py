# backend/app/api/v1/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.user import User
from app.services.auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user_id,
    get_current_user_role,
    decode_access_token
)

# ===== OAUTH2 SCHEME =====
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ============ PYDANTIC MODELS ============

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class TokenResponse(BaseModel):
    status: str
    message: str
    access_token: str
    token_type: str
    user: dict

# ============ HELPER FUNCTIONS ============

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

# ============ AUTH ROUTES ============

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        existing_user = get_user_by_email(db, request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(request.password)
        
        new_user = User(
            name=request.name,
            email=request.email,
            password_hash=hashed_password,
            role=request.role,
            age=request.age,
            gender=request.gender,
            phone=request.phone,
            address=request.address,
            is_active=True,
            is_verified=False,
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        access_token = create_access_token(
            data={
                "sub": new_user.email,
                "user_id": new_user.id,
                "role": new_user.role
            }
        )
        
        return {
            "status": "success",
            "message": "User registered successfully",
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = get_user_by_email(db, request.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user.last_login = datetime.utcnow()
        db.commit()
        
        access_token = create_access_token(
            data={
                "sub": user.email,
                "user_id": user.id,
                "role": user.role
            }
        )
        
        return {
            "status": "success",
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

# ===== GET CURRENT USER =====

@router.get("/me")
async def get_current_user_info(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user information"""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

# ===== UPDATE PROFILE =====

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Update user profile"""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if profile_data.name is not None:
            user.name = profile_data.name
        if profile_data.age is not None:
            user.age = profile_data.age
        if profile_data.gender is not None:
            user.gender = profile_data.gender
        if profile_data.phone is not None:
            user.phone = profile_data.phone
        if profile_data.address is not None:
            user.address = profile_data.address
        
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return user.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

# ===== CHANGE PASSWORD (NEW) =====

@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Change the current user's password."""
    try:
        # Decode token to get user_id
        token_payload = decode_access_token(token)
        user_id = token_payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        # Find user
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify current password
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Validate new password
        if len(payload.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters"
            )

        # Ensure new password is different from current
        if payload.current_password == payload.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )

        # Hash and update
        user.password_hash = get_password_hash(payload.new_password)
        user.updated_at = datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": "Password changed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Change password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

# ===== TOKEN / ROLE ENDPOINTS =====

@router.get("/me/id")
async def get_current_user_id_endpoint(user_id: int = Depends(get_current_user_id)):
    return {"user_id": user_id}

@router.get("/me/role")
async def get_current_user_role_endpoint(role: str = Depends(get_current_user_role)):
    return {"role": role}

@router.post("/logout")
async def logout():
    return {
        "status": "success",
        "message": "Logged out successfully"
    }

@router.post("/verify-token")
async def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "status": "success",
            "message": "Token is valid",
            "user": user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )