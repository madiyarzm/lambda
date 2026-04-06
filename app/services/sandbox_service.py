"""
Sandbox execution orchestration.

Validates input, applies config limits, runs code via the configured executor,
and returns a response suitable for the API. Never executes user code in this process.
"""

import logging

from app.config import Settings, get_settings
from app.sandbox.base import SandboxExecutor, SandboxResult
from app.sandbox.limits import MAX_CODE_BYTES
from app.sandbox.subprocess_executor import SubprocessSandboxExecutor

logger = logging.getLogger(__name__)


def _get_executor(settings: Settings) -> SandboxExecutor:
    """
    Return the executor to use (Docker if enabled and available, else subprocess).
    """
    if settings.sandbox_use_docker:
        try:
            from app.sandbox.docker_executor import DockerSandboxExecutor
            return DockerSandboxExecutor(image=settings.sandbox_docker_image)
        except ImportError:
            logger.warning("Docker executor not available, using subprocess")
    return SubprocessSandboxExecutor()


def run_code(
    code: str,
    settings: Settings | None = None,
) -> SandboxResult:
    """
    Run user-provided Python code in the sandbox.

    Rejects oversized code, then delegates to the configured executor.
    Do not call this from the main request path with untrusted code without
    rate limiting in production.

    Args:
        code: Python source code to execute.
        settings: Optional settings (uses get_settings() if None).

    Returns:
        SandboxResult with status, stdout, stderr, result_json.
    """
    settings = settings or get_settings()
    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        return SandboxResult(
            status="error",
            stdout="",
            stderr=f"Code exceeds maximum size ({MAX_CODE_BYTES} bytes).",
            result_json={"error": "code_too_large"},
        )
    executor = _get_executor(settings)
    result = executor.run(code, timeout_seconds=settings.sandbox_timeout_seconds)

    # Hide low-level infrastructure errors from students.
    if result.status == "error":
        err_lower = (result.stderr or "").lower()
        if "docker" in err_lower or "infrastructure_error" in str(result.result_json or ""):
            result.stderr = "Execution environment is temporarily unavailable. Please try again later or contact your mentor."
            if result.result_json is None:
                result.result_json = {}
            result.result_json["infrastructure_error"] = "docker_unavailable"
    return result
