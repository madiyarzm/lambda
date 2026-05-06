#!/bin/sh
set -e

# If the DB was initialized via SQLAlchemy create_all (no alembic_version table),
# stamp it at head before upgrading. Without this, alembic would replay all
# migrations from scratch — and migration 001 drops tables that create_all never
# creates, causing a fatal error on startup.
python - <<'PYEOF'
from sqlalchemy import inspect
from app.db.session import engine
if not inspect(engine).has_table('alembic_version'):
    import subprocess, sys
    print("No alembic_version table found; stamping DB at head.")
    r = subprocess.run(['alembic', 'stamp', 'head'])
    sys.exit(r.returncode)
PYEOF

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
