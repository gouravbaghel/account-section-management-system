"""
Reports service: data retrieval and CSV generation for various report types.
"""
import csv
import io
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from fastapi.responses import StreamingResponse

from app.models.payment import Payment, PaymentStatus, PaymentMode
from app.models.student import Student
from app.models.fee import StudentFee, FeeStructure, FeeStatus
from app.models.course import Course
from app.models.expense import Expense


def _decimal_to_float(val: Any) -> float:
    if val is None:
        return 0.0
    if isinstance(val, Decimal):
        return float(val)
    return float(val)


def get_daily_collection(db: Session, target_date: date) -> List[Dict[str, Any]]:
    """Get all completed payments for a specific date."""
    payments = (
        db.query(Payment)
        .join(Student, Payment.student_id == Student.id)
        .filter(
            Payment.payment_date == target_date,
            Payment.status == PaymentStatus.completed,
        )
        .order_by(Payment.created_at.desc())
        .all()
    )
    results = []
    for p in payments:
        results.append({
            "receipt_number": p.receipt_number,
            "student_name": p.student.name if p.student else "Unknown",
            "roll_number": p.student.roll_number if p.student else "",
            "amount": _decimal_to_float(p.amount),
            "payment_mode": p.payment_mode.value if hasattr(p.payment_mode, "value") else str(p.payment_mode),
            "transaction_id": p.transaction_id or "",
            "payment_date": str(p.payment_date),
        })
    return results


def get_monthly_collection(db: Session, year: int, month: int) -> Dict[str, Any]:
    """Get aggregated collection data for a specific month."""
    payments = (
        db.query(
            Payment.payment_date,
            func.sum(Payment.amount).label("total"),
            func.count(Payment.id).label("count"),
        )
        .filter(
            extract("year", Payment.payment_date) == year,
            extract("month", Payment.payment_date) == month,
            Payment.status == PaymentStatus.completed,
        )
        .group_by(Payment.payment_date)
        .order_by(Payment.payment_date)
        .all()
    )

    daily_breakdown = [
        {
            "date": str(row.payment_date),
            "total": _decimal_to_float(row.total),
            "count": row.count,
        }
        for row in payments
    ]

    total_amount = sum(d["total"] for d in daily_breakdown)
    total_payments = sum(d["count"] for d in daily_breakdown)

    return {
        "year": year,
        "month": month,
        "total_amount": total_amount,
        "total_payments": total_payments,
        "daily_breakdown": daily_breakdown,
    }


