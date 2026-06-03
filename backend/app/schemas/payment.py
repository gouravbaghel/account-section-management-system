"""
Payment-related Pydantic schemas.
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.payment import PaymentMode, PaymentStatus


class PaymentCreate(BaseModel):
    student_id: int
    student_fee_id: int
    amount: float = Field(..., gt=0)
    payment_mode: PaymentMode
    transaction_id: Optional[str] = Field(None, max_length=100)
    cheque_number: Optional[str] = Field(None, max_length=50)
    payment_date: date
    late_fine: float = Field(default=0, ge=0)
    discount: float = Field(default=0, ge=0)
    scholarship_adjustment: float = Field(default=0, ge=0)
    remarks: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    student_id: int
    student_fee_id: int
    student_name: Optional[str] = None
    receipt_number: str
    amount: float
    payment_mode: PaymentMode
    transaction_id: Optional[str] = None
    cheque_number: Optional[str] = None
    payment_date: date
    late_fine: float
    discount: float
    scholarship_adjustment: float
    remarks: Optional[str] = None
    status: PaymentStatus
    created_by: int
    cancelled_by: Optional[int] = None
    cancellation_reason: Optional[str] = None
    cancellation_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CancelPaymentRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    page: int
    size: int
