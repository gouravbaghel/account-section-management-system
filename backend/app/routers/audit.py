"""
Audit log routes: list with pagination and filters.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.dependencies import get_db, get_current_user, PaginationParams
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/audit-logs", tags=["Audit Logs"])


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int


@router.get("/", response_model=AuditLogListResponse)
def list_audit_logs(
    user_id: Optional[int] = Query(None, description="Filter by user"),
    action: Optional[str] = Query(None, description="Filter by action (e.g. CREATE, UPDATE, DELETE, LOGIN)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g. Student, Payment, Expense)"),
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List audit logs with pagination and optional filters. All authenticated users can view."""
    query = db.query(AuditLog)

    if user_id is not None:
        query = query.filter(AuditLog.user_id == user_id)
    if action is not None:
        query = query.filter(AuditLog.action == action)
    if entity_type is not None:
        query = query.filter(AuditLog.entity_type == entity_type)

    total = query.count()

    logs = (
        query
        .order_by(AuditLog.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
        .all()
    )

    items = [AuditLogResponse.model_validate(log) for log in logs]
    return AuditLogListResponse(
        items=items,
        total=total,
        page=pagination.page,
        size=pagination.size,
    )
