"""
Pre-startup migration check.

Stamps alembic at head if the DB was initialized via create_all (no
alembic_version table), then runs upgrade head to apply any new migrations.
Errors are logged but never prevent the server from starting.
"""
import subprocess
import sys

def _run(cmd: list[str]) -> bool:
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"[startup] command failed (exit {result.returncode}): {' '.join(cmd)}", file=sys.stderr)
    return result.returncode == 0


def main() -> None:
    try:
        from sqlalchemy import text
        from app.db.session import engine

        with engine.connect() as conn:
            row = conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'alembic_version'"
            ))
            has_version_table = (row.scalar() or 0) > 0

            stamped = False
            if has_version_table:
                row2 = conn.execute(text("SELECT COUNT(*) FROM alembic_version"))
                stamped = (row2.scalar() or 0) > 0

        if not has_version_table or not stamped:
            print("[startup] alembic_version missing or empty — stamping at head.")
            _run(["alembic", "stamp", "head"])

        print("[startup] Running alembic upgrade head…")
        _run(["alembic", "upgrade", "head"])
        print("[startup] Migrations done.")

    except Exception as exc:
        print(f"[startup] Migration step failed: {exc}", file=sys.stderr)
        print("[startup] Starting server anyway — schema may already be current.", file=sys.stderr)


if __name__ == "__main__":
    main()
