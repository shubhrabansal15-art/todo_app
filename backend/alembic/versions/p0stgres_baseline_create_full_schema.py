"""PostgreSQL baseline: create full schema

Revision ID: p0stgres_baseline
Revises: c5f6a7b8d9e0
Create Date: 2026-09-02 00:00:00.000000

This migration creates the complete current schema for a fresh PostgreSQL database.
It is the starting point for Supabase/production deployment.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision: str = 'p0stgres_baseline'
down_revision: Union[str, Sequence[str], None] = 'c5f6a7b8d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Pre-computed bcrypt hash for migrated user (same as in 2ad5278afefc migration)
MIGRATED_USER_HASH = "$2b$12$5AUmv2SDmdAIlGpCPpnS.uhbpLaOFIgqpmQLD0wkXY/cnGY3cjiDe"


def upgrade() -> None:
    # =============================================
    # Create ENUM types (PostgreSQL-specific)
    # =============================================
    task_priority = sa.Enum('low', 'medium', 'high', 'urgent', name='task_priority')
    task_status = sa.Enum('todo', 'in_progress', 'done', name='task_status')
    project_status = sa.Enum('active', 'completed', 'archived', name='project_status')
    project_priority = sa.Enum('low', 'medium', 'high', 'urgent', name='project_priority')
    reminder_status = sa.Enum('pending', 'completed', 'dismissed', name='reminder_status')

    task_priority.create(op.get_bind(), checkfirst=True)
    task_status.create(op.get_bind(), checkfirst=True)
    project_status.create(op.get_bind(), checkfirst=True)
    project_priority.create(op.get_bind(), checkfirst=True)
    reminder_status.create(op.get_bind(), checkfirst=True)

    # =============================================
    # Users table
    # =============================================
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Insert migrated internal user
    users_table = sa.table(
        'users',
        sa.column('id', sa.Integer),
        sa.column('email', sa.String),
        sa.column('password_hash', sa.String),
        sa.column('created_at', sa.DateTime),
    )
    op.bulk_insert(
        users_table,
        [{
            'email': 'migrated@internal.invalid',
            'password_hash': MIGRATED_USER_HASH,
            'created_at': datetime.now(timezone.utc).replace(tzinfo=None),
        }],
    )

    # =============================================
    # Tasks table
    # =============================================
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('priority', task_priority, nullable=False, server_default='medium'),
        sa.Column('status', task_status, nullable=False, server_default='todo'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)

    # Assign any existing tasks to migrated user (for safety)
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id FROM users WHERE email = 'migrated@internal.invalid'"))
    migrated_user_id = result.scalar()
    conn.execute(
        sa.text("UPDATE tasks SET user_id = :uid WHERE user_id IS NULL"),
        {"uid": migrated_user_id},
    )

    # Now add foreign keys after data is in place
    op.create_foreign_key('tasks_user_id_fkey', 'tasks', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # =============================================
    # Projects table
    # =============================================
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', project_status, nullable=False, server_default='active'),
        sa.Column('priority', project_priority, nullable=False, server_default='medium'),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=False, server_default='#6366f1'),
        sa.Column('icon', sa.String(length=10), nullable=False, server_default='📁'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_projects_user_id'), 'projects', ['user_id'], unique=False)

    # Add project_id foreign key to tasks (column already created above)
    op.create_foreign_key('tasks_project_id_fkey', 'tasks', 'projects', ['project_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_tasks_project_id'), 'tasks', ['project_id'], unique=False)

    # =============================================
    # Reminders table
    # =============================================
    op.create_table(
        'reminders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reminder_date', sa.Date(), nullable=False),
        sa.Column('reminder_time', sa.Time(), nullable=True),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('status', reminder_status, nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reminders_user_id'), 'reminders', ['user_id'], unique=False)
    op.create_index(op.f('ix_reminders_status'), 'reminders', ['status'], unique=False)
    op.create_foreign_key('reminders_task_id_fkey', 'reminders', 'tasks', ['task_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_reminders_task_id'), 'reminders', ['task_id'], unique=False)
    op.create_foreign_key('reminders_project_id_fkey', 'reminders', 'projects', ['project_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_reminders_project_id'), 'reminders', ['project_id'], unique=False)


def downgrade() -> None:
    op.drop_table('reminders')
    op.drop_table('projects')

    # Remove foreign keys and columns from tasks
    op.drop_constraint('tasks_project_id_fkey', 'tasks', type_='foreignkey')
    op.drop_index(op.f('ix_tasks_project_id'), table_name='tasks')
    op.drop_column('tasks', 'project_id')

    op.drop_constraint('tasks_user_id_fkey', 'tasks', type_='foreignkey')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_table('tasks')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS reminder_status")
    op.execute("DROP TYPE IF EXISTS project_priority")
    op.execute("DROP TYPE IF EXISTS project_status")
    op.execute("DROP TYPE IF EXISTS task_status")
    op.execute("DROP TYPE IF EXISTS task_priority")
