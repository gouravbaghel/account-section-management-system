"""
Student-related Pydantic schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.student import StudentStatus, StudentCategory


class StudentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    roll_number: str = Field(..., min_length=1, max_length=50)
    admission_number: str = Field(..., min_length=1, max_length=50)
    course_id: int
    branch: str = Field(..., min_length=1, max_length=100)
    semester: int = Field(..., ge=1, le=10)
    batch: str = Field(..., max_length=20)
    phone: str = Field(..., max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    guardian_name: str = Field(..., min_length=1, max_length=100)
    guardian_phone: str = Field(..., max_length=20)
    category: StudentCategory = StudentCategory.general
    status: StudentStatus = StudentStatus.active


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    roll_number: Optional[str] = Field(None, max_length=50)
    admission_number: Optional[str] = Field(None, max_length=50)
    course_id: Optional[int] = None
    branch: Optional[str] = Field(None, max_length=100)
    semester: Optional[int] = Field(None, ge=1, le=10)
    batch: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = None
    guardian_name: Optional[str] = Field(None, max_length=100)
    guardian_phone: Optional[str] = Field(None, max_length=20)
    category: Optional[StudentCategory] = None
    status: Optional[StudentStatus] = None


class StudentResponse(BaseModel):
    id: int
    name: str
    roll_number: str
    admission_number: str
    course_id: int
    course_name: Optional[str] = None
    branch: str
    semester: int
    batch: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    guardian_name: str
    guardian_phone: str
    category: StudentCategory
    status: StudentStatus
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    items: List[StudentResponse]
    total: int
    page: int
    size: int
