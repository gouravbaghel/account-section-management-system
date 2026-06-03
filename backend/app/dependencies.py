"""
FastAPI dependencies: database session, authentication, authorization, pagination.
"""
from typing import List, Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import decode_token

security_scheme = HTTPBearer()


def get_db():
    """Yield a database session and ensure it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the JWT token from the Authorization header and return the
    corresponding active User. Raises 401 if token is invalid or user
    is inactive.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: Optional[int] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_role(*allowed_roles: UserRole):
    """
    Return a dependency that checks whether the current user has one of
    the specified roles. The role hierarchy is:
    super_admin > admin > accountant > clerk
    auditor has special read-only access.
    """
    # Define role hierarchy for comparison
    role_hierarchy = {
        UserRole.super_admin: 0,
        UserRole.admin: 1,
        UserRole.accountant: 2,
        UserRole.clerk: 3,
        UserRole.auditor: 4,
    }

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role in allowed_roles:
            return current_user
        # Also allow higher-privilege roles (except auditor which is special)
        if current_user.role != UserRole.auditor:
            user_level = role_hierarchy.get(current_user.role, 99)
            for role in allowed_roles:
                if role != UserRole.auditor and role_hierarchy.get(role, 99) >= user_level:
                    return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required role: {', '.join(r.value for r in allowed_roles)}",
        )

    return role_checker


class PaginationParams:
    """Query parameters for paginated list endpoints."""

    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number"),
        size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size
