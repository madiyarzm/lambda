"""Add index on submissions.submitted_at for retention cleanup performance.

Revision ID: 004
Revises: 003
Create Date: 2026-05-05
"""

from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_submissions_submitted_at", "submissions", ["submitted_at"])


def downgrade() -> None:
    op.drop_index("ix_submissions_submitted_at", table_name="submissions")
