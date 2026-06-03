from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user, require_role, PaginationParams
from app.models.user import UserRole, User
from app.models.loan import EducationLoan, LoanInstallment
from app.schemas.loan import EducationLoanCreate, EducationLoanUpdate, EducationLoanResponse, LoanInstallmentCreate, LoanInstallmentResponse
from sqlalchemy import desc

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.get("/", response_model=dict)
def list_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant, UserRole.clerk)),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    student_id: Optional[int] = None
):
    query = db.query(EducationLoan)
    if student_id:
        query = query.filter(EducationLoan.student_id == student_id)
    
    total = query.count()
    loans = query.order_by(desc(EducationLoan.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [EducationLoanResponse.model_validate(s) for s in loans],
        "total": total,
        "page": page,
        "size": page_size
    }

@router.post("/", response_model=EducationLoanResponse)
def create_loan(
    data: EducationLoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    new_loan = EducationLoan(**data.model_dump())
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return new_loan

@router.put("/{loan_id}", response_model=EducationLoanResponse)
def update_loan(
    loan_id: int,
    data: EducationLoanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    loan = db.query(EducationLoan).filter(EducationLoan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(loan, key, value)
        
    db.commit()
    db.refresh(loan)
    return loan

@router.post("/{loan_id}/installments", response_model=LoanInstallmentResponse)
def create_loan_installment(
    loan_id: int,
    data: LoanInstallmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    loan = db.query(EducationLoan).filter(EducationLoan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
        
    new_inst = LoanInstallment(**data.model_dump(), loan_id=loan_id)
    db.add(new_inst)
    db.commit()
    db.refresh(new_inst)
    return new_inst

@router.get("/{loan_id}/installments", response_model=List[LoanInstallmentResponse])
def get_loan_installments(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant, UserRole.clerk))
):
    installments = db.query(LoanInstallment).filter(LoanInstallment.loan_id == loan_id).order_by(LoanInstallment.due_date).all()
    return installments
