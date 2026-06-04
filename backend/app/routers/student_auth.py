"""
Student Authentication router.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.student_auth import StudentLoginRequest, StudentTokenResponse, StudentSetPasswordRequest
from app.services.auth import authenticate_student, create_student_tokens
from app.models.student import Student
from app.utils.security import get_password_hash

from app.routers.auth import limiter

router = APIRouter(prefix="/api/student/auth", tags=["Student Auth"])


@router.post("/login", response_model=StudentTokenResponse)
@limiter.limit("5/minute")
def login_student(request_obj: Request, request: StudentLoginRequest, db: Session = Depends(get_db)):
    student = authenticate_student(db, request.admission_number, request.password)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admission number or password, or account is locked/uninitialized.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_student_tokens(student)


@router.post("/set-password")
def set_student_password(
    admission_number: str,
    request: StudentSetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint for admins to set/reset a student's password initially.
    In a real system, this might involve email verification.
    """
    student = db.query(Student).filter(Student.admission_number == admission_number).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password set successfully"}
