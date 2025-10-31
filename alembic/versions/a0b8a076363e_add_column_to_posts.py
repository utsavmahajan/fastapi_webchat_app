"""add column to posts

Revision ID: a0b8a076363e
Revises: e490b5a28fd7
Create Date: 2025-10-31 07:48:53.527642

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0b8a076363e'
down_revision: Union[str, Sequence[str], None] = 'e490b5a28fd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts',sa.Column(
        'published',sa.Boolean(),nullable=False,server_default='True')),
    op.add_column('posts',sa.Column('created_at',sa.TIMESTAMP(timezone=True),nullable=False,server_default=sa.text('NOW()')))
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts','published')
    op.drop_column('posts','created_at')
    pass
