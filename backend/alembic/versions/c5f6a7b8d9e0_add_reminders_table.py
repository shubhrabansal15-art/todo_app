"""add_reminders_table

Revision ID: c5f6a7b8d9e0
Revises: b4e5f6a7c8d9
Create Date: 2026-09-01 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5f6a7b8d9e0'
down_revision: Union[str, Sequence[str], None] = 'b4e5f6a7c8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the reminders table
    op.create_table(
        'reminders',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reminder_date', sa.Date(), nullable=False),
        sa.Column('reminder_time', sa.Time(), nullable=True),
        sa.Column(
            'task_id',
            sa.Integer(),
            sa.ForeignKey('tasks.id', ondelete='SET NULL'),
            nullable=True,
            index=True,
        ),
        sa.Column(
            'project_id',
            sa.Integer(),
            sa.ForeignKey('projects.id', ondelete='SET NULL'),
            nullable=True,
            index=True,
        ),
        sa.Column(
            'status',
            sa.Enum('pending', 'completed', 'dismissed', name='reminder_status'),
            server_default='pending',
            nullable=False,
            index=True,
        ),
        sa.Column(
            'created_at',
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table('reminders')
    op.execute("DROP TYPE IF EXISTS reminder_status")
