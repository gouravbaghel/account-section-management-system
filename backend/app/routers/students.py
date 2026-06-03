"""
Student routes: list, create, detail, update, ledger.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, File, UploadFile
from sqlalchemy.orm import Session
from typing import Optional, List
import io
import csv

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


from fastapi_pagination import Page
from fastapi_pagination.ext.sqlalchemy import paginate

@router.get("/", response_model=Page[StudentResponse])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, roll_number or admission_number"),
    course_id: Optional[int] = Query(None, description="Filter by course"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List students with search, filter, and pagination using fastapi-pagination."""
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

    query = query.order_by(Student.id.desc())

    # We need to map the output to add course_name. Since paginate() just returns the mapped models directly,
    # we can use transformer or rely on the StudentResponse schema handling course_name internally.
    # Actually, the StudentResponse schema has a course_name field but it relies on ORM mapping.
    # Let's use a query that joins course or maps correctly.
    # Better yet, let's just use paginate with transformer.
    
    def transform_students(students: List[Student]) -> List[StudentResponse]:
        items = []
        for s in students:
            resp = StudentResponse.model_validate(s)
            if s.course:
                resp.course_name = s.course.name
            items.append(resp)
        return items

    return paginate(db, query, transformer=transform_students)


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


@router.post("/bulk-upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_students(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.clerk)),
):
    """Bulk upload students from a CSV file. Requires clerk+ role."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    content = await file.read()
    try:
        csv_data = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please upload a UTF-8 encoded CSV.")

    reader = csv.DictReader(io.StringIO(csv_data))
    
    created_count = 0
    errors = []

    # Get course map for quick lookup
    courses = {c.name.strip().lower(): c.id for c in db.query(Course).all()}

    for index, row in enumerate(reader, start=1):
        try:
            # Simple required field validation
            name = row.get("name")
            roll_number = row.get("roll_number")
            admission_number = row.get("admission_number")
            course_name = row.get("course_name")
            branch = row.get("branch")
            semester = row.get("semester")
            batch = row.get("batch")
            phone = row.get("phone")
            guardian_name = row.get("guardian_name")
            guardian_phone = row.get("guardian_phone")

            if not all([name, roll_number, admission_number, course_name, branch, semester, batch, phone, guardian_name, guardian_phone]):
                errors.append(f"Row {index}: Missing required fields.")
                continue

            course_id = courses.get(course_name.strip().lower())
            if not course_id:
                errors.append(f"Row {index}: Course '{course_name}' not found.")
                continue

            existing = db.query(Student).filter(
                (Student.roll_number == roll_number) | (Student.admission_number == admission_number)
            ).first()
            if existing:
                errors.append(f"Row {index}: Roll number or admission number already exists.")
                continue

            student_data = {
                "name": name,
                "roll_number": roll_number,
                "admission_number": admission_number,
                "course_id": course_id,
                "branch": branch,
                "semester": int(semester),
                "batch": batch,
                "phone": phone,
                "email": row.get("email"),
                "address": row.get("address"),
                "guardian_name": guardian_name,
                "guardian_phone": guardian_phone,
            }
            
            # Using StudentCreate to validate data
            validated_data = StudentCreate(**student_data)
            student = Student(**validated_data.model_dump())
            db.add(student)
            created_count += 1
        except Exception as e:
            errors.append(f"Row {index}: {str(e)}")

    if created_count > 0:
        db.commit()
        # Audit log
        audit = AuditLog(
            user_id=current_user.id,
            action="BULK_UPLOAD",
            entity_type="Student",
            entity_id=0,
            details=f"Bulk uploaded {created_count} students.",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        db.add(audit)
        db.commit()
    
    return {
        "message": f"Successfully created {created_count} students.",
        "errors": errors
    }


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
