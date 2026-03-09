"""
Timeouts and resource limits for sandbox execution.

Defines safe defaults to prevent runaway code from exhausting server resources.
Isolation (Docker or restricted subprocess) is implemented separately.
"""

# Wall-clock timeout: kill execution after this many seconds.
# Prevents infinite loops and long-running code from blocking the server.
DEFAULT_TIMEOUT_SECONDS = 10

# Maximum bytes to capture from stdout and stderr combined (before truncation).
# Reduces memory use and prevents huge outputs from being stored or logged.
MAX_OUTPUT_BYTES = 256 * 1024  # 256 KB

# Maximum length of code string we accept (reject oversized payloads early).
MAX_CODE_BYTES = 128 * 1024  # 128 KB
