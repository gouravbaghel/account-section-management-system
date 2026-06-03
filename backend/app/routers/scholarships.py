from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user, require_role, PaginationParams
from app.models.user import UserRole, User
from app.models.scholarship import Scholarship
from app.schemas.scholarship import ScholarshipCreate, ScholarshipUpdate, ScholarshipResponse
from sqlalchemy import desc

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])

@router.get("/", response_model=dict)
def list_scholarships(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant, UserRole.clerk)),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    student_id: Optional[int] = None,
    academic_year: Optional[str] = None
):
    query = db.query(Scholarship)
    if student_id:
        query = query.filter(Scholarship.student_id == student_id)
    if academic_year:
        query = query.filter(Scholarship.academic_year == academic_year)
    
    total = query.count()
    scholarships = query.order_by(desc(Scholarship.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [ScholarshipResponse.model_validate(s) for s in scholarships],
        "total": total,
        "page": page,
        "size": page_size
    }

@router.post("/", response_model=ScholarshipResponse)
def create_scholarship(
    data: ScholarshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    new_scholarship = Scholarship(**data.model_dump())
    db.add(new_scholarship)
    db.commit()
    db.refresh(new_scholarship)
    return new_scholarship

@router.put("/{scholarship_id}", response_model=ScholarshipResponse)
def update_scholarship(
    scholarship_id: int,
    data: ScholarshipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(scholarship, key, value)
        
    db.commit()
    db.refresh(scholarship)
    return scholarship
