"""
Refund model.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RefundType(str, enum.Enum):
    caution_money = "caution_money"
    excess_fee = "excess_fee"
    course_withdrawal = "course_withdrawal"


class RefundStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    processed = "processed"


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    refund_type = Column(Enum(RefundType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(RefundStatus), nullable=False, default=RefundStatus.pending)
    remarks = Column(Text, nullable=True)
    processed_date = Column(Date, nullable=True)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student")
    processor = relationship("User")

    def __repr__(self) -> str:
        return f"<Refund(id={self.id}, student_id={self.student_id}, status='{self.status}')>"
