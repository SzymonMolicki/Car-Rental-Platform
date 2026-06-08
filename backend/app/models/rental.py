from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Rental(Base):
    __tablename__ = "rental"

    rental_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    customer_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("customer.customer_id"), nullable=False)
    car_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("car.car_id"), nullable=False)
    pickup_location_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("location.location_id"), nullable=False)
    return_location_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("location.location_id"), nullable=False)
    rental_status_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("rental_status.rental_status_id"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    planned_end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    actual_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)
