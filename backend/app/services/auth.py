"""
Authentication service: user verification, token creation, token refresh.
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from jose import JWTError

from app.models.user import User
from app.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticate a user by username and password.
    Returns the User object if credentials are valid, None otherwise.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_tokens(user: User) -> Dict[str, Any]:
    """
    Create access and refresh tokens for the given user.
    """
    token_data = {"sub": str(user.id), "username": user.username, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def refresh_access_token(refresh_token_str: str) -> Optional[str]:
    """
    Validate a refresh token and return a new access token.
    Returns None if the refresh token is invalid.
    """
    try:
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            return None
        token_data = {
            "sub": payload.get("sub"),
            "username": payload.get("username"),
            "role": payload.get("role"),
        }
        new_access_token = create_access_token(data=token_data)
        return new_access_token
    except JWTError:
        return None
