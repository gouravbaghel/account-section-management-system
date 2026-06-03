"""
Fee-related Pydantic schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.fee import FeeStatus


class FeeStructureCreate(BaseModel):
    course_id: int
    branch_id: Optional[int] = None
    semester: int = Field(..., ge=1, le=10)
    batch: str = Field(..., max_length=20)
    academic_year: str = Field(..., max_length=20)
    tuition_fee: float = Field(default=0, ge=0)
    exam_fee: float = Field(default=0, ge=0)
    library_fee: float = Field(default=0, ge=0)
    hostel_fee: float = Field(default=0, ge=0)
    transport_fee: float = Field(default=0, ge=0)
    lab_fee: float = Field(default=0, ge=0)
    admission_fee: float = Field(default=0, ge=0)
    misc_fee: float = Field(default=0, ge=0)
    installment_count: int = Field(default=1, ge=1)
    due_date: Optional[datetime] = None


class FeeStructureUpdate(BaseModel):
    course_id: Optional[int] = None
    branch_id: Optional[int] = None
    semester: Optional[int] = Field(None, ge=1, le=10)
    batch: Optional[str] = Field(None, max_length=20)
    academic_year: Optional[str] = Field(None, max_length=20)
    tuition_fee: Optional[float] = Field(None, ge=0)
    exam_fee: Optional[float] = Field(None, ge=0)
    library_fee: Optional[float] = Field(None, ge=0)
    hostel_fee: Optional[float] = Field(None, ge=0)
    transport_fee: Optional[float] = Field(None, ge=0)
    lab_fee: Optional[float] = Field(None, ge=0)
    admission_fee: Optional[float] = Field(None, ge=0)
    misc_fee: Optional[float] = Field(None, ge=0)
    installment_count: Optional[int] = Field(None, ge=1)
    due_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class FeeStructureResponse(BaseModel):
    id: int
    course_id: int
    branch_id: Optional[int] = None
    semester: int
    batch: str
    academic_year: str
    tuition_fee: float
    exam_fee: float
    library_fee: float
    hostel_fee: float
    transport_fee: float
    lab_fee: float
    admission_fee: float
    misc_fee: float
    total_amount: float
    installment_count: int
    due_date: Optional[datetime] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentFeeCreate(BaseModel):
    student_id: int
    fee_structure_id: int
    discount_amount: float = Field(default=0, ge=0)
    scholarship_amount: float = Field(default=0, ge=0)


class StudentFeeResponse(BaseModel):
    id: int
    student_id: int
    fee_structure_id: int
    total_amount: float
    paid_amount: float
    discount_amount: float
    scholarship_amount: float
    balance: float
    status: FeeStatus
    academic_year: str
    due_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssignFeeRequest(BaseModel):
    student_ids: List[int]
    fee_structure_id: int
    discount_amount: float = Field(default=0, ge=0)
    scholarship_amount: float = Field(default=0, ge=0)
