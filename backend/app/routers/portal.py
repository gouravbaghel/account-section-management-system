"""
Student Portal router for self-service operations.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.models.fee import StudentFee
from app.models.payment import Payment
from app.schemas.fee import StudentFeeResponse
from app.schemas.payment import PaymentResponse

router = APIRouter(prefix="/api/portal", tags=["Student Portal"])


@router.get("/fees", response_model=List[StudentFeeResponse])
def get_my_fees(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Get the fee structures and balances for the logged-in student."""
    fees = db.query(StudentFee).filter(StudentFee.student_id == student.id).all()
    return fees


@router.get("/payments", response_model=List[PaymentResponse])
def get_my_payments(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Get the payment history for the logged-in student."""
    payments = db.query(Payment).filter(
        Payment.student_id == student.id
    ).order_by(Payment.payment_date.desc()).all()
    
    # Attach student name manually since PaymentResponse requires it, 
    # but normally the ORM relationship does it. 
    # Because of our schema definition, we ensure it's there.
    for p in payments:
        p.student_name = student.name
    return payments
