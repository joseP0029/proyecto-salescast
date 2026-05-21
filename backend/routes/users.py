from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, security
from routes.auth import get_current_user

router = APIRouter()

def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted, admin role required"
        )
    return current_user

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Get all users for the admin's organization"""
    users = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id
    ).all()
    return users

@router.patch("/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_update: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Change a user's role (admin/analyst)"""
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Optional: prevent admin from demoting themselves if they are the only admin
    if user.id == current_user.id and role_update.role == models.RoleEnum.analyst:
        admin_count = db.query(models.User).filter(
            models.User.organization_id == current_user.organization_id,
            models.User.role == models.RoleEnum.admin
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the only admin")

    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/status", response_model=schemas.UserResponse)
def update_user_status(
    user_id: int,
    status_update: schemas.UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Change a user's active status (allow/deny access)"""
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id and not status_update.is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user.is_active = status_update.is_active
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/password", response_model=schemas.UserResponse)
def reset_user_password(
    user_id: int,
    password_reset: schemas.UserPasswordReset,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Reset a user's password (admin only)"""
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.organization_id == current_user.organization_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(password_reset.new_password)
    db.commit()
    db.refresh(user)
    return user
