from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class EmployeeCreate(BaseModel):
    employee_id: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    department: str = Field(..., max_length=100)
    designation: str = Field(..., max_length=100)
    basic_salary: float = Field(..., ge=0)
    bank_account_details: Optional[str] = Field(None, max_length=500)
    status: str = Field(default="active", max_length=20)


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    designation: Optional[str] = Field(None, max_length=100)
    basic_salary: Optional[float] = Field(None, ge=0)
    bank_account_details: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, max_length=20)


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    department: str
    designation: str
    basic_salary: float
    bank_account_details: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalaryCreate(BaseModel):
    employee_id: int
    month: str = Field(..., max_length=20)
    year: int
    basic_pay: float = Field(..., ge=0)
    allowances: float = Field(default=0, ge=0)
    deductions: float = Field(default=0, ge=0)
    status: str = Field(default="paid", max_length=20)


class SalaryUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=20)
    net_pay: Optional[float] = Field(None, ge=0)


class SalaryResponse(BaseModel):
    id: int
    employee_id: int
    month: str
    year: int
    basic_pay: float
    allowances: float
    deductions: float
    net_pay: float
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClaimCreate(BaseModel):
    employee_id: int
    claim_type: str = Field(..., max_length=100)
    amount: float = Field(..., ge=0)
    description: str = Field(..., max_length=500)
    status: str = Field(default="pending", max_length=20)


class ClaimUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=20)
    approved_by: Optional[int] = None


class ClaimResponse(BaseModel):
    id: int
    employee_id: int
    claim_type: str
    amount: float
    description: str
    status: str
    approved_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
