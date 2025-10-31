"""add forign key to posts

Revision ID: e490b5a28fd7
Revises: fd982e11b6de
Create Date: 2025-10-31 07:41:33.509142

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e490b5a28fd7'
down_revision: Union[str, Sequence[str], None] = 'fd982e11b6de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts',sa.Column('owner_id',sa.Integer(),nullable=False))
    op.create_foreign_key('post_user_fk',source_table='posts',referent_table='user',
                          local_cols=['owner_id'],remote_cols=['id'],ondelete="CASCADE")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('post_user_fk',table_name="posts")
    op.drop_column("posts","owner_id")
    pass
