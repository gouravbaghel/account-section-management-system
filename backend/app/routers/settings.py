"""
College settings routes: get and update.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.user import User, UserRole
from app.models.settings import CollegeSettings
from app.models.audit import AuditLog
from app.schemas.settings import CollegeSettingsUpdate, CollegeSettingsResponse

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/", response_model=CollegeSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Get college settings (first row). Requires admin+ role."""
    settings_row = db.query(CollegeSettings).first()
    if not settings_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College settings not configured. Please run the seed script.",
        )
    return CollegeSettingsResponse.model_validate(settings_row)


@router.put("/", response_model=CollegeSettingsResponse)
def update_settings(
    settings_data: CollegeSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    """Update college settings. Requires admin+ role. Logs audit."""
    settings_row = db.query(CollegeSettings).first()
    if not settings_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College settings not configured. Please run the seed script.",
        )

    update_data = settings_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings_row, field, value)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="CollegeSettings",
        entity_id=settings_row.id,
        details=f"College settings updated. Fields: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit)
    db.commit()
    db.refresh(settings_row)

    return CollegeSettingsResponse.model_validate(settings_row)
