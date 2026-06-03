"""
Fee structure and student fee assignment models.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FeeStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    paid = "paid"
    overdue = "overdue"


class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True, index=True)
    semester = Column(Integer, nullable=False)
    batch = Column(String(20), nullable=False)
    academic_year = Column(String(20), nullable=False)
    tuition_fee = Column(Numeric(12, 2), nullable=False, default=0)
    exam_fee = Column(Numeric(12, 2), nullable=False, default=0)
    library_fee = Column(Numeric(12, 2), nullable=False, default=0)
    hostel_fee = Column(Numeric(12, 2), nullable=False, default=0)
    transport_fee = Column(Numeric(12, 2), nullable=False, default=0)
    lab_fee = Column(Numeric(12, 2), nullable=False, default=0)
    admission_fee = Column(Numeric(12, 2), nullable=False, default=0)
    misc_fee = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    installment_count = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="fee_structures")
    branch = relationship("Branch", back_populates="fee_structures")
    student_fees = relationship("StudentFee", back_populates="fee_structure")

    def compute_total(self) -> float:
        """Compute total amount from individual fee components."""
        return float(
            (self.tuition_fee or 0) +
            (self.exam_fee or 0) +
            (self.library_fee or 0) +
            (self.hostel_fee or 0) +
            (self.transport_fee or 0) +
            (self.lab_fee or 0) +
            (self.admission_fee or 0) +
            (self.misc_fee or 0)
        )

    def __repr__(self) -> str:
        return f"<FeeStructure(id={self.id}, course_id={self.course_id}, semester={self.semester})>"


class StudentFee(Base):
    __tablename__ = "student_fees"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"), nullable=False, index=True)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    paid_amount = Column(Numeric(12, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)
    scholarship_amount = Column(Numeric(12, 2), nullable=False, default=0)
    balance = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(Enum(FeeStatus), nullable=False, default=FeeStatus.pending)
    academic_year = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student", back_populates="student_fees")
    fee_structure = relationship("FeeStructure", back_populates="student_fees")
    payments = relationship("Payment", back_populates="student_fee")

    def compute_balance(self) -> float:
        """Compute balance = total - paid - discount - scholarship."""
        return float(
            (self.total_amount or 0) -
            (self.paid_amount or 0) -
            (self.discount_amount or 0) -
            (self.scholarship_amount or 0)
        )

    def __repr__(self) -> str:
        return f"<StudentFee(id={self.id}, student_id={self.student_id}, status='{self.status}')>"
