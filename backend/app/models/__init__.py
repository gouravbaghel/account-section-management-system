"""
Models package — import all models so they are registered with Base.metadata.
"""
from app.models.user import User, UserRole
from app.models.course import Course, Branch
from app.models.student import Student, StudentStatus
from app.models.fee import FeeStructure, StudentFee, FeeStatus
from app.models.payment import Payment, PaymentMode, PaymentStatus
from app.models.expense import Expense, ExpenseCategory
from app.models.audit import AuditLog
from app.models.settings import CollegeSettings

__all__ = [
    "User", "UserRole",
    "Course", "Branch",
    "Student", "StudentStatus",
    "FeeStructure", "StudentFee", "FeeStatus",
    "Payment", "PaymentMode", "PaymentStatus",
    "Expense", "ExpenseCategory",
    "AuditLog",
    "CollegeSettings",
]
