"""Add role_locked flag to users.

When True, the user's role has been chosen at signup and cannot be changed
(except by the admin "break glass" endpoint). Existing users are migrated
with role_locked=true to preserve their current role.

Revision ID: 005
Revises: 004
Create Date: 2026-05-12
"""

from alembic import op
import sqlalchemy as sa


revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role_locked", sa.Boolean, nullable=False, server_default=sa.false()),
    )
    # All existing users have already implicitly chosen their role, so lock
    # them in. New users created after this migration will start with
    # role_locked=false until they pick on first login.
    op.execute("UPDATE users SET role_locked = true")


def downgrade() -> None:
    op.drop_column("users", "role_locked")
