"""
Abstract executor interface for sandbox.

All concrete executors (subprocess, Docker) must implement run()
and return a SandboxResult. This keeps the API stable and allows
switching backends via configuration.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SandboxResult:
    """
    Result of a single sandbox run.

    status: "success" | "timeout" | "error" (runtime/security)
    stdout/stderr: captured output; may be truncated to MAX_OUTPUT_BYTES.
    result_json: optional structured data (e.g. test results) for submissions.
    """

    status: str
    stdout: str = ""
    stderr: str = ""
    result_json: dict | None = None


class SandboxExecutor(ABC):
    """
    Interface for isolated execution of user-provided Python code.

    Implementations must:
    - Run code outside the main process.
    - Enforce time and output limits.
    - Not execute in the app process (no eval/exec of user code in FastAPI).
    """

    @abstractmethod
    def run(self, code: str, timeout_seconds: int | None = None) -> SandboxResult:
        """
        Execute Python code in isolation.

        Args:
            code: Python source code to run.
            timeout_seconds: Override default execution timeout (optional).

        Returns:
            SandboxResult with status, stdout, stderr, and optional result_json.
        """
        pass
