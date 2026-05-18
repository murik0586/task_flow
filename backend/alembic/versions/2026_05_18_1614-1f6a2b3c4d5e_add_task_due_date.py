"""add_task_due_date

Revision ID: 1f6a2b3c4d5e
Revises: 8fcc2f378333
Create Date: 2026-05-18 16:14:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "1f6a2b3c4d5e"
down_revision: Union[str, Sequence[str], None] = "8fcc2f378333"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE tasks DROP COLUMN IF EXISTS due_date")
