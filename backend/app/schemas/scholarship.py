from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class ScholarshipCreate(BaseModel):
    student_id: int
    name: str = Field(..., max_length=100)
    provider: str = Field(..., max_length=100)
    amount: float = Field(..., ge=0)
    academic_year: str = Field(..., max_length=20)
    status: str = Field(default="approved", max_length=20)
    remarks: Optional[str] = None


class ScholarshipUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    provider: Optional[str] = Field(None, max_length=100)
    amount: Optional[float] = Field(None, ge=0)
    academic_year: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=20)
    remarks: Optional[str] = None


class ScholarshipResponse(BaseModel):
    id: int
    student_id: int
    name: str
    provider: str
    amount: float
    academic_year: str
    status: str
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
