"""
Expense-related Pydantic schemas.
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.expense import ExpenseCategory


class ExpenseCreate(BaseModel):
    category: ExpenseCategory
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    vendor_name: str = Field(..., min_length=1, max_length=200)
    payment_mode: str = Field(..., max_length=20)
    bill_number: Optional[str] = Field(None, max_length=100)
    expense_date: date
    remarks: Optional[str] = None


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    vendor_name: Optional[str] = Field(None, max_length=200)
    payment_mode: Optional[str] = Field(None, max_length=20)
    bill_number: Optional[str] = Field(None, max_length=100)
    expense_date: Optional[date] = None
    remarks: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    category: ExpenseCategory
    description: str
    amount: float
    vendor_name: str
    payment_mode: str
    bill_number: Optional[str] = None
    expense_date: date
    remarks: Optional[str] = None
    created_by: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    items: List[ExpenseResponse]
    total: int
    page: int
    size: int
