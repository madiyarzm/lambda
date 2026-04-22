"""Add xp and cosmetics columns to users table.

Revision ID: 003
Revises: 002
Create Date: 2026-04-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("xp", sa.Integer, nullable=False, server_default="0"))
    op.add_column("users", sa.Column("cosmetics", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("users", "cosmetics")
    op.drop_column("users", "xp")
