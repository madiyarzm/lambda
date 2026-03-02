"""
Sandbox / run code endpoint.

Phase 6: stub implementation that does NOT execute user code.
Returns a simulated result for editor "Run" feedback.
Real Docker-based isolation will be added later.
"""

from fastapi import APIRouter

from app.dependencies import CurrentUser, DBSession
from app.schemas.sandbox import SandboxRunRequest, SandboxRunResponse

router = APIRouter()


@router.post("/run", response_model=SandboxRunResponse)
def run_code(
    payload: SandboxRunRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> SandboxRunResponse:
    """
    Run code in sandbox (stub).

    Does NOT execute user code. Returns a simulated result for editor feedback.
    Real isolated execution (Docker) will be implemented in a future phase.
    """
    return SandboxRunResponse(
        status="success",
        stdout="(stub) Code execution is not yet implemented. No output captured.",
        stderr="",
        result_json={"summary": "Sandbox stub — no code was executed."},
    )
