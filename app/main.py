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
from fastapi.responses import FileResponse
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
    Application lifespan hook. DB work runs in background so health check passes immediately.
    """
    import asyncio
    import logging

    logger = logging.getLogger(__name__)

    async def _startup() -> None:
        settings = get_settings()
        try:
            init_db()
        except Exception as exc:
            logger.error("init_db failed: %s", exc)
            return
        db = SessionLocal()
        try:
            delete_expired_submissions(db, retention_days=settings.submission_retention_days)
        except Exception as exc:
            logger.error("delete_expired_submissions failed: %s", exc)
        finally:
            db.close()

    asyncio.create_task(_startup())
    yield


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

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "lambda"}

    # Serve frontend static files.
    # Assets (JS/CSS/images) are served directly; all other paths fall back to
    # index.html so that React Router (BrowserRouter) handles client-side navigation.
    if FRONTEND_DIR.exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str) -> FileResponse:
            # Serve real files (favicon, manifest, etc.) if they exist.
            candidate = FRONTEND_DIR / full_path
            if candidate.exists() and candidate.is_file():
                return FileResponse(str(candidate))
            return FileResponse(str(FRONTEND_DIR / "index.html"))

    return app


app = create_app()
