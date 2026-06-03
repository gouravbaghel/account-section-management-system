"""
Application configuration using Pydantic BaseSettings.
Loads from environment variables and .env file.
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator, ValidationInfo


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""

    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/college_accounts"
    SECRET_KEY: str = "change-me-in-production-f7a3b9c1d4e8f2a6"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "https://account-section-management-system.vercel.app"
    ]

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info: ValidationInfo) -> str:
        env = info.data.get("ENVIRONMENT", "development")
        if env == "production" and v == "change-me-in-production-f7a3b9c1d4e8f2a6":
            raise ValueError("SECRET_KEY must be set in production")
        return v

    COLLEGE_NAME: str = "National Institute of Technology"
    COLLEGE_ADDRESS: str = "Main Campus Road, Bangalore - 560001"
    COLLEGE_PHONE: str = "+91-80-2658-1234"
    COLLEGE_EMAIL: str = "accounts@nit.edu.in"
    RECEIPT_PREFIX: str = "NIT"
    ACADEMIC_YEAR: str = "2025-2026"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
