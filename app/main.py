"""
FastAPI application entry point.

Lifespan: ensure DB is ready; later we can add migration checks or connection pools.
Routes: health check at root level; API under /api/v1; frontend static files at /.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.api import ws_collab
from app.config import get_settings
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.services.submission_service import delete_expired_submissions

# Frontend directory relative to project root (where main.py's parent's parent is)
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan hook.

    In development we auto-create tables to simplify onboarding. In production
    environments, migrations should be applied via Alembic before startup.
    """
    settings = get_settings()
    if settings.app_env == "development":
        # Development-only safety: ensure schema exists without manual migration.
        init_db()
    # Remove submissions older than retention window so DB does not grow unbounded.
    db = SessionLocal()
    try:
        deleted = delete_expired_submissions(db, retention_days=settings.submission_retention_days)
        if deleted:
            pass  # Optional: log deleted count
    finally:
        db.close()
    yield
    # Teardown: close pools etc. if needed later


def create_app() -> FastAPI:
    """Factory for the FastAPI app. Used by uvicorn and tests."""
    settings = get_settings()
    app = FastAPI(
        title="Lambda",
        description="Collaborative coding classroom platform",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
    )

    # CORS: allow frontend origin; restrict in production to known origins.
    # For development we allow all origins so that the Vite dev server
    # on port 5173 can talk to the API without CORS issues.
    # In production, this should be restricted to known frontend origins.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")
    # WebSocket collaboration endpoint (not versioned; used by Yjs clients).
    app.include_router(ws_collab.router)

    # Serve frontend static files in development; API routes take precedence.
    if FRONTEND_DIR.exists():
        app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

    return app


app = create_app()


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """
    Health check for load balancers and frontend.

    Returns:
        status and app version.
    """
    return {"status": "ok", "service": "lambda"}
