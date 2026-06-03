"""
Fee structure and student fee assignment routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User, UserRole
from app.models.fee import FeeStructure, StudentFee, FeeStatus
from app.models.student import Student
from app.models.course import Course, Branch
from app.schemas.fee import (
    FeeStructureCreate, FeeStructureUpdate, FeeStructureResponse,
    StudentFeeResponse, AssignFeeRequest,
)

router = APIRouter(prefix="/api/fee-structures", tags=["Fee Structures"])
student_fee_router = APIRouter(prefix="/api/student-fees", tags=["Student Fees"])


# ──────────────────────────── Fee Structure endpoints ────────────────────────────


@router.get("/", response_model=List[FeeStructureResponse])
def list_fee_structures(
    course_id: Optional[int] = Query(None, description="Filter by course"),
    semester: Optional[int] = Query(None, description="Filter by semester"),
    batch: Optional[str] = Query(None, description="Filter by batch"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.clerk)),
):
    """List fee structures with optional filters. Requires clerk+ role."""
    query = db.query(FeeStructure).filter(FeeStructure.is_active == True)

    if course_id is not None:
        query = query.filter(FeeStructure.course_id == course_id)
    if semester is not None:
        query = query.filter(FeeStructure.semester == semester)
    if batch is not None:
        query = query.filter(FeeStructure.batch == batch)

    fee_structures = query.order_by(FeeStructure.id.desc()).all()
    return [FeeStructureResponse.model_validate(fs) for fs in fee_structures]


@router.post("/", response_model=FeeStructureResponse, status_code=status.HTTP_201_CREATED)
def create_fee_structure(
    fee_data: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Create a fee structure with auto-computed total. Requires admin+ role."""
    # Verify course exists
    course = db.query(Course).filter(Course.id == fee_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {fee_data.course_id} not found",
        )

    # Verify branch exists if specified
    if fee_data.branch_id is not None:
        branch = db.query(Branch).filter(Branch.id == fee_data.branch_id).first()
        if not branch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Branch with id {fee_data.branch_id} not found",
            )

    fee_structure = FeeStructure(**fee_data.model_dump())
    fee_structure.total_amount = fee_structure.compute_total()
    db.add(fee_structure)
    db.commit()
    db.refresh(fee_structure)
    return FeeStructureResponse.model_validate(fee_structure)


@router.put("/{fee_id}", response_model=FeeStructureResponse)
def update_fee_structure(
    fee_id: int,
    fee_data: FeeStructureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Update a fee structure and recompute total. Requires admin+ role."""
    fee_structure = db.query(FeeStructure).filter(FeeStructure.id == fee_id).first()
    if not fee_structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fee structure with id {fee_id} not found",
        )

    update_data = fee_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(fee_structure, field, value)

    # Recompute total
    fee_structure.total_amount = fee_structure.compute_total()

    db.commit()
    db.refresh(fee_structure)
    return FeeStructureResponse.model_validate(fee_structure)


# ──────────────────────────── Student Fee endpoints ────────────────────────────


@student_fee_router.get("/", response_model=List[StudentFeeResponse])
def list_student_fees(
    student_id: int = Query(..., description="Student ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.clerk)),
):
    """List student fees by student_id. Requires clerk+ role."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found",
        )

    student_fees = (
        db.query(StudentFee)
        .filter(StudentFee.student_id == student_id)
        .order_by(StudentFee.id.desc())
        .all()
    )
    return [StudentFeeResponse.model_validate(sf) for sf in student_fees]


@student_fee_router.post("/assign", response_model=List[StudentFeeResponse], status_code=status.HTTP_201_CREATED)
def assign_fee_to_students(
    assign_data: AssignFeeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """
    Assign a fee structure to multiple students.
    Creates a StudentFee record for each student with computed balance.
    Requires admin+ role.
    """
    # Verify fee structure exists
    fee_structure = db.query(FeeStructure).filter(FeeStructure.id == assign_data.fee_structure_id).first()
    if not fee_structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fee structure with id {assign_data.fee_structure_id} not found",
        )

    created_fees: List[StudentFee] = []

    for student_id in assign_data.student_ids:
        # Verify student exists
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with id {student_id} not found",
            )

        # Check if already assigned
        existing = (
            db.query(StudentFee)
            .filter(
                StudentFee.student_id == student_id,
                StudentFee.fee_structure_id == assign_data.fee_structure_id,
            )
            .first()
        )
        if existing:
            continue  # Skip already assigned

        total_amount = float(fee_structure.total_amount or 0)
        discount = assign_data.discount_amount
        scholarship = assign_data.scholarship_amount
        balance = total_amount - discount - scholarship

        student_fee = StudentFee(
            student_id=student_id,
            fee_structure_id=assign_data.fee_structure_id,
            total_amount=total_amount,
            paid_amount=0,
            discount_amount=discount,
            scholarship_amount=scholarship,
            balance=balance,
            status=FeeStatus.pending,
            academic_year=fee_structure.academic_year,
        )
        db.add(student_fee)
        created_fees.append(student_fee)

    db.commit()

    # Refresh all created fees
    for sf in created_fees:
        db.refresh(sf)

    return [StudentFeeResponse.model_validate(sf) for sf in created_fees]
