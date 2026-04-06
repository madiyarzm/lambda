"""Add feedback column to submissions; add test_code to assignments (already in model, ensure column exists).

Revision ID: 002
Revises: 001
Create Date: 2026-04-05
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("submissions", sa.Column("feedback", sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column("submissions", "feedback")
