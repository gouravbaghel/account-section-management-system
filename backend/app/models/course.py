"""
Course and Branch models.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    duration_years = Column(Integer, nullable=False, default=4)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branches = relationship("Branch", back_populates="course", lazy="joined")
    students = relationship("Student", back_populates="course")
    fee_structures = relationship("FeeStructure", back_populates="course")

    def __repr__(self) -> str:
        return f"<Course(id={self.id}, code='{self.code}', name='{self.name}')>"


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('name', 'course_id', name='uq_branch_name_course_id'),
    )

    course = relationship("Course", back_populates="branches")
    fee_structures = relationship("FeeStructure", back_populates="branch")

    def __repr__(self) -> str:
        return f"<Branch(id={self.id}, name='{self.name}')>"
