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
from app.models.scholarship import Scholarship, ScholarshipStatus
from app.models.loan import EducationLoan, LoanInstallment, LoanStatus, InstallmentStatus
from app.models.refund import Refund, RefundType, RefundStatus
from app.models.noc import NOCRequest, NOCStatus
from app.models.employee import Employee, Salary, Claim, ClaimType, ClaimStatus, SalaryStatus

__all__ = [
    "User", "UserRole",
    "Course", "Branch",
    "Student", "StudentStatus",
    "FeeStructure", "StudentFee", "FeeStatus",
    "Payment", "PaymentMode", "PaymentStatus",
    "Expense", "ExpenseCategory",
    "AuditLog",
    "CollegeSettings",
    "Scholarship", "ScholarshipStatus",
    "EducationLoan", "LoanInstallment", "LoanStatus", "InstallmentStatus",
    "Refund", "RefundType", "RefundStatus",
    "NOCRequest", "NOCStatus",
    "Employee", "Salary", "Claim", "ClaimType", "ClaimStatus", "SalaryStatus",
]
