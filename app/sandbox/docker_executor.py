"""
Docker-based sandbox executor.

Runs user code inside a container: no network, ephemeral filesystem.
Use when SANDBOX_USE_DOCKER=true; requires Docker installed and the app
allowed to talk to the Docker daemon.
"""

import logging
import subprocess
import tempfile
from pathlib import Path

from app.sandbox.base import SandboxExecutor, SandboxResult
from app.sandbox.limits import DEFAULT_TIMEOUT_SECONDS, MAX_OUTPUT_BYTES

logger = logging.getLogger(__name__)


def _truncate(s: str, max_bytes: int) -> str:
    """Truncate string to max_bytes (UTF-8)."""
    encoded = s.encode("utf-8")
    if len(encoded) <= max_bytes:
        return s
    return encoded[:max_bytes].decode("utf-8", errors="replace")


class DockerSandboxExecutor(SandboxExecutor):
    """
    Run user code in a Docker container with --network=none and timeout.

    Uses the image from config (e.g. lambda-sandbox:latest). The container
    mounts a temp dir with user_code.py; no builtin restrictions inside
    the container (isolation is the container itself). Pre-install allowed
    packages in the image if students need numpy, pandas, etc.
    """

    def __init__(self, image: str = "lambda-sandbox:latest"):
        self.image = image

    def run(self, code: str, timeout_seconds: int | None = None) -> SandboxResult:
        """
        Execute code in a container: mount code, run python, capture output.
        """
        timeout = timeout_seconds if timeout_seconds is not None else DEFAULT_TIMEOUT_SECONDS
        with tempfile.TemporaryDirectory(prefix="lambda_docker_") as tmpdir:
            tmp = Path(tmpdir)
            code_path = tmp / "user_code.py"
            code_path.write_text(code, encoding="utf-8")

            # Run container: no network, read-only root, tmpfs for /tmp (Python cache), mount code, timeout.
            cmd = [
                "docker", "run", "--rm",
                "--network=none",
                "--read-only",
                "--tmpfs", "/tmp:noexec,nosuid,size=64m",
                "--pids-limit=50",
                "--memory=256m",
                "-v", f"{tmp}:/code:ro",
                "--user", "sandbox",
                self.image,
            ]
            try:
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout + 5,  # Slight buffer for docker shutdown
                    cwd=str(tmp),
                )
            except subprocess.TimeoutExpired:
                logger.warning("Docker sandbox run timed out after %s seconds", timeout)
                return SandboxResult(
                    status="timeout",
                    stdout="",
                    stderr=f"Execution timed out after {timeout} seconds.",
                    result_json={"timed_out": True},
                )
            except FileNotFoundError:
                logger.exception("Docker not found or not in PATH")
                return SandboxResult(
                    status="error",
                    stdout="",
                    stderr="Docker is not available for execution.",
                    result_json={"error": "docker_not_found"},
                )
            except Exception as e:
                logger.exception("Docker sandbox failed: %s", e)
                return SandboxResult(
                    status="error",
                    stdout="",
                    stderr="Execution failed.",
                    result_json={"error": "docker_failed"},
                )

            out = _truncate(proc.stdout or "", MAX_OUTPUT_BYTES)
            err = _truncate(proc.stderr or "", MAX_OUTPUT_BYTES)
            status = "success" if proc.returncode == 0 else "error"
            return SandboxResult(
                status=status,
                stdout=out,
                stderr=err,
                result_json={"returncode": proc.returncode},
            )
