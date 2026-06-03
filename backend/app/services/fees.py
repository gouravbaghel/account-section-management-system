"""
Fee service logic including Late Fee Automation Engine.
"""
import json
from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.fee import StudentFee
from app.models.settings import CollegeSettings


def calculate_late_fine(db: Session, student_fee: StudentFee, payment_date: date = None) -> Decimal:
    """
    Calculate late fine dynamically based on the due_date and settings.
    """
    if student_fee.due_date is None or float(student_fee.balance) <= 0:
        return Decimal("0.00")

    calc_date = payment_date or date.today()
    due_date = student_fee.due_date.date() if hasattr(student_fee.due_date, 'date') else student_fee.due_date

    if calc_date <= due_date:
        return Decimal("0.00")

    settings = db.query(CollegeSettings).first()
    if not settings:
        return Decimal("0.00")

    days_late = (calc_date - due_date).days
    
    if settings.late_fee_type == "daily":
        return Decimal(str(days_late * float(settings.late_fee_amount)))
    
    elif settings.late_fee_type == "weekly":
        weeks_late = (days_late + 6) // 7  # Ceiling division
        return Decimal(str(weeks_late * float(settings.late_fee_amount)))
        
    elif settings.late_fee_type == "slab":
        if not settings.late_fee_slabs:
            return settings.late_fee_amount
        try:
            # Expected format: [{"days": 7, "amount": 100}, {"days": 14, "amount": 250}, {"days": -1, "amount": 500}]
            slabs = json.loads(settings.late_fee_slabs)
            slabs.sort(key=lambda x: x["days"] if x["days"] != -1 else float('inf'))
            
            for slab in slabs:
                if slab["days"] == -1 or days_late <= slab["days"]:
                    return Decimal(str(slab["amount"]))
            
            return Decimal("0.00")
        except Exception:
            return settings.late_fee_amount
            
    # Default fallback
    return settings.late_fee_amount
