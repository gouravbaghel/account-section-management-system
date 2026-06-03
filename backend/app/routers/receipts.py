"""
Receipt PDF download route.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.models.student import Student
from app.models.fee import StudentFee, FeeStructure
from app.models.settings import CollegeSettings
from app.services.receipt_pdf import generate_receipt_pdf

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])


@router.get("/{payment_id}/pdf")
def download_receipt_pdf(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and download a PDF receipt for a payment."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with id {payment_id} not found",
        )

    student = db.query(Student).filter(Student.id == payment.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found for this payment",
        )

    # Get fee structure through student fee
    fee_structure = None
    student_fee = db.query(StudentFee).filter(StudentFee.id == payment.student_fee_id).first()
    if student_fee:
        fee_structure = db.query(FeeStructure).filter(FeeStructure.id == student_fee.fee_structure_id).first()

    college_settings = db.query(CollegeSettings).first()

    pdf_buffer = generate_receipt_pdf(
        payment=payment,
        student=student,
        fee_structure=fee_structure,
        college_settings=college_settings,
    )

    filename = f"receipt_{payment.receipt_number}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
