"""add_urgent_priority

Revision ID: 3a1b2c3d4e5f
Revises: 2ad5278afefc
Create Date: 2026-09-01 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a1b2c3d4e5f'
down_revision: Union[str, Sequence[str], None] = '2ad5278afefc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'urgent' to the task_priority ENUM."""
    # MySQL ENUMs require MODIFY COLUMN to add new values.
    # The existing_type must include ALL values (old + new).
    op.alter_column(
        'tasks',
        'priority',
        type_=sa.Enum('low', 'medium', 'high', 'urgent', name='task_priority'),
        existing_type=sa.Enum('low', 'medium', 'high', name='task_priority'),
        server_default='medium',
    )


def downgrade() -> None:
    """Remove 'urgent' from the task_priority ENUM.

    NOTE: This will fail if any rows have priority='urgent'.
    MySQL requires updating those rows first.
    """
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE tasks SET priority = 'high' WHERE priority = 'urgent'"))
    op.alter_column(
        'tasks',
        'priority',
        type_=sa.Enum('low', 'medium', 'high', name='task_priority'),
        existing_type=sa.Enum('low', 'medium', 'high', 'urgent', name='task_priority'),
        server_default='medium',
    )
