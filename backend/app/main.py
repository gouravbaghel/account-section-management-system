"""
FastAPI application entry point.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
from pythonjsonlogger import jsonlogger
import time

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
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Any startup logic goes here (e.g., redis connection, initial caching)
    yield
    # Any shutdown logic goes here

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.routers.auth import limiter

# Setup JSON Logging
logger = logging.getLogger("uvicorn.access")
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(asctime)s %(levelname)s %(name)s %(message)s'
)
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.propagate = False

app = FastAPI(
    title="College Account Section Management System API",
    version="1.0.0",
    description="Complete backend API for managing college accounts, fees, payments, and expenses.",
    lifespan=lifespan,
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        "Request processed",
        extra={
            "method": request.method,
            "url": str(request.url),
            "status_code": response.status_code,
            "process_time_ms": round(process_time * 1000, 2),
            "client_ip": request.client.host if request.client else None,
        }
    )
    return response

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "College Account Section Management System"}
