"""
Payment routes: list, record, cancel. Financial records are immutable — only cancellable.
"""
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, get_current_user, require_role, PaginationParams
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.fee import StudentFee, FeeStatus
from app.models.payment import Payment, PaymentMode, PaymentStatus
from app.models.settings import CollegeSettings
from app.models.audit import AuditLog
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentListResponse, CancelPaymentRequest

router = APIRouter(prefix="/api/payments", tags=["Payments"])


def _generate_receipt_number(db: Session) -> str:
    """Generate a unique receipt number from CollegeSettings counter."""
    settings_row = db.query(CollegeSettings).first()
    if not settings_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="College settings not configured. Please set up college settings first.",
        )

    prefix = settings_row.receipt_prefix or "NIT"
    counter = (settings_row.receipt_counter or 0) + 1
    year = datetime.now().year

    receipt_number = f"{prefix}-{year}-{counter:05d}"

    # Update counter
    settings_row.receipt_counter = counter
    db.flush()

    return receipt_number


def _update_student_fee_status(student_fee: StudentFee) -> None:
    """Update fee status based on paid vs total amounts."""
    balance = student_fee.compute_balance()
    student_fee.balance = balance

    if balance <= 0:
        student_fee.status = FeeStatus.paid
    elif float(student_fee.paid_amount or 0) > 0:
        student_fee.status = FeeStatus.partial
    else:
        student_fee.status = FeeStatus.pending


@router.get("/", response_model=PaymentListResponse)
def list_payments(
    student_id: Optional[int] = Query(None, description="Filter by student"),
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
    mode: Optional[PaymentMode] = Query(None, description="Payment mode"),
    payment_status: Optional[PaymentStatus] = Query(None, alias="status", description="Payment status"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant)),
):
    """List payments with filters and pagination. Requires accountant+ role."""
    query = db.query(Payment)

    if student_id is not None:
        query = query.filter(Payment.student_id == student_id)
    if date_from is not None:
        query = query.filter(Payment.payment_date >= date_from)
    if date_to is not None:
        query = query.filter(Payment.payment_date <= date_to)
    if mode is not None:
        query = query.filter(Payment.payment_mode == mode)
    if payment_status is not None:
        query = query.filter(Payment.status == payment_status)

    total = query.count()

    payments = (
        query
        .order_by(Payment.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    items = []
    for p in payments:
        resp = PaymentResponse.model_validate(p)
        if p.student:
            resp.student_name = p.student.name
        items.append(resp)

    return PaymentListResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_data: PaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant)),
):
    """
    Record a new payment. Generates receipt number from CollegeSettings.
    Updates StudentFee paid_amount and balance. Logs audit.
    Requires accountant+ role.
    """
    # Verify student exists
    student = db.query(Student).filter(Student.id == payment_data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {payment_data.student_id} not found",
        )

    # Verify student fee exists
    student_fee = db.query(StudentFee).filter(StudentFee.id == payment_data.student_fee_id).first()
    if not student_fee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student fee with id {payment_data.student_fee_id} not found",
        )

    # Verify the student fee belongs to the student
    if student_fee.student_id != payment_data.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student fee does not belong to the specified student",
        )

    # Check if fee is already fully paid
    if student_fee.status == FeeStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This fee has already been fully paid",
        )

    # Generate receipt number
    receipt_number = _generate_receipt_number(db)

    # Create payment
    payment = Payment(
        student_id=payment_data.student_id,
        student_fee_id=payment_data.student_fee_id,
        receipt_number=receipt_number,
        amount=payment_data.amount,
        payment_mode=payment_data.payment_mode,
        transaction_id=payment_data.transaction_id,
        cheque_number=payment_data.cheque_number,
        payment_date=payment_data.payment_date,
        late_fine=payment_data.late_fine,
        discount=payment_data.discount,
        scholarship_adjustment=payment_data.scholarship_adjustment,
        remarks=payment_data.remarks,
        status=PaymentStatus.completed,
        created_by=current_user.id,
    )
    db.add(payment)

    # Update student fee
    student_fee.paid_amount = float(student_fee.paid_amount or 0) + payment_data.amount
    _update_student_fee_status(student_fee)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="Payment",
        entity_id=None,  # Will update after flush
        details=f"Payment of ₹{payment_data.amount} recorded for student '{student.name}' (Receipt: {receipt_number})",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(payment)

    # Update audit entity_id
    audit.entity_id = payment.id
    db.commit()

    resp = PaymentResponse.model_validate(payment)
    resp.student_name = student.name
    return resp


@router.post("/{payment_id}/cancel", response_model=PaymentResponse)
def cancel_payment(
    payment_id: int,
    cancel_data: CancelPaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """
    Cancel a payment. Sets status=cancelled, reverses StudentFee balance.
    Requires admin+ role. Logs audit.
    """
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with id {payment_id} not found",
        )

    if payment.status != PaymentStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is already {payment.status.value}. Only completed payments can be cancelled.",
        )

    # Cancel the payment
    payment.status = PaymentStatus.cancelled
    payment.cancelled_by = current_user.id
    payment.cancellation_reason = cancel_data.reason
    payment.cancellation_date = datetime.now(timezone.utc)

    # Reverse the student fee paid amount
    student_fee = db.query(StudentFee).filter(StudentFee.id == payment.student_fee_id).first()
    if student_fee:
        student_fee.paid_amount = float(student_fee.paid_amount or 0) - float(payment.amount or 0)
        if student_fee.paid_amount < 0:
            student_fee.paid_amount = 0
        _update_student_fee_status(student_fee)

    # Audit log
    student = db.query(Student).filter(Student.id == payment.student_id).first()
    student_name = student.name if student else "Unknown"

    audit = AuditLog(
        user_id=current_user.id,
        action="CANCEL",
        entity_type="Payment",
        entity_id=payment.id,
        details=f"Payment #{payment.receipt_number} (₹{payment.amount}) cancelled. Reason: {cancel_data.reason}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(payment)

    resp = PaymentResponse.model_validate(payment)
    resp.student_name = student_name
    return resp
