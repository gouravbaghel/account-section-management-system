"""
Student model with status enum and relationships.
"""
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class StudentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    alumni = "alumni"


class StudentCategory(str, enum.Enum):
    general = "general"
    obc = "obc"
    sc = "sc"
    st = "st"
    ews = "ews"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    admission_number = Column(String(50), unique=True, index=True, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    branch = Column(String(100), nullable=False)
    semester = Column(Integer, nullable=False, default=1)
    batch = Column(String(20), index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    guardian_name = Column(String(100), nullable=False)
    guardian_phone = Column(String(20), nullable=False)
    category = Column(Enum(StudentCategory), nullable=False, default=StudentCategory.general)
    status = Column(Enum(StudentStatus), nullable=False, default=StudentStatus.active)
    hashed_password = Column(String(255), nullable=True)
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="students")
    student_fees = relationship("StudentFee", back_populates="student")
    payments = relationship("Payment", back_populates="student", foreign_keys="[Payment.student_id]")

    def __repr__(self) -> str:
        return f"<Student(id={self.id}, roll='{self.roll_number}', name='{self.name}')>"
