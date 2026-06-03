"""
Application configuration using Pydantic BaseSettings.
Loads from environment variables and .env file.
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/college_accounts"
    SECRET_KEY: str = "f7a3b9c1d4e8f2a6b0c5d9e3f7a1b4c8d2e6f0a3b7c1d5e9f2a6b0c4d8e1f5a9"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

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
