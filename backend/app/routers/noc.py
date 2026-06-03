from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user, require_role, PaginationParams
from app.models.user import UserRole, User
from app.models.noc import NOCRequest
from app.schemas.noc import NOCRequestCreate, NOCRequestUpdate, NOCRequestResponse
from sqlalchemy import desc

router = APIRouter(prefix="/noc", tags=["NOC"])

@router.get("/", response_model=dict)
def list_noc_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant, UserRole.clerk)),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    student_id: Optional[int] = None,
    status: Optional[str] = None
):
    query = db.query(NOCRequest)
    if student_id:
        query = query.filter(NOCRequest.student_id == student_id)
    if status:
        query = query.filter(NOCRequest.status == status)
    
    total = query.count()
    noc_requests = query.order_by(desc(NOCRequest.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [NOCRequestResponse.model_validate(s) for s in noc_requests],
        "total": total,
        "page": page,
        "size": page_size
    }

@router.post("/", response_model=NOCRequestResponse)
def create_noc_request(
    data: NOCRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant, UserRole.clerk))
):
    new_noc = NOCRequest(**data.model_dump())
    db.add(new_noc)
    db.commit()
    db.refresh(new_noc)
    return new_noc

@router.put("/{noc_id}", response_model=NOCRequestResponse)
def update_noc_request(
    noc_id: int,
    data: NOCRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    noc = db.query(NOCRequest).filter(NOCRequest.id == noc_id).first()
    if not noc:
        raise HTTPException(status_code=404, detail="NOC request not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(noc, key, value)
        
    db.commit()
    db.refresh(noc)
    return noc
