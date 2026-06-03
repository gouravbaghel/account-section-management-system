"""
User management routes: list, create, update, deactivate. Super admin only.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_db, require_role, PaginationParams
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import PaginatedResponse
from app.utils.security import get_password_hash

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=PaginatedResponse[UserResponse])
def list_users(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin)),
):
    """List all users with pagination. Super admin only."""
    query = db.query(User)
    total = query.count()
    users = query.order_by(User.id).offset(pagination.offset).limit(pagination.size).all()
    items = [UserResponse.model_validate(u) for u in users]
    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
    }


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin)),
):
    """Create a new user with hashed password. Super admin only."""
    # Check unique username
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with username '{user_data.username}' already exists",
        )

    # Check unique email
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{user_data.email}' already exists",
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="User",
        entity_id=user.id,
        details=f"Created user '{user.username}' with role '{user.role}'",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin)),
):
    """Update a user. Super admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    update_data = user_data.model_dump(exclude_unset=True)

    # Check unique email if being updated
    if "email" in update_data and update_data["email"] != user.email:
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with email '{update_data['email']}' already exists",
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="User",
        entity_id=user.id,
        details=f"Updated user '{user.username}' fields: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def deactivate_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin)),
):
    """Deactivate a user (is_active=False). Super admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )

    # Prevent self-deactivation
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    user.is_active = False

    audit = AuditLog(
        user_id=current_user.id,
        action="DEACTIVATE",
        entity_type="User",
        entity_id=user.id,
        details=f"Deactivated user '{user.username}'",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    return {"message": f"User '{user.username}' deactivated successfully"}
