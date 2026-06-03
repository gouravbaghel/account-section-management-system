"""
Report-related Pydantic schemas.
"""
from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class ReportFilter(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    format: str = Field(default="json", pattern="^(json|csv)$")
    course_id: Optional[int] = None
    batch: Optional[str] = None


class DailyCollectionReport(BaseModel):
    date: date
    total_amount: float
    total_payments: int
    payments: List[Any] = []


class MonthlyCollectionReport(BaseModel):
    year: int
    month: int
    total_amount: float
    total_payments: int
    daily_breakdown: List[Any] = []


class StudentDuesReport(BaseModel):
    student_id: int
    student_name: str
    roll_number: str
    course_name: str
    total_due: float
    total_paid: float
    balance: float


class CourseCollectionReport(BaseModel):
    course_id: int
    course_name: str
    total_amount: float
    total_payments: int


class PaymentModeReport(BaseModel):
    payment_mode: str
    total_amount: float
    total_payments: int


class ExpenseReportItem(BaseModel):
    category: str
    total_amount: float
    count: int


class ScholarshipReportItem(BaseModel):
    student_id: int
    student_name: str
    roll_number: str
    scholarship_amount: float
    discount_amount: float


class ProfitLossReport(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    income_breakdown: List[Any] = []
    expense_breakdown: List[Any] = []
