"""add_projects_and_project_id_to_tasks

Revision ID: b4e5f6a7c8d9
Revises: 3a1b2c3d4e5f
Create Date: 2026-09-01 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4e5f6a7c8d9'
down_revision: Union[str, Sequence[str], None] = '3a1b2c3d4e5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            'user_id',
            sa.Integer(),
            sa.ForeignKey('users.id', ondelete='CASCADE'),
            nullable=False,
            index=True,
        ),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'status',
            sa.Enum('active', 'completed', 'archived', name='project_status'),
            server_default='active',
            nullable=False,
        ),
        sa.Column(
            'priority',
            sa.Enum('low', 'medium', 'high', 'urgent', name='project_priority'),
            server_default='medium',
            nullable=False,
        ),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('color', sa.String(7), server_default='#6366f1', nullable=False),
        sa.Column('icon', sa.String(10), server_default='📁', nullable=False),
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

    # 2. Add project_id column to tasks table (nullable, so existing tasks keep working)
    op.add_column(
        'tasks',
        sa.Column(
            'project_id',
            sa.Integer(),
            sa.ForeignKey('projects.id', ondelete='SET NULL'),
            nullable=True,
            index=True,
        ),
    )


def downgrade() -> None:
    # Remove project_id from tasks
    op.drop_index('ix_tasks_project_id', table_name='tasks')
    op.drop_constraint('fk_tasks_project_id_projects', 'tasks', type_='foreignkey')
    op.drop_column('tasks', 'project_id')

    # Drop projects table
    op.drop_table('projects')

    # Drop enums
    op.execute("DROP TYPE IF EXISTS project_priority")
    op.execute("DROP TYPE IF EXISTS project_status")
