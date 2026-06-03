"""
Payment model — immutable financial records (cancel-only, no edit/delete).
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class PaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank_transfer = "bank_transfer"
    cheque = "cheque"
    card = "card"


class PaymentStatus(str, enum.Enum):
    completed = "completed"
    cancelled = "cancelled"
    reversed = "reversed"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    student_fee_id = Column(Integer, ForeignKey("student_fees.id"), nullable=False, index=True)
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_mode = Column(Enum(PaymentMode), nullable=False)
    transaction_id = Column(String(100), nullable=True)
    cheque_number = Column(String(50), nullable=True)
    payment_date = Column(Date, nullable=False)
    late_fine = Column(Numeric(12, 2), nullable=False, default=0)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    scholarship_adjustment = Column(Numeric(12, 2), nullable=False, default=0)
    remarks = Column(Text, nullable=True)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.completed)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancellation_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="payments", foreign_keys=[student_id])
    student_fee = relationship("StudentFee", back_populates="payments")
    creator = relationship("User", foreign_keys=[created_by])
    canceller = relationship("User", foreign_keys=[cancelled_by])

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, receipt='{self.receipt_number}', amount={self.amount})>"
