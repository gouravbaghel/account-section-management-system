"""
Course and Branch routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional, List

from app.dependencies import get_db, get_current_user, require_role, PaginationParams
from app.models.user import User, UserRole
from app.models.course import Course, Branch
from app.models.audit import AuditLog
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse,
    BranchCreate, BranchUpdate, BranchResponse,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/api/courses", tags=["Courses"])
branch_router = APIRouter(prefix="/api/branches", tags=["Branches"])


# ──────────────────────────── Course endpoints ────────────────────────────


@router.get("/", response_model=PaginatedResponse[CourseResponse])
def list_courses(
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active courses with branches (eager loaded) and pagination."""
    query = db.query(Course).filter(Course.is_active == True)
    total = query.count()
    courses = (
        query
        .order_by(Course.name)
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )
    items = [CourseResponse.model_validate(c) for c in courses]
    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
    }


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Create a new course. Requires admin+ role."""
    existing = db.query(Course).filter(Course.code == course_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Course with code '{course_data.code}' already exists",
        )

    course = Course(**course_data.model_dump())
    db.add(course)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="Course",
        entity_id=course.id,
        details=f"Created course '{course.name}' (Code: {course.code})",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Update a course. Requires admin+ role."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {course_id} not found",
        )

    update_data = course_data.model_dump(exclude_unset=True)

    # Check unique code constraint
    if "code" in update_data and update_data["code"] != course.code:
        existing = db.query(Course).filter(Course.code == update_data["code"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Course with code '{update_data['code']}' already exists",
            )

    for field, value in update_data.items():
        setattr(course, field, value)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Course",
        entity_id=course.id,
        details=f"Updated course '{course.name}' fields: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.delete("/{course_id}", status_code=status.HTTP_200_OK)
def delete_course(
    course_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Soft-delete a course (is_active=False). Requires admin+ role."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {course_id} not found",
        )

    course.is_active = False
    
    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE",
        entity_type="Course",
        entity_id=course.id,
        details=f"Soft-deleted course '{course.name}'",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    return {"message": f"Course '{course.name}' deactivated successfully"}


# ──────────────────────────── Branch endpoints ────────────────────────────


@branch_router.get("/", response_model=PaginatedResponse[BranchResponse])
def list_branches(
    course_id: Optional[int] = Query(None, description="Filter by course"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List branches, optionally filtered by course_id, with pagination."""
    query = db.query(Branch).filter(Branch.is_active == True)
    if course_id is not None:
        query = query.filter(Branch.course_id == course_id)
        
    total = query.count()
    branches = (
        query
        .order_by(Branch.name)
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )
    items = [BranchResponse.model_validate(b) for b in branches]
    return {
        "items": items,
        "total": total,
        "page": pagination.page,
        "size": pagination.size,
    }


@branch_router.post("/", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    branch_data: BranchCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Create a new branch. Requires admin+ role."""
    # Verify course exists
    course = db.query(Course).filter(Course.id == branch_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {branch_data.course_id} not found",
        )

    branch = Branch(**branch_data.model_dump())
    db.add(branch)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="Branch",
        entity_id=branch.id,
        details=f"Created branch '{branch.name}' in course '{course.code}'",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(branch)
    return BranchResponse.model_validate(branch)
