"""
Dashboard service: statistics and chart data for the main dashboard.
"""
from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from decimal import Decimal

from app.models.student import Student, StudentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.expense import Expense
from app.models.fee import StudentFee, FeeStatus


def _decimal_to_float(val: Any) -> float:
    """Safely convert Decimal/None to float."""
    if val is None:
        return 0.0
    if isinstance(val, Decimal):
        return float(val)
    return float(val)


def get_dashboard_stats(db: Session) -> Dict[str, Any]:
    """
    Get summary statistics for the dashboard:
    - Total active students
    - Total collected amount
    - Total pending dues
    - Today's collection
    """
    total_students = db.query(func.count(Student.id)).filter(
        Student.status == StudentStatus.active
    ).scalar() or 0

    total_collected = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.completed
    ).scalar()
    total_collected = _decimal_to_float(total_collected)

    pending_dues = db.query(func.sum(StudentFee.balance)).filter(
        StudentFee.status.in_([FeeStatus.pending, FeeStatus.partial, FeeStatus.overdue])
    ).scalar()
    pending_dues = _decimal_to_float(pending_dues)

    today = date.today()
    today_collection = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.completed,
        Payment.payment_date == today,
    ).scalar()
    today_collection = _decimal_to_float(today_collection)

    total_expenses = db.query(func.sum(Expense.amount)).scalar()
    total_expenses = _decimal_to_float(total_expenses)

    return {
        "total_students": total_students,
        "total_collected": total_collected,
        "pending_dues": pending_dues,
        "today_collection": today_collection,
        "total_expenses": total_expenses,
        "net_balance": total_collected - total_expenses,
    }


def get_dashboard_charts(db: Session) -> Dict[str, Any]:
    """
    Get chart data for the dashboard:
    - Monthly collections over the last 12 months
    - Expense breakdown by category
    - Recent 10 payments
    - Top 10 students with the highest outstanding balance
    """
    today = date.today()
    twelve_months_ago = today - timedelta(days=365)

    # Monthly collections (last 12 months)
    monthly_data = (
        db.query(
            extract("year", Payment.payment_date).label("year"),
            extract("month", Payment.payment_date).label("month"),
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count"),
        )
        .filter(
            Payment.status == PaymentStatus.completed,
            Payment.payment_date >= twelve_months_ago,
        )
        .group_by(
            extract("year", Payment.payment_date),
            extract("month", Payment.payment_date),
        )
        .order_by(
            extract("year", Payment.payment_date),
            extract("month", Payment.payment_date),
        )
        .all()
    )
    monthly_collections = [
        {
            "year": int(row.year),
            "month": int(row.month),
            "total": _decimal_to_float(row.total),
            "count": row.count,
        }
        for row in monthly_data
    ]

    # Expense by category
    expense_data = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("count"),
        )
        .group_by(Expense.category)
        .all()
    )
    expense_by_category = [
        {
            "category": row.category.value if hasattr(row.category, "value") else str(row.category),
            "total": _decimal_to_float(row.total),
            "count": row.count,
        }
        for row in expense_data
    ]

    # Recent 10 payments
    recent_payments_data = (
        db.query(Payment)
        .filter(Payment.status == PaymentStatus.completed)
        .order_by(Payment.created_at.desc())
        .limit(10)
        .all()
    )
    recent_payments = [
        {
            "id": p.id,
            "receipt_number": p.receipt_number,
            "student_name": p.student.name if p.student else "Unknown",
            "amount": _decimal_to_float(p.amount),
            "payment_mode": p.payment_mode.value if hasattr(p.payment_mode, "value") else str(p.payment_mode),
            "payment_date": str(p.payment_date),
        }
        for p in recent_payments_data
    ]

    # Top 10 students with highest balance
    top_dues_data = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_number,
            func.sum(StudentFee.balance).label("total_balance"),
        )
        .join(StudentFee, Student.id == StudentFee.student_id)
        .filter(StudentFee.balance > 0)
        .group_by(Student.id, Student.name, Student.roll_number)
        .order_by(func.sum(StudentFee.balance).desc())
        .limit(10)
        .all()
    )
    top_dues = [
        {
            "student_id": row.id,
            "student_name": row.name,
            "roll_number": row.roll_number,
            "total_balance": _decimal_to_float(row.total_balance),
        }
        for row in top_dues_data
    ]

    return {
        "monthly_collections": monthly_collections,
        "expense_by_category": expense_by_category,
        "recent_payments": recent_payments,
        "top_dues": top_dues,
    }
