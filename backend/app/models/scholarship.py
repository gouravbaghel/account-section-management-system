"""
Scholarship model.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ScholarshipStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    amount_requested = Column(Numeric(12, 2), nullable=False)
    amount_approved = Column(Numeric(12, 2), nullable=True)
    status = Column(Enum(ScholarshipStatus), nullable=False, default=ScholarshipStatus.pending)
    documents_url = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student")
    reviewer = relationship("User")

    def __repr__(self) -> str:
        return f"<Scholarship(id={self.id}, student_id={self.student_id}, status='{self.status}')>"
