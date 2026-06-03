"""
Expense routes: list, create, update, delete.
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, get_current_user, require_role, PaginationParams
from app.models.user import User, UserRole
from app.models.expense import Expense, ExpenseCategory
from app.models.audit import AuditLog
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseListResponse

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.get("/", response_model=ExpenseListResponse)
def list_expenses(
    category: Optional[ExpenseCategory] = Query(None, description="Filter by category"),
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant)),
):
    """List expenses with filters and pagination. Requires accountant+ role."""
    query = db.query(Expense)

    if category is not None:
        query = query.filter(Expense.category == category)
    if date_from is not None:
        query = query.filter(Expense.expense_date >= date_from)
    if date_to is not None:
        query = query.filter(Expense.expense_date <= date_to)

    total = query.count()

    expenses = (
        query
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    items = [ExpenseResponse.model_validate(e) for e in expenses]
    return ExpenseListResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_data: ExpenseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant)),
):
    """Create an expense. Requires accountant+ role. Logs audit."""
    expense = Expense(
        **expense_data.model_dump(),
        created_by=current_user.id,
    )
    db.add(expense)
    db.flush()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="Expense",
        entity_id=expense.id,
        details=f"Expense of ₹{expense_data.amount} created ({expense_data.category.value} - {expense_data.vendor_name})",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(expense)

    return ExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant)),
):
    """Update an expense. Requires accountant+ role. Logs audit."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id {expense_id} not found",
        )

    update_data = expense_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Expense",
        entity_id=expense.id,
        details=f"Expense #{expense_id} updated. Fields: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(expense)

    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Delete an expense. Requires admin+ role. Logs audit."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with id {expense_id} not found",
        )

    expense_details = f"Expense #{expense_id} deleted (₹{expense.amount}, {expense.category.value if hasattr(expense.category, 'value') else expense.category})"

    # Audit log before deletion
    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE",
        entity_type="Expense",
        entity_id=expense_id,
        details=expense_details,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)

    db.delete(expense)
    db.commit()

    return {"message": f"Expense #{expense_id} deleted successfully"}
