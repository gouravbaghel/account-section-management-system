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


def authenticate_student(db: Session, admission_number: str, password: str):
    """
    Authenticate a student by admission_number and password.
    """
    from app.models.student import Student
    student = db.query(Student).filter(Student.admission_number == admission_number).first()
    if not student:
        return None
    if student.is_locked:
        return None
    if not student.hashed_password:
        return None
    if not verify_password(password, student.hashed_password):
        return None
    return student


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


def create_student_tokens(student) -> Dict[str, Any]:
    """
    Create access and refresh tokens for a student.
    """
    token_data = {"sub": str(student.id), "username": student.admission_number, "role": "student"}
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
