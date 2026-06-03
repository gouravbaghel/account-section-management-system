from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class LoanInstallmentBase(BaseModel):
    amount: float = Field(..., ge=0)
    due_date: date
    status: str = Field(default="pending", max_length=20)


class LoanInstallmentCreate(LoanInstallmentBase):
    pass


class LoanInstallmentResponse(LoanInstallmentBase):
    id: int
    loan_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EducationLoanCreate(BaseModel):
    student_id: int
    bank_name: str = Field(..., max_length=100)
    branch: Optional[str] = Field(None, max_length=100)
    account_number: Optional[str] = Field(None, max_length=50)
    total_amount: float = Field(..., ge=0)
    academic_year: str = Field(..., max_length=20)
    status: str = Field(default="approved", max_length=20)
    remarks: Optional[str] = None


class EducationLoanUpdate(BaseModel):
    bank_name: Optional[str] = Field(None, max_length=100)
    branch: Optional[str] = Field(None, max_length=100)
    account_number: Optional[str] = Field(None, max_length=50)
    total_amount: Optional[float] = Field(None, ge=0)
    academic_year: Optional[str] = Field(None, max_length=20)
    status: Optional[str] = Field(None, max_length=20)
    remarks: Optional[str] = None


class EducationLoanResponse(BaseModel):
    id: int
    student_id: int
    bank_name: str
    branch: Optional[str] = None
    account_number: Optional[str] = None
    total_amount: float
    academic_year: str
    status: str
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
