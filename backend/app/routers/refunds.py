from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies import get_db
from app.dependencies import get_current_user, require_role, PaginationParams
from app.models.user import UserRole, User
from app.models.refund import Refund
from app.schemas.refund import RefundCreate, RefundUpdate, RefundResponse
from sqlalchemy import desc

router = APIRouter(prefix="/refunds", tags=["Refunds"])

@router.get("/", response_model=dict)
def list_refunds(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant, UserRole.clerk)),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    student_id: Optional[int] = None,
    status: Optional[str] = None
):
    query = db.query(Refund)
    if student_id:
        query = query.filter(Refund.student_id == student_id)
    if status:
        query = query.filter(Refund.status == status)
    
    total = query.count()
    refunds = query.order_by(desc(Refund.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [RefundResponse.model_validate(s) for s in refunds],
        "total": total,
        "page": page,
        "size": page_size
    }

@router.post("/", response_model=RefundResponse)
def create_refund(
    data: RefundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    new_refund = Refund(**data.model_dump())
    db.add(new_refund)
    db.commit()
    db.refresh(new_refund)
    return new_refund

@router.put("/{refund_id}", response_model=RefundResponse)
def update_refund(
    refund_id: int,
    data: RefundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(refund, key, value)
        
    db.commit()
    db.refresh(refund)
    return refund
