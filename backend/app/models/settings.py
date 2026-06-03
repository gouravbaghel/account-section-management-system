"""
College settings model — singleton configuration record.
"""
from sqlalchemy import Column, Integer, String, DateTime, Numeric
from sqlalchemy.sql import func
from app.database import Base


class CollegeSettings(Base):
    __tablename__ = "college_settings"

    id = Column(Integer, primary_key=True, default=1)
    college_name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    logo_path = Column(String(500), nullable=True)
    academic_year = Column(String(20), nullable=False)
    receipt_prefix = Column(String(20), nullable=False, default="NIT")
    receipt_counter = Column(Integer, nullable=False, default=0)
    late_fee_type = Column(String(50), nullable=False, default="daily")
    late_fee_amount = Column(Numeric(12, 2), nullable=False, default=20.00)
    late_fee_slabs = Column(String(1000), nullable=True) # JSON string of slabs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<CollegeSettings(name='{self.college_name}')>"
