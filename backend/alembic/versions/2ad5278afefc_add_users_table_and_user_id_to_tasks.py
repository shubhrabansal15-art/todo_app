"""add_users_table_and_user_id_to_tasks

Revision ID: 2ad5278afefc
Revises: 0d7a5b1aa72d
Create Date: 2026-08-31 19:17:03.565983

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from auth import hash_password


# revision identifiers, used by Alembic.
revision: str = '2ad5278afefc'
down_revision: Union[str, Sequence[str], None] = '0d7a5b1aa72d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Migration strategy for existing data:
    1. Create the users table.
    2. Add user_id to tasks as NULLABLE initially.
    3. Insert a default 'migrated' user for any pre-existing tasks.
    4. Assign all existing (unowned) tasks to the migrated user.
    5. Make user_id NOT NULL.
    """
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Add user_id as nullable
    op.add_column('tasks', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'], unique=False)

    # 3. Insert a default user for migrating existing tasks
    #    Password: "changeme123" — the migrated user should change this immediately
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "INSERT INTO users (email, password_hash, created_at) "
            "VALUES (:email, :pw, :now)"
        ),
        {
            "email": "migrated@migrated.local",
            "pw": hash_password("changeme123"),
            "now": sa.func.now(),
        },
    )
    migrated_user_id = conn.execute(sa.text("SELECT LAST_INSERT_ID()")).scalar()

    # 4. Assign all existing tasks without a user to the migrated user
    conn.execute(
        sa.text("UPDATE tasks SET user_id = :uid WHERE user_id IS NULL"),
        {"uid": migrated_user_id},
    )

    # 5. Now make user_id NOT NULL and add the foreign key
    op.alter_column('tasks', 'user_id', nullable=False)
    op.create_foreign_key(
        None, 'tasks', 'users', ['user_id'], ['id'], ondelete='CASCADE'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.drop_index(op.f('ix_tasks_user_id'), table_name='tasks')
    op.drop_column('tasks', 'user_id')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
