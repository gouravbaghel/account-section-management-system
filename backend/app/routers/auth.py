"""
Authentication routes: login, token refresh, current user info.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import LoginRequest, TokenResponse, UserResponse, RefreshRequest, ChangePasswordRequest
from app.services.auth import authenticate_user, create_tokens, refresh_access_token
from app.utils.security import verify_password, get_password_hash

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Authenticate user and return access/refresh tokens."""
    # First check if user exists to prevent blind brute force
    user_exists = db.query(User).filter(User.username == login_data.username).first()
    
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        if user_exists:
            # Audit log failed attempt for existing user
            audit = AuditLog(
                user_id=user_exists.id,
                action="LOGIN_FAILED",
                entity_type="User",
                entity_id=user_exists.id,
                details=f"Failed login attempt for user '{login_data.username}'",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(audit)
            db.commit()
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    tokens = create_tokens(user)

    # Audit log successful login
    audit = AuditLog(
        user_id=user.id,
        action="LOGIN_SUCCESS",
        entity_type="User",
        entity_id=user.id,
        details=f"User '{user.username}' logged in successfully",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()

    user_response = UserResponse.model_validate(user)
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        user=user_response,
    )


@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    """Refresh an access token using a valid refresh token."""
    new_access_token = refresh_access_token(body.refresh_token)
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's info."""
    return UserResponse.model_validate(current_user)

@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the password for the currently authenticated user."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    
    current_user.hashed_password = get_password_hash(body.new_password)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="PASSWORD_CHANGED",
        entity_type="User",
        entity_id=current_user.id,
        details="User changed their password",
    )
    db.add(audit)
    db.commit()
    
    return {"detail": "Password updated successfully"}
