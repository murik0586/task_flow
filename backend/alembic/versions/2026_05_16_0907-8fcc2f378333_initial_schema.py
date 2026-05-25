"""initial_schema

Revision ID: 8fcc2f378333
Create Date: 2026-05-16 09:07:58.698340

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8fcc2f378333'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE taskstatus AS ENUM ('OPEN', 'WORK', 'WAITING', 'CLOSE', 'CANCELLED');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    task_status = postgresql.ENUM(
        "OPEN",
        "WORK",
        "WAITING",
        "CLOSE",
        "CANCELLED",
        name="taskstatus",
        create_type=False,
    )

    op.create_table(
        "users",
        sa.Column("id",
                  sa.Integer(), nullable=False),
        sa.Column("first_name",
                  sa.String(length=50), nullable=False),
        sa.Column("second_name",
                  sa.String(length=50), nullable=False),
        sa.Column("login",
                  sa.String(length=50), nullable=False),
        sa.Column("password_hash",
                  sa.String(length=128), nullable=False),
        sa.Column("email",
                  sa.String(length=128), nullable=True),
        sa.Column("created_at",
                  sa.DateTime(timezone=True), nullable=False),
        sa.Column("password_updated_at",
                  sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_login"), "users", ["login"], unique=True)

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categories_id"),
                    "categories", ["id"], unique=False)
    op.create_index(op.f("ix_categories_name"),
                    "categories", ["name"], unique=True)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", task_status, nullable=False),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("initial_assessment_seconds", sa.Integer(), nullable=True),
        sa.Column("final_assessment_seconds", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["category_id"],
                                ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"],
                                ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_category_id"),
                    "tasks", ["category_id"], unique=False)
    op.create_index(op.f("ix_tasks_id"),
                    "tasks", ["id"], unique=False)
    op.create_index(op.f("ix_tasks_status"),
                    "tasks", ["status"], unique=False)
    op.create_index(op.f("ix_tasks_user_id"),
                    "tasks", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_tasks_user_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_status"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_category_id"), table_name="tasks")
    op.drop_table("tasks")

    op.drop_index(op.f("ix_categories_name"), table_name="categories")
    op.drop_index(op.f("ix_categories_id"), table_name="categories")
    op.drop_table("categories")

    op.drop_index(op.f("ix_users_login"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS taskstatus")
