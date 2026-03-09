"""
Subprocess-based sandbox executor.

Runs user code in a separate Python process with restricted builtins and a
timeout. Does not require Docker. Use when Docker is unavailable (e.g. local
dev or some PaaS). For full isolation (no network, read-only fs), use
Docker executor when available.

Security: we never exec() user code in the main process. The child process
runs a small runner script that restricts builtins (no open, no unsafe
imports) and then execs the user code. Timeout prevents infinite loops.
"""

import os
import subprocess
import tempfile
import logging
from pathlib import Path

from app.sandbox.base import SandboxExecutor, SandboxResult
from app.sandbox.limits import DEFAULT_TIMEOUT_SECONDS, MAX_OUTPUT_BYTES

logger = logging.getLogger(__name__)

# Runner script: writes to temp dir and is invoked as python runner.py <user_code_path>.
# Restricts builtins so user code cannot open files, spawn processes, or import os/socket etc.
# We allow common teaching modules: math, random, json, datetime, re, collections, etc.
_RUNNER_SCRIPT = r'''
import sys

# Only our runner opens the file; user code runs with restricted builtins.
_CODE_PATH = sys.argv[1]
with open(_CODE_PATH, "r", encoding="utf-8") as f:
    _code = f.read()

# Allowed modules for teaching (no os, subprocess, socket, etc.).
_ALLOWED = frozenset((
    "math", "random", "json", "datetime", "re", "collections",
    "functools", "itertools", "string", "decimal", "fractions",
    "statistics", "typing", "dataclasses",
))

_orig_import = __import__

def _safe_import(name, *args, **kwargs):
    top = name.split(".")[0]
    if top not in _ALLOWED:
        raise ImportError("Module not allowed in sandbox: %s" % top)
    return _orig_import(name, *args, **kwargs)

# Build restricted builtins: remove open, exec, eval, compile, __import__; add safe __import__.
_builtins = __builtins__ if isinstance(__builtins__, dict) else __builtins__.__dict__
_safe = dict(_builtins)
for _name in ("open", "input", "exec", "eval", "compile", "file", "__import__", "reload"):
    _safe.pop(_name, None)
_safe["__import__"] = _safe_import
_safe["print"] = print  # keep print for output

_globals = {"__builtins__": _safe, "__name__": "__main__"}

try:
    exec(compile(_code, _CODE_PATH, "exec"), _globals)
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
'''


def _truncate(s: str, max_bytes: int) -> str:
    """Truncate string to max_bytes (UTF-8); avoid breaking multibyte chars."""
    encoded = s.encode("utf-8")
    if len(encoded) <= max_bytes:
        return s
    return encoded[:max_bytes].decode("utf-8", errors="replace")


class SubprocessSandboxExecutor(SandboxExecutor):
    """
    Runs user code in a subprocess with timeout and restricted builtins.

    Code is written to a temp directory; a runner script restricts builtins
    and execs it. Stdout/stderr are captured and truncated. No network or
    filesystem access for user code (runner blocks open and unsafe imports).
    """

    def run(self, code: str, timeout_seconds: int | None = None) -> SandboxResult:
        """
        Execute code in a child process with timeout and safe builtins.

        Args:
            code: Python source to run.
            timeout_seconds: Override default timeout (uses DEFAULT_TIMEOUT_SECONDS if None).

        Returns:
            SandboxResult with status success|timeout|error and captured output.
        """
        timeout = timeout_seconds if timeout_seconds is not None else DEFAULT_TIMEOUT_SECONDS
        with tempfile.TemporaryDirectory(prefix="lambda_sandbox_") as tmpdir:
            tmp = Path(tmpdir)
            code_path = tmp / "user_code.py"
            runner_path = tmp / "runner.py"
            code_path.write_text(code, encoding="utf-8")
            runner_path.write_text(_RUNNER_SCRIPT.strip(), encoding="utf-8")

            try:
                proc = subprocess.run(
                    [os.environ.get("SANDBOX_PYTHON", "python3"), str(runner_path), str(code_path)],
                    cwd=str(tmp),
                    capture_output=True,
                    timeout=timeout,
                    text=True,
                    env={k: v for k, v in os.environ.items() if k != "PYTHONPATH"},
                )
            except subprocess.TimeoutExpired:
                logger.warning("Sandbox run timed out after %s seconds", timeout)
                return SandboxResult(
                    status="timeout",
                    stdout="",
                    stderr=f"Execution timed out after {timeout} seconds.",
                    result_json={"timed_out": True},
                )
            except FileNotFoundError:
                logger.exception("Python interpreter not found for sandbox")
                return SandboxResult(
                    status="error",
                    stdout="",
                    stderr="Python interpreter not available for execution.",
                    result_json={"error": "interpreter_not_found"},
                )
            except Exception as e:
                logger.exception("Sandbox subprocess failed: %s", e)
                return SandboxResult(
                    status="error",
                    stdout="",
                    stderr="Execution failed.",
                    result_json={"error": "subprocess_failed"},
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
