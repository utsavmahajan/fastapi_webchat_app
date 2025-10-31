"""adding a new column

Revision ID: e20cd4fa0059
Revises: 7b444c213265
Create Date: 2025-10-31 07:20:41.505923

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e20cd4fa0059'
down_revision: Union[str, Sequence[str], None] = '7b444c213265'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts',sa.Column('Content',sa.String(),nullable=False))
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts','Content')
    pass
