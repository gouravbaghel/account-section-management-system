"""
Student Authentication Pydantic schemas.
"""
from typing import Optional
from pydantic import BaseModel
from app.schemas.student import StudentResponse


class StudentLoginRequest(BaseModel):
    admission_number: str
    password: str


class StudentTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    student: StudentResponse


class StudentSetPasswordRequest(BaseModel):
    new_password: str
