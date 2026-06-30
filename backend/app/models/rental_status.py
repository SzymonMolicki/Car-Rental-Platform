from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.rental import Rental


class RentalStatus(Base):
    __tablename__ = "rental_status"

    rental_status_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    rentals: Mapped[list["Rental"]] = relationship(back_populates="rental_status")
