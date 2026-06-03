"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

# Import all models to register them with Base.metadata
from app.models import *  # noqa

from app.routers import (
    auth,
    dashboard,
    students,
    courses,
    fees,
    payments,
    receipts,
    expenses,
    reports,
    audit,
    settings as settings_router,
    users,
)

app = FastAPI(
    title="College Account Section Management System API",
    version="1.0.0",
    description="Complete backend API for managing college accounts, fees, payments, and expenses.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(courses.branch_router)
app.include_router(fees.router)
app.include_router(fees.student_fee_router)
app.include_router(payments.router)
app.include_router(receipts.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(settings_router.router)
app.include_router(users.router)


@app.on_event("startup")
def startup():
    """Create all database tables on startup."""
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "College Account Section Management System"}
