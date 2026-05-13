"""
Production startup guards. Fail closed (or warn loudly) on insecure config.

Called from `create_app()` so the process refuses to boot when running in
production with the worst kinds of insecure defaults. Each guard maps to a
security-audit item:

- secret_key default → audit #4. HARD refusal — no infra excuse not to set this.
- subprocess sandbox in prod → audit #1. WARNING only, because Northflank's
  free tier doesn't allow Docker-in-Docker. Residual risk is bounded by the
  env-var allowlist in `app/sandbox/subprocess_executor.py` (no secrets leak
  on escape), but a successful escape can still consume CPU/memory/disk.
  Re-tighten to a hard refusal once we move to Docker-capable hosting
  (Fly.io Machines, DO droplet) or swap to a remote sandbox API (e2b.dev).
"""

import logging

from app.config import Settings

logger = logging.getLogger(__name__)


_DEFAULT_SECRET_KEY = "change-me-in-production"


class InsecureProductionConfigError(RuntimeError):
    """Raised on boot when production config would expose a known vulnerability."""


def validate_production_settings(settings: Settings) -> None:
    """Refuse to start in production with the worst defaults; warn on the rest."""
    if settings.app_env != "production":
        return

    if settings.secret_key == _DEFAULT_SECRET_KEY or not settings.secret_key:
        raise InsecureProductionConfigError(
            "SECRET_KEY is the placeholder default; set a strong random value in env."
        )

    if not settings.sandbox_use_docker:
        logger.warning(
            "SANDBOX_USE_DOCKER=false in production. Restricted-builtins is "
            "bypassable; only env-var allowlist limits blast radius. "
            "Re-enable Docker (or move to a sandbox API) before opening to "
            "untrusted users."
        )