def get_student_dues(
    db: Session,
    course_id: Optional[int] = None,
    batch: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Get students with pending dues."""
    query = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_number,
            Course.name.label("course_name"),
            func.sum(StudentFee.total_amount).label("total_due"),
            func.sum(StudentFee.paid_amount).label("total_paid"),
            func.sum(StudentFee.balance).label("balance"),
        )
        .join(StudentFee, Student.id == StudentFee.student_id)
        .join(Course, Student.course_id == Course.id)
        .filter(StudentFee.balance > 0)
    )

    if course_id:
        query = query.filter(Student.course_id == course_id)
    if batch:
        query = query.filter(Student.batch == batch)

    query = query.group_by(Student.id, Student.name, Student.roll_number, Course.name)
    query = query.order_by(func.sum(StudentFee.balance).desc())

    results = query.all()
    return [
        {
            "student_id": row.id,
            "student_name": row.name,
            "roll_number": row.roll_number,
            "course_name": row.course_name,
            "total_due": _decimal_to_float(row.total_due),
            "total_paid": _decimal_to_float(row.total_paid),
            "balance": _decimal_to_float(row.balance),
        }
        for row in results
    ]


def get_course_wise_collection(
    db: Session,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """Get payment collection grouped by course."""
    query = (
        db.query(
            Course.id.label("course_id"),
            Course.name.label("course_name"),
            func.sum(Payment.amount).label("total_amount"),
            func.count(Payment.id).label("total_payments"),
        )
        .join(Student, Payment.student_id == Student.id)
        .join(Course, Student.course_id == Course.id)
        .filter(Payment.status == PaymentStatus.completed)
    )

    if date_from:
        query = query.filter(Payment.payment_date >= date_from)
    if date_to:
        query = query.filter(Payment.payment_date <= date_to)

    query = query.group_by(Course.id, Course.name).order_by(func.sum(Payment.amount).desc())
    results = query.all()

    return [
        {
            "course_id": row.course_id,
            "course_name": row.course_name,
            "total_amount": _decimal_to_float(row.total_amount),
            "total_payments": row.total_payments,
        }
        for row in results
    ]


def get_payment_mode_report(
    db: Session,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """Get payment collection grouped by payment mode."""
    query = (
        db.query(
            Payment.payment_mode,
            func.sum(Payment.amount).label("total_amount"),
            func.count(Payment.id).label("total_payments"),
        )
        .filter(Payment.status == PaymentStatus.completed)
    )

    if date_from:
        query = query.filter(Payment.payment_date >= date_from)
    if date_to:
        query = query.filter(Payment.payment_date <= date_to)

    query = query.group_by(Payment.payment_mode)
    results = query.all()

    return [
        {
            "payment_mode": row.payment_mode.value if hasattr(row.payment_mode, "value") else str(row.payment_mode),
            "total_amount": _decimal_to_float(row.total_amount),
            "total_payments": row.total_payments,
        }
        for row in results
    ]


def get_expense_report(
    db: Session,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> List[Dict[str, Any]]:
    """Get expenses grouped by category."""
    query = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total_amount"),
            func.count(Expense.id).label("count"),
        )
    )

    if date_from:
        query = query.filter(Expense.expense_date >= date_from)
    if date_to:
        query = query.filter(Expense.expense_date <= date_to)

    query = query.group_by(Expense.category)
    results = query.all()

    return [
        {
            "category": row.category.value if hasattr(row.category, "value") else str(row.category),
            "total_amount": _decimal_to_float(row.total_amount),
            "count": row.count,
        }
        for row in results
    ]


def get_scholarship_report(
    db: Session,
    course_id: Optional[int] = None,
    batch: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Get scholarship and discount data for students."""
    query = (
        db.query(
            Student.id,
            Student.name,
            Student.roll_number,
            func.sum(StudentFee.scholarship_amount).label("scholarship_amount"),
            func.sum(StudentFee.discount_amount).label("discount_amount"),
        )
        .join(StudentFee, Student.id == StudentFee.student_id)
        .filter(
            (StudentFee.scholarship_amount > 0) | (StudentFee.discount_amount > 0)
        )
    )

    if course_id:
        query = query.filter(Student.course_id == course_id)
    if batch:
        query = query.filter(Student.batch == batch)

    query = query.group_by(Student.id, Student.name, Student.roll_number)
    results = query.all()

    return [
        {
            "student_id": row.id,
            "student_name": row.name,
            "roll_number": row.roll_number,
            "scholarship_amount": _decimal_to_float(row.scholarship_amount),
            "discount_amount": _decimal_to_float(row.discount_amount),
        }
        for row in results
    ]


def get_profit_loss(
    db: Session,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Dict[str, Any]:
    """Get income vs expenses summary."""
    # Income
    income_query = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.completed,
    )
    if date_from:
        income_query = income_query.filter(Payment.payment_date >= date_from)
    if date_to:
        income_query = income_query.filter(Payment.payment_date <= date_to)
    total_income = _decimal_to_float(income_query.scalar())

    # Expenses
    expense_query = db.query(func.sum(Expense.amount))
    if date_from:
        expense_query = expense_query.filter(Expense.expense_date >= date_from)
    if date_to:
        expense_query = expense_query.filter(Expense.expense_date <= date_to)
    total_expenses = _decimal_to_float(expense_query.scalar())

    # Income breakdown by course
    income_by_course = get_course_wise_collection(db, date_from, date_to)

    # Expense breakdown by category
    expense_by_category = get_expense_report(db, date_from, date_to)

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_balance": total_income - total_expenses,
        "income_breakdown": income_by_course,
        "expense_breakdown": expense_by_category,
    }


def generate_csv(data: List[Dict[str, Any]], columns: List[str]) -> StreamingResponse:
    """Generate a CSV file as a StreamingResponse."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for row in data:
        writer.writerow(row)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"},
    )


def generate_excel(data: List[Dict[str, Any]], columns: List[str], sheet_name: str = "Report") -> StreamingResponse:
    """Generate an Excel file as a StreamingResponse using pandas."""
    import pandas as pd
    
    df = pd.DataFrame(data)
    if not df.empty and columns:
        # Reorder columns and drop missing ones
        available_cols = [c for c in columns if c in df.columns]
        df = df[available_cols]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={sheet_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"},
    )
