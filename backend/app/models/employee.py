"""
Employee, Salary, and Claim models.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ClaimType(str, enum.Enum):
    medical = "medical"
    ta_da = "ta_da"
    other = "other"


class ClaimStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    processed = "processed"


class SalaryStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    base_salary = Column(Numeric(12, 2), nullable=False)
    bank_details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    salaries = relationship("Salary", back_populates="employee")
    claims = relationship("Claim", back_populates="employee")

    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, user_id={self.user_id}, designation='{self.designation}')>"


class Salary(Base):
    __tablename__ = "salaries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(SalaryStatus), nullable=False, default=SalaryStatus.pending)
    processed_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee = relationship("Employee", back_populates="salaries")

    def __repr__(self) -> str:
        return f"<Salary(id={self.id}, employee_id={self.employee_id}, period='{self.month}/{self.year}')>"


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    claim_type = Column(Enum(ClaimType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(ClaimStatus), nullable=False, default=ClaimStatus.pending)
    documents = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee = relationship("Employee", back_populates="claims")
    approver = relationship("User")

    def __repr__(self) -> str:
        return f"<Claim(id={self.id}, employee_id={self.employee_id}, type='{self.claim_type}')>"
