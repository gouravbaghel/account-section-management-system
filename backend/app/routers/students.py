"""
Student routes: list, create, detail, update, ledger.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, get_current_user, require_role, PaginationParams
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.course import Course
from app.models.payment import Payment
from app.models.audit import AuditLog
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.schemas.payment import PaymentResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/", response_model=StudentListResponse)
def list_students(
    search: Optional[str] = Query(None, description="Search by name, roll_number or admission_number"),
    course_id: Optional[int] = Query(None, description="Filter by course"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List students with search, filter, and pagination."""
    query = db.query(Student)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Student.name.ilike(search_term))
            | (Student.roll_number.ilike(search_term))
            | (Student.admission_number.ilike(search_term))
        )

    if course_id is not None:
        query = query.filter(Student.course_id == course_id)

    if status_filter:
        query = query.filter(Student.status == status_filter)

    total = query.count()

    students = (
        query
        .order_by(Student.id.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    items = []
    for s in students:
        resp = StudentResponse.model_validate(s)
        if s.course:
            resp.course_name = s.course.name
        items.append(resp)

    return StudentListResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
    )


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.clerk)),
):
    """Create a new student. Requires clerk+ role."""
    # Verify course exists
    course = db.query(Course).filter(Course.id == student_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {student_data.course_id} not found",
        )

    # Check for duplicate roll or admission number
    existing_roll = db.query(Student).filter(Student.roll_number == student_data.roll_number).first()
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with roll number '{student_data.roll_number}' already exists",
        )

    existing_admission = db.query(Student).filter(Student.admission_number == student_data.admission_number).first()
    if existing_admission:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with admission number '{student_data.admission_number}' already exists",
        )

    student = Student(**student_data.model_dump())
    db.add(student)
    db.flush()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="Student",
        entity_id=student.id,
        details=f"Created student '{student.name}' (Roll: {student.roll_number})",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(student)

    resp = StudentResponse.model_validate(student)
    resp.course_name = course.name
    return resp


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get student detail with course name."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found",
        )

    resp = StudentResponse.model_validate(student)
    if student.course:
        resp.course_name = student.course.name
    return resp


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.clerk)),
):
    """Update a student. Requires clerk+ role. Logs audit."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found",
        )

    update_data = student_data.model_dump(exclude_unset=True)

    # If updating course_id, verify it exists
    if "course_id" in update_data:
        course = db.query(Course).filter(Course.id == update_data["course_id"]).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Course with id {update_data['course_id']} not found",
            )

    # Check unique constraints if updating roll or admission number
    if "roll_number" in update_data and update_data["roll_number"] != student.roll_number:
        existing = db.query(Student).filter(Student.roll_number == update_data["roll_number"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Student with roll number '{update_data['roll_number']}' already exists",
            )

    if "admission_number" in update_data and update_data["admission_number"] != student.admission_number:
        existing = db.query(Student).filter(Student.admission_number == update_data["admission_number"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Student with admission number '{update_data['admission_number']}' already exists",
            )

    for field, value in update_data.items():
        setattr(student, field, value)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Student",
        entity_id=student.id,
        details=f"Updated student '{student.name}' fields: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(student)

    resp = StudentResponse.model_validate(student)
    if student.course:
        resp.course_name = student.course.name
    return resp


@router.get("/{student_id}/ledger", response_model=PaginatedResponse[PaymentResponse])
def get_student_ledger(
    student_id: int,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a student's payment ledger with pagination."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found",
        )

    query = db.query(Payment).filter(Payment.student_id == student_id)
    total = query.count()
    payments = (
        query
        .order_by(Payment.payment_date.desc(), Payment.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    items = []
    for p in payments:
        resp = PaymentResponse.model_validate(p)
        resp.student_name = student.name
        items.append(resp)

    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
    }
