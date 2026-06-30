"""add unique invoice rental id

Revision ID: 9f2a6b7c8d9e
Revises: 1c2f3a4b5d6e
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9f2a6b7c8d9e"
down_revision: Union[str, Sequence[str], None] = "1c2f3a4b5d6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_invoice_rental_id", "invoice", ["rental_id"])


def downgrade() -> None:
    op.drop_constraint("uq_invoice_rental_id", "invoice", type_="unique")
