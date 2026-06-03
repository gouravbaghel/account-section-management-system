"""
Dashboard routes: statistics and chart data.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.user import User, UserRole
from app.services.dashboard import get_dashboard_stats, get_dashboard_charts

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant, UserRole.admin, UserRole.super_admin, UserRole.clerk, UserRole.auditor)),
):
    """Get dashboard summary statistics."""
    return get_dashboard_stats(db)


@router.get("/charts")
def dashboard_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.accountant, UserRole.admin, UserRole.super_admin, UserRole.clerk, UserRole.auditor)),
):
    """Get chart data for the dashboard."""
    return get_dashboard_charts(db)
