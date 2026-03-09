"""
Sandbox / run code endpoint.

Executes user Python code in an isolated subprocess (or Docker when enabled).
Returns real stdout, stderr, and status. Never runs code in the main process.
"""

from fastapi import APIRouter

from app.dependencies import CurrentUser, DBSession
from app.schemas.sandbox import SandboxRunRequest, SandboxRunResponse
from app.services.sandbox_service import run_code

router = APIRouter()


@router.post("/run", response_model=SandboxRunResponse)
def run_code_endpoint(
    payload: SandboxRunRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> SandboxRunResponse:
    """
    Run code in the sandbox.

    Executes in a separate process with timeout and restricted builtins.
    Returns captured stdout, stderr, and status (success | timeout | error).
    """
    result = run_code(payload.code)
    return SandboxRunResponse(
        status=result.status,
        stdout=result.stdout,
        stderr=result.stderr,
        result_json=result.result_json,
    )
