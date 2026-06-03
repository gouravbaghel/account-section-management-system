from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class NOCRequestCreate(BaseModel):
    student_id: int
    purpose: str = Field(..., max_length=200)
    status: str = Field(default="pending", max_length=20)


class NOCRequestUpdate(BaseModel):
    purpose: Optional[str] = Field(None, max_length=200)
    status: Optional[str] = Field(None, max_length=20)
    approved_by: Optional[int] = None
    remarks: Optional[str] = None


class NOCRequestResponse(BaseModel):
    id: int
    student_id: int
    purpose: str
    status: str
    approved_by: Optional[int] = None
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
