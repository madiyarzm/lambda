"""
Sandbox / run code endpoint.

Executes user Python code in an isolated subprocess (or Docker when enabled).
Returns real stdout, stderr, and status. Never runs code in the main process.
"""

from fastapi import APIRouter, Request

from app.core.limiter import limiter
from app.dependencies import CurrentUser, DBSession
from app.schemas.sandbox import SandboxRunRequest, SandboxRunResponse
from app.services.sandbox_service import run_code

router = APIRouter()


@router.post("/run", response_model=SandboxRunResponse)
@limiter.limit("30/minute")
def run_code_endpoint(
    request: Request,
    payload: SandboxRunRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> SandboxRunResponse:
    """
    Run code in the sandbox. Rate limited to 30 requests per minute per IP.
    """
    result = run_code(payload.code, stdin=payload.stdin)
    return SandboxRunResponse(
        status=result.status,
        stdout=result.stdout,
        stderr=result.stderr,
        result_json=result.result_json,
    )
