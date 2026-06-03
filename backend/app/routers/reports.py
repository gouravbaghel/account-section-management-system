"""
Report generation routes with JSON and CSV output.
"""
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, require_role
from app.models.user import User, UserRole
from app.services.reports import (
    get_daily_collection,
    get_monthly_collection,
    get_student_dues,
    get_course_wise_collection,
    get_payment_mode_report,
    get_expense_report,
    get_scholarship_report,
    get_profit_loss,
    generate_csv,
)

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# Column definitions for CSV export per report type
_CSV_COLUMNS = {
    "daily_collection": [
        "receipt_number", "student_name", "roll_number",
        "amount", "payment_mode", "transaction_id", "payment_date",
    ],
    "monthly_collection": ["date", "total", "count"],
    "student_dues": [
        "student_id", "student_name", "roll_number",
        "course_name", "total_due", "total_paid", "balance",
    ],
    "course_collection": [
        "course_id", "course_name", "total_amount", "total_payments",
    ],
    "payment_mode": ["payment_mode", "total_amount", "total_payments"],
    "expense": ["category", "total_amount", "count"],
    "scholarship": [
        "student_id", "student_name", "roll_number",
        "scholarship_amount", "discount_amount",
    ],
    "profit_loss": [
        "total_income", "total_expenses", "net_balance",
    ],
}


@router.get("/{report_type}")
def generate_report(
    report_type: str,
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
    format: str = Query("json", regex="^(json|csv)$", description="Output format"),
    course_id: Optional[int] = Query(None, description="Course filter"),
    batch: Optional[str] = Query(None, description="Batch filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant)),
):
    """
    Generate a report of the specified type.
    Supported types: daily_collection, monthly_collection, student_dues,
    course_collection, payment_mode, expense, scholarship, profit_loss.
    Returns JSON by default, or CSV if format=csv.
    Requires accountant+ role.
    """
    if report_type == "daily_collection":
        target_date = date_from or date.today()
        data = get_daily_collection(db, target_date)
        if format == "csv":
            return generate_csv(data, _CSV_COLUMNS["daily_collection"])
        return {
            "report_type": "daily_collection",
            "date": str(target_date),
            "total_amount": sum(item["amount"] for item in data),
            "total_payments": len(data),
            "payments": data,
        }

    elif report_type == "monthly_collection":
        if date_from:
            year, month = date_from.year, date_from.month
        else:
            today = date.today()
            year, month = today.year, today.month
        data = get_monthly_collection(db, year, month)
        if format == "csv":
            return generate_csv(data.get("daily_breakdown", []), _CSV_COLUMNS["monthly_collection"])
        return {"report_type": "monthly_collection", **data}

    elif report_type == "student_dues":
        data = get_student_dues(db, course_id=course_id, batch=batch)
        if format == "csv":
            return generate_csv(data, _CSV_COLUMNS["student_dues"])
        return {
            "report_type": "student_dues",
            "total_students": len(data),
            "total_balance": sum(item["balance"] for item in data),
            "students": data,
        }

    elif report_type == "course_collection":
        data = get_course_wise_collection(db, date_from=date_from, date_to=date_to)
        if format == "csv":
            return generate_csv(data, _CSV_COLUMNS["course_collection"])
        return {
            "report_type": "course_collection",
            "total_amount": sum(item["total_amount"] for item in data),
            "courses": data,
        }

    elif report_type == "payment_mode":
        data = get_payment_mode_report(db, date_from=date_from, date_to=date_to)
        if format == "csv":
            return generate_csv(data, _CSV_COLUMNS["payment_mode"])
        return {
            "report_type": "payment_mode",
            "total_amount": sum(item["total_amount"] for item in data),
            "modes": data,
        }

    elif report_type == "expense":
        data = get_expense_report(db, date_from=date_from, date_to=date_to)
        if format == "csv":
            return generate_csv(data, _CSV_COLUMNS["expense"])
        return {
            "report_type": "expense",
            "total_amount": sum(item["total_amount"] for item in data),
            "categories": data,
        }

    elif report_type == "scholarship":
        data = get_scholarship_report(db, course_id=course_id, batch=batch)
        if format == "csv":
            return generate_csv(data, _CSV_COLUMNS["scholarship"])
        return {
            "report_type": "scholarship",
            "total_students": len(data),
            "total_scholarship": sum(item["scholarship_amount"] for item in data),
            "total_discount": sum(item["discount_amount"] for item in data),
            "students": data,
        }

    elif report_type == "profit_loss":
        data = get_profit_loss(db, date_from=date_from, date_to=date_to)
        if format == "csv":
            # Flatten for CSV
            flat = [{
                "total_income": data["total_income"],
                "total_expenses": data["total_expenses"],
                "net_balance": data["net_balance"],
            }]
            return generate_csv(flat, _CSV_COLUMNS["profit_loss"])
        return {"report_type": "profit_loss", **data}

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown report type: '{report_type}'. Supported types: "
                   "daily_collection, monthly_collection, student_dues, "
                   "course_collection, payment_mode, expense, scholarship, profit_loss",
        )
