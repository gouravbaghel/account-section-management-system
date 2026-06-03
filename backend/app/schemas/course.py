"""
Course and Branch Pydantic schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BranchCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    course_id: int
    is_active: bool = True


class BranchUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class BranchResponse(BaseModel):
    id: int
    name: str
    course_id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    duration_years: int = Field(..., ge=1, le=6)
    is_active: bool = True


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    duration_years: Optional[int] = Field(None, ge=1, le=6)
    is_active: Optional[bool] = None


class CourseResponse(BaseModel):
    id: int
    name: str
    code: str
    duration_years: int
    is_active: bool
    created_at: Optional[datetime] = None
    branches: List[BranchResponse] = []

    class Config:
        from_attributes = True
