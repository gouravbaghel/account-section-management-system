"""
College settings Pydantic schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CollegeSettingsUpdate(BaseModel):
    college_name: Optional[str] = Field(None, max_length=200)
    address: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    logo_path: Optional[str] = Field(None, max_length=500)
    academic_year: Optional[str] = Field(None, max_length=20)
    receipt_prefix: Optional[str] = Field(None, max_length=20)


class CollegeSettingsResponse(BaseModel):
    id: int
    college_name: str
    address: str
    phone: str
    email: str
    logo_path: Optional[str] = None
    academic_year: str
    receipt_prefix: str
    receipt_counter: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
