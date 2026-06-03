from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class RefundCreate(BaseModel):
    student_id: int
    amount: float = Field(..., ge=0)
    reason: str = Field(..., max_length=500)
    bank_account_details: Optional[str] = Field(None, max_length=500)
    status: str = Field(default="pending", max_length=20)


class RefundUpdate(BaseModel):
    amount: Optional[float] = Field(None, ge=0)
    reason: Optional[str] = Field(None, max_length=500)
    bank_account_details: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, max_length=20)
    approved_by: Optional[int] = None
    processed_date: Optional[date] = None


class RefundResponse(BaseModel):
    id: int
    student_id: int
    amount: float
    reason: str
    bank_account_details: Optional[str] = None
    status: str
    approved_by: Optional[int] = None
    processed_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
