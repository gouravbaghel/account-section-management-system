"""
Education Loan model.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class LoanStatus(str, enum.Enum):
    active = "active"
    closed = "closed"
    defaulted = "defaulted"


class InstallmentStatus(str, enum.Enum):
    pending = "pending"
    received = "received"
    delayed = "delayed"


class EducationLoan(Base):
    __tablename__ = "education_loans"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    bank_name = Column(String(200), nullable=False)
    loan_amount = Column(Numeric(12, 2), nullable=False)
    disbursed_amount = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(Enum(LoanStatus), nullable=False, default=LoanStatus.active)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student")
    installments = relationship("LoanInstallment", back_populates="loan")

    def __repr__(self) -> str:
        return f"<EducationLoan(id={self.id}, student_id={self.student_id}, bank='{self.bank_name}')>"


class LoanInstallment(Base):
    __tablename__ = "loan_installments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("education_loans.id"), nullable=False, index=True)
    expected_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(InstallmentStatus), nullable=False, default=InstallmentStatus.pending)
    received_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    loan = relationship("EducationLoan", back_populates="installments")
