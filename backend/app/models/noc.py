"""
NOC (No Dues) model.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class NOCStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class NOCRequest(Base):
    __tablename__ = "noc_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    status = Column(Enum(NOCStatus), nullable=False, default=NOCStatus.pending)
    library_dues = Column(Numeric(12, 2), nullable=False, default=0)
    hostel_dues = Column(Numeric(12, 2), nullable=False, default=0)
    fee_dues = Column(Numeric(12, 2), nullable=False, default=0)
    remarks = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student")
    approver = relationship("User")

    def __repr__(self) -> str:
        return f"<NOCRequest(id={self.id}, student_id={self.student_id}, status='{self.status}')>"
