"""
Database engine and session factory.

SQLite needs check_same_thread=False for FastAPI's async-style usage.
PostgreSQL does not; the engine works for both.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

# SQLite requires check_same_thread=False when using thread-local sessions with FastAPI.
connect_args = {} if "sqlite" not in settings.database_url else {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that yields a DB session and closes it after the request.

    Ensures no connection leak; use in route dependencies via Depends(get_db).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
