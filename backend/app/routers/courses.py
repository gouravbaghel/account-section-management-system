"""
Course and Branch routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User, UserRole
from app.models.course import Course, Branch
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseResponse,
    BranchCreate, BranchUpdate, BranchResponse,
)

router = APIRouter(prefix="/api/courses", tags=["Courses"])
branch_router = APIRouter(prefix="/api/branches", tags=["Branches"])


# ──────────────────────────── Course endpoints ────────────────────────────


@router.get("/", response_model=List[CourseResponse])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active courses with branches (eager loaded)."""
    courses = (
        db.query(Course)
        .filter(Course.is_active == True)
        .order_by(Course.name)
        .all()
    )
    return [CourseResponse.model_validate(c) for c in courses]


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
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
    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
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

    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.delete("/{course_id}", status_code=status.HTTP_200_OK)
def delete_course(
    course_id: int,
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
    db.commit()
    return {"message": f"Course '{course.name}' deactivated successfully"}


# ──────────────────────────── Branch endpoints ────────────────────────────


@branch_router.get("/", response_model=List[BranchResponse])
def list_branches(
    course_id: Optional[int] = Query(None, description="Filter by course"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List branches, optionally filtered by course_id."""
    query = db.query(Branch).filter(Branch.is_active == True)
    if course_id is not None:
        query = query.filter(Branch.course_id == course_id)
    branches = query.order_by(Branch.name).all()
    return [BranchResponse.model_validate(b) for b in branches]


@branch_router.post("/", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    branch_data: BranchCreate,
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
    db.commit()
    db.refresh(branch)
    return BranchResponse.model_validate(branch)
