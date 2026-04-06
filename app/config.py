"""
Application settings loaded from environment variables.

All secrets and environment-specific values live here.
Never hardcode secrets; use .env in development and real env in production.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central config: env vars override defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_env: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Environment name for logging and behavior.",
        alias="ENV",
    )
    debug: bool = Field(default=False, description="Enable debug mode; do not use in production.")

    # Database: PostgreSQL primary, can override per environment
    database_url: str = Field(
        default="postgresql://lambda_user:strongpassword123@localhost:5432/lambda_db",
        description="SQLAlchemy database URL. Use a secure value from env in real deployments.",
    )

    # Auth (Phase 3): placeholders so config stays stable
    secret_key: str = Field(
        default="change-me-in-production",
        description="Secret for JWT signing. Must be set in production.",
    )
    google_client_id: str = Field(default="", description="Google OAuth client ID.")
    google_client_secret: str = Field(default="", description="Google OAuth client secret.")
    frontend_url: str = Field(
        default="http://localhost:5173",
        description="Frontend origin for CORS and redirects.",
    )
    admin_email: str = Field(
        default="madiyar.zmm@gmail.com",
        description="Email of the admin/owner account. Auto-assigned teacher role on first login.",
    )

    # Sandbox: real code execution (subprocess by default; Docker optional)
    sandbox_timeout_seconds: int = Field(
        default=10,
        description="Max execution time per run. Prevents runaway code.",
    )
    sandbox_max_output_bytes: int = Field(
        default=256 * 1024,
        description="Max stdout+stderr bytes to capture before truncation.",
    )
    sandbox_use_docker: bool = Field(
        default=False,
        description="Use Docker executor when True and Docker available; else subprocess.",
    )
    sandbox_docker_image: str = Field(
        default="lambda-sandbox:latest",
        description="Docker image for sandbox (e.g. built from docker/sandbox.Dockerfile).",
    )

    # Submissions: keep only for this many days; older ones are hidden and deleted on cleanup.
    submission_retention_days: int = Field(
        default=1,
        ge=1,
        le=365,
        description="Submissions older than this are excluded from lists and removed by cleanup.",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance. Use get_settings() in app; avoids re-reading env on every request."""
    return Settings()
