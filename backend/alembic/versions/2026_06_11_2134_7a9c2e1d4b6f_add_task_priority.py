"""add_task_priority

Revision ID: 7a9c2e1d4b6f
Revises: 1f6a2b3c4d5e
Create Date: 2026-06-11 21:34:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "7a9c2e1d4b6f"
down_revision: Union[str, Sequence[str], None] = "1f6a2b3c4d5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE taskpriority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS priority taskpriority NOT NULL DEFAULT 'MEDIUM'
        """
    )
    op.create_index(op.f("ix_tasks_priority"), "tasks", ["priority"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_tasks_priority"), table_name="tasks")
    op.execute("ALTER TABLE tasks DROP COLUMN IF EXISTS priority")
    op.execute("DROP TYPE IF EXISTS taskpriority")
