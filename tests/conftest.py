"""
Pytest configuration and fixtures for Lambda backend.

Uses FastAPI's TestClient and a temporary database if needed.
For Phase 2 we just expose a client hitting the real app instance.
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """
    Provide a TestClient for API tests.

    Yields:
        TestClient bound to the FastAPI app.
    """

    with TestClient(app) as c:
        yield c

