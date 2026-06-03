"""
Expense model for tracking institutional expenditures.
"""
import enum
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ExpenseCategory(str, enum.Enum):
    salary = "salary"
    electricity = "electricity"
    maintenance = "maintenance"
    events = "events"
    lab_equipment = "lab_equipment"
    office = "office"
    transport = "transport"
    miscellaneous = "miscellaneous"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(ExpenseCategory), nullable=False, index=True)
    description = Column(Text, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    vendor_name = Column(String(200), nullable=False)
    payment_mode = Column(Enum(
        "cash", "upi", "bank_transfer", "cheque", "card",
        name="expense_payment_mode"
    ), nullable=False)
    bill_number = Column(String(100), nullable=True)
    expense_date = Column(Date, nullable=False)
    remarks = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User")

    def __repr__(self) -> str:
        return f"<Expense(id={self.id}, category='{self.category}', amount={self.amount})>"
