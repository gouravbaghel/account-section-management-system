from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies import get_db
from app.dependencies import get_current_user, require_role, PaginationParams
from app.models.user import UserRole, User
from app.models.employee import Employee, Salary, Claim
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, SalaryCreate, SalaryUpdate, SalaryResponse, ClaimCreate, ClaimUpdate, ClaimResponse
from sqlalchemy import desc

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=dict)
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant)),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    department: Optional[str] = None
):
    query = db.query(Employee)
    if department:
        query = query.filter(Employee.department == department)
    
    total = query.count()
    employees = query.order_by(desc(Employee.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "items": [EmployeeResponse.model_validate(s) for s in employees],
        "total": total,
        "page": page,
        "size": page_size
    }

@router.post("/", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin))
):
    new_employee = Employee(**data.model_dump())
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    return new_employee

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin))
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, key, value)
        
    db.commit()
    db.refresh(employee)
    return employee

@router.post("/{employee_id}/salaries", response_model=SalaryResponse)
def create_salary(
    employee_id: int,
    data: SalaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    new_salary = Salary(**data.model_dump(), employee_id=employee_id)
    new_salary.net_pay = new_salary.basic_pay + new_salary.allowances - new_salary.deductions
    db.add(new_salary)
    db.commit()
    db.refresh(new_salary)
    return new_salary

@router.get("/{employee_id}/salaries", response_model=List[SalaryResponse])
def get_salaries(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    salaries = db.query(Salary).filter(Salary.employee_id == employee_id).order_by(desc(Salary.year), desc(Salary.month)).all()
    return salaries

@router.post("/{employee_id}/claims", response_model=ClaimResponse)
def create_claim(
    employee_id: int,
    data: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    new_claim = Claim(**data.model_dump(), employee_id=employee_id)
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)
    return new_claim

@router.get("/{employee_id}/claims", response_model=List[ClaimResponse])
def get_claims(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    claims = db.query(Claim).filter(Claim.employee_id == employee_id).order_by(desc(Claim.created_at)).all()
    return claims

@router.put("/claims/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: int,
    data: ClaimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.super_admin, UserRole.admin, UserRole.accountant))
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(claim, key, value)
    db.commit()
    db.refresh(claim)
    return claim
